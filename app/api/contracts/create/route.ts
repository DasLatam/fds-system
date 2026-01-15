import { createClient } from '@/lib/supabase/server';
import { generateContractPDF } from '@/lib/pdf-generator';
import { sendEmail, getContractInvitationEmail } from '@/lib/email';
import { contractRatelimit } from '@/lib/ratelimit';
import { logAudit, getClientIP, getUserAgent } from '@/lib/audit';
import { NextResponse } from 'next/server';
import type { Contract } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Rate limiting para creación de contratos
    const ip = getClientIP(request) || 'unknown';
    const userAgent = getUserAgent(request);
    const { success: rateLimitOk } = await contractRatelimit.limit(ip);
    
    if (!rateLimitOk) {
      return NextResponse.json({ 
        error: 'Demasiados contratos creados. Por favor espera un momento.' 
      }, { status: 429 });
    }
    
    const supabase = createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    
    // Obtener datos del formulario
    const formData = await request.json();
    
    // Generar tokens únicos para las firmas
    const tokenLocador = crypto.randomUUID();
    const tokenLocatario = crypto.randomUUID();
    
    // Crear el contrato en la base de datos
    const contractData: Partial<Contract> = {
      created_by: user.id,
      status: 'pendiente',
      
      // Locador
      locador_nombre: formData.locador_nombre,
      locador_dni: formData.locador_dni,
      locador_domicilio: formData.locador_domicilio,
      locador_email: formData.locador_email,
      
      // Locatario
      locatario_nombre: formData.locatario_nombre,
      locatario_dni: formData.locatario_dni,
      locatario_domicilio: formData.locatario_domicilio,
      locatario_email: formData.locatario_email,
      
      // Inmueble
      inmueble_direccion: formData.inmueble_direccion,
      inmueble_barrio: formData.inmueble_barrio,
      inmueble_lote: formData.inmueble_lote,
      inmueble_partido: formData.inmueble_partido,
      inmueble_provincia: formData.inmueble_provincia,
      
      // Contrato
      plazo_noches: parseInt(formData.plazo_noches),
      fecha_inicio: formData.fecha_inicio,
      hora_inicio: formData.hora_inicio,
      fecha_fin: formData.fecha_fin,
      hora_fin: formData.hora_fin,
      precio_total: parseFloat(formData.precio_total),
      precio_moneda: formData.precio_moneda,
      max_personas: parseInt(formData.max_personas),
      deposito_garantia: parseFloat(formData.deposito_garantia),
      
      // Tokens
      token_locador: tokenLocador,
      token_locatario: tokenLocatario,
    };
    
    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert([contractData])
      .select()
      .single();
    
    if (insertError || !contract) {
      console.error('Error insertando contrato:', insertError);
      return NextResponse.json({ error: 'Error al crear el contrato' }, { status: 500 });
    }
    
    // Generar el PDF del contrato
    try {
      const pdfBuffer = await generateContractPDF(contract as Contract);
      
      // Subir el PDF a Supabase Storage
      const fileName = `contract-${contract.id}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error subiendo PDF:', uploadError);
      } else {
        // Obtener URL pública del PDF
        const { data: { publicUrl } } = supabase.storage
          .from('contracts')
          .getPublicUrl(fileName);
        
        // Actualizar el contrato con la URL del PDF
        await supabase
          .from('contracts')
          .update({ pdf_original_url: publicUrl })
          .eq('id', contract.id);
      }
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
      // Continuamos aunque falle el PDF
    }
    
    // Crear registros de firma pendientes
    await supabase.from('signature_requests').insert([
      {
        contract_id: contract.id,
        role: 'locador',
        token: tokenLocador,
      },
      {
        contract_id: contract.id,
        role: 'locatario',
        token: tokenLocatario,
      },
    ]);
    
    // Enviar emails de invitación
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Email al locador
    const locadorEmail = getContractInvitationEmail(
      formData.locador_nombre,
      'locador',
      contract.id,
      `${appUrl}/firma/${tokenLocador}`
    );
    locadorEmail.to = formData.locador_email;
    await sendEmail(locadorEmail);
    
    // Email al locatario
    const locatarioEmail = getContractInvitationEmail(
      formData.locatario_nombre,
      'locatario',
      contract.id,
      `${appUrl}/firma/${tokenLocatario}`
    );
    locatarioEmail.to = formData.locatario_email;
    await sendEmail(locatarioEmail);
    
    // Audit log
    await logAudit({
      userId: user.id,
      action: 'contract.create',
      entityType: 'contract',
      entityId: contract.id,
      ipAddress: ip,
      userAgent,
      metadata: {
        locador_email: formData.locador_email,
        locatario_email: formData.locatario_email,
        inmueble: formData.inmueble_direccion,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      contract,
      message: 'Contrato creado y emails enviados exitosamente'
    });
    
  } catch (error: any) {
    console.error('Error en /api/contracts/create:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
