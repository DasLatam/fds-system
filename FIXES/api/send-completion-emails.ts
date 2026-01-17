import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    const supabase = createClient();

    // Get document
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Get ALL signers (ya firmaron todos)
    const { data: signers } = await supabase
      .from('signers')
      .select('*')
      .eq('document_id', documentId);

    if (!signers || signers.length === 0) {
      return NextResponse.json({ message: 'No hay firmantes' });
    }

    // Send completion email to each signer
    const results = [];
    for (const signer of signers) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'FDS <noreply@daslatam.org>',
          to: signer.email,
          subject: `✅ Documento firmado completamente: ${document.title}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1>✅ Documento Completado</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb;">
    <h2>Hola ${signer.name},</h2>
    
    <p>🎉 <strong>¡Excelente noticia!</strong> Todas las partes han firmado el documento:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <strong>📄 Documento:</strong><br>
      ${document.title}
    </div>
    
    <p><strong>El documento está ahora completo y tiene plena validez legal.</strong></p>
    
    <p>Cada firma ha sido registrada con:</p>
    <ul>
      <li>Timestamp certificado</li>
      <li>Dirección IP</li>
      <li>Datos personales verificados</li>
      <li>Firma manuscrita digital</li>
    </ul>
    
    <p>Este documento cumple con la <strong>Ley 25.506 de Firma Digital</strong> de Argentina y tiene la misma validez que una firma manuscrita en papel.</p>
    
    <p style="margin-top: 30px;">Gracias por usar FDS - Firma Digital Simple.</p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
    <p><strong>FDS - Firma Digital Simple</strong></p>
    <p>© 2026 DasLATAM</p>
  </div>
</body>
</html>
          `,
        });

        if (error) {
          console.error(`Error sending to ${signer.email}:`, error);
          results.push({ email: signer.email, success: false, error });
        } else {
          results.push({ email: signer.email, success: true, id: data?.id });
        }
      } catch (err) {
        results.push({ email: signer.email, success: false, error: err });
      }
    }

    // Also send to document owner
    const { data: org } = await supabase
      .from('organizations')
      .select('email')
      .eq('id', document.organization_id)
      .single();

    if (org) {
      await resend.emails.send({
        from: 'FDS <noreply@daslatam.org>',
        to: org.email,
        subject: `✅ Documento completado: ${document.title}`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>✅ Documento Completado</h2>
  <p><strong>Documento:</strong> ${document.title}</p>
  <p>Todas las partes han firmado el documento exitosamente.</p>
  <p>Puedes ver el documento completo en tu dashboard.</p>
</body>
</html>
        `,
      });
    }

    return NextResponse.json({ results, success: true });
  } catch (error: any) {
    console.error('Send completion emails error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
