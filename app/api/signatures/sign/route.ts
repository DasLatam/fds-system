import { createClient } from '@/lib/supabase/server';
import { addSignaturesToPDF } from '@/lib/pdf-generator';
import { sendEmail, getContractSignedEmail, getContractCompleteEmail } from '@/lib/email';
import { dataURLtoBuffer } from '@/lib/pdf-generator';
import { signatureRatelimit } from '@/lib/ratelimit';
import { logAudit, getClientIP, getUserAgent } from '@/lib/audit';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Rate limiting (más restrictivo para firmas)
    const ip = getClientIP(request) || 'unknown';
    const userAgent = getUserAgent(request);
    const { success: rateLimitOk } = await signatureRatelimit.limit(ip);
    
    if (!rateLimitOk) {
      await logAudit({
        action: 'signature.sign',
        entityType: 'signature',
        ipAddress: ip,
        userAgent,
        metadata: { error: 'Rate limit exceeded' },
      });
      
      return NextResponse.json({ 
        error: 'Demasiados intentos de firma. Por favor espera un momento.' 
      }, { status: 429 });
    }
    
    const { token, signature } = await request.json();
    
    if (!token || !signature) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }
    
    const supabase = createClient();
    
    // Buscar el contrato
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .or(`token_locador.eq.${token},token_locatario.eq.${token}`)
      .single();
    
    if (contractError || !contract) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }
    
    // Determinar el rol
    const role = contract.token_locador === token ? 'locador' : 'locatario';
    
    // Convertir la firma de data URL a buffer
    const signatureBuffer = dataURLtoBuffer(signature);
    
    // Subir la firma a Storage
    const signatureFileName = `signature-${contract.id}-${role}.png`;
    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(signatureFileName, signatureBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error subiendo firma:', uploadError);
      return NextResponse.json({ error: 'Error al guardar la firma' }, { status: 500 });
    }
    
    // Obtener URL pública de la firma
    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(signatureFileName);
    
    // Actualizar el contrato con la firma
    const updateData = role === 'locador' 
      ? {
          locador_firma: publicUrl,
          locador_firmado_at: new Date().toISOString(),
        }
      : {
          locatario_firma: publicUrl,
          locatario_firmado_at: new Date().toISOString(),
        };
    
    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contract.id);
    
    if (updateError) {
      console.error('Error actualizando contrato:', updateError);
      return NextResponse.json({ error: 'Error al actualizar el contrato' }, { status: 500 });
    }
    
    // Actualizar signature_requests con tracking completo
    await supabase
      .from('signature_requests')
      .update({
        signed: true,
        signed_at: new Date().toISOString(),
        signed_ip: ip,
        signed_user_agent: userAgent,
        consent_accepted_at: new Date().toISOString(),
      })
      .eq('contract_id', contract.id)
      .eq('role', role);
    
    // Audit log de firma
    await logAudit({
      action: 'signature.sign',
      entityType: 'signature',
      entityId: contract.id,
      ipAddress: ip,
      userAgent,
      metadata: { role, contract_id: contract.id },
    });
    
    // Obtener el contrato actualizado
    const { data: updatedContract } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contract.id)
      .single();
    
    if (!updatedContract) {
      return NextResponse.json({ error: 'Error al obtener contrato actualizado' }, { status: 500 });
    }
    
    // Verificar si ambos ya firmaron
    const locadorFirmado = !!updatedContract.locador_firmado_at;
    const locatarioFirmado = !!updatedContract.locatario_firmado_at;
    const ambosFirmaron = locadorFirmado && locatarioFirmado;
    
    // Actualizar el status del contrato
    const newStatus = ambosFirmaron ? 'firmado_completo' : 'firmado_parcial';
    await supabase
      .from('contracts')
      .update({ status: newStatus })
      .eq('id', contract.id);
    
    // Enviar notificaciones por email
    if (ambosFirmaron) {
      // Ambos firmaron - generar PDF final y enviar a todos
      try {
        // Descargar el PDF original
        const pdfResponse = await fetch(updatedContract.pdf_original_url);
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
        
        // Agregar las firmas al PDF
        const finalPdfBuffer = await addSignaturesToPDF(
          pdfBuffer,
          updatedContract.locador_firma,
          updatedContract.locatario_firma
        );
        
        // Subir el PDF final
        const finalPdfFileName = `contract-${contract.id}-signed.pdf`;
        await supabase.storage
          .from('contracts')
          .upload(finalPdfFileName, finalPdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        // Obtener URL del PDF final
        const { data: { publicUrl: finalPdfUrl } } = supabase.storage
          .from('contracts')
          .getPublicUrl(finalPdfFileName);
        
        // Actualizar contrato con URL del PDF firmado
        await supabase
          .from('contracts')
          .update({ pdf_firmado_url: finalPdfUrl })
          .eq('id', contract.id);
        
        // Enviar emails a ambas partes y a la inmobiliaria
        const locadorEmail = getContractCompleteEmail(
          updatedContract.locador_nombre,
          finalPdfUrl
        );
        locadorEmail.to = updatedContract.locador_email;
        await sendEmail(locadorEmail);
        
        const locatarioEmail = getContractCompleteEmail(
          updatedContract.locatario_nombre,
          finalPdfUrl
        );
        locatarioEmail.to = updatedContract.locatario_email;
        await sendEmail(locatarioEmail);
        
        // Email a la inmobiliaria
        const { data: inmobiliaria } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', updatedContract.created_by)
          .single();
        
        if (inmobiliaria) {
          const inmobiliariaEmail = getContractCompleteEmail(
            inmobiliaria.full_name,
            finalPdfUrl
          );
          inmobiliariaEmail.to = inmobiliaria.email;
          await sendEmail(inmobiliariaEmail);
        }
      } catch (pdfError) {
        console.error('Error generando PDF final:', pdfError);
      }
    } else {
      // Solo firmó una parte - notificar a la otra
      const otherRole = role === 'locador' ? 'locatario' : 'locador';
      const otherName = role === 'locador' 
        ? updatedContract.locatario_nombre 
        : updatedContract.locador_nombre;
      const otherEmail = role === 'locador' 
        ? updatedContract.locatario_email 
        : updatedContract.locador_email;
      
      const notificationEmail = getContractSignedEmail(otherName, role);
      notificationEmail.to = otherEmail;
      await sendEmail(notificationEmail);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: ambosFirmaron 
        ? 'Contrato firmado completamente' 
        : 'Tu firma ha sido registrada exitosamente',
      completed: ambosFirmaron
    });
    
  } catch (error: any) {
    console.error('Error en /api/signatures/sign:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
