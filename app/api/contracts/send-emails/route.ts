import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  console.log('=== SEND EMAILS WITH RESEND ===');
  
  try {
    const { contractId } = await request.json();
    console.log('Contract ID:', contractId);

    const supabase = createClient();
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      console.error('Contract not found:', error);
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Generar tokens únicos
    const locadorToken = generateToken();
    const locatarioToken = generateToken();

    await supabase
      .from('contracts')
      .update({
        locador_firma_token: locadorToken,
        locatario_firma_token: locatarioToken
      })
      .eq('id', contractId);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firmadigitalsimple.vercel.app';
    const locadorUrl = `${baseUrl}/firma/${contractId}?token=${locadorToken}&tipo=locador`;
    const locatarioUrl = `${baseUrl}/firma/${contractId}?token=${locatarioToken}&tipo=locatario`;

    // Email a locador
    console.log('Sending to locador:', contract.locador_email);
    
    try {
      const { data: locadorData, error: locadorError } = await resend.emails.send({
        from: 'FDS - Firma Digital <onboarding@resend.dev>', // Temporal - cambiar después
        to: contract.locador_email,
        subject: '📄 Contrato para firmar - FDS',
        html: generateEmailHTML('locador', contract, locadorUrl)
      });

      if (locadorError) {
        console.error('Error sending to locador:', locadorError);
        throw locadorError;
      }
      
      console.log('✓ Email sent to locador:', locadorData);
    } catch (err) {
      console.error('Resend error (locador):', err);
      throw err;
    }

    // Email a locatario
    console.log('Sending to locatario:', contract.locatario_email);
    
    try {
      const { data: locatarioData, error: locatarioError } = await resend.emails.send({
        from: 'FDS - Firma Digital <onboarding@resend.dev>', // Temporal - cambiar después
        to: contract.locatario_email,
        subject: '📄 Contrato para firmar - FDS',
        html: generateEmailHTML('locatario', contract, locatarioUrl)
      });

      if (locatarioError) {
        console.error('Error sending to locatario:', locatarioError);
        throw locatarioError;
      }
      
      console.log('✓ Email sent to locatario:', locatarioData);
    } catch (err) {
      console.error('Resend error (locatario):', err);
      throw err;
    }

    console.log('=== EMAILS SENT SUCCESSFULLY ===');
    return NextResponse.json({ 
      success: true,
      message: 'Emails sent via Resend'
    });

  } catch (error: any) {
    console.error('❌ EMAIL ERROR:', error);
    return NextResponse.json({ 
      error: error.message,
      details: error 
    }, { status: 500 });
  }
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function generateEmailHTML(tipo: string, contract: any, url: string): string {
  const nombre = tipo === 'locador' ? contract.locador_nombre : contract.locatario_nombre;
  const rol = tipo === 'locador' ? 'Locador (Propietario)' : 'Locatario (Inquilino)';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content { 
      padding: 40px 30px;
    }
    .content h2 {
      color: #1f2937;
      font-size: 20px;
      margin-top: 0;
    }
    .details {
      background-color: #f9fafb;
      border-left: 4px solid #4F46E5;
      padding: 20px;
      margin: 25px 0;
    }
    .details h3 {
      margin-top: 0;
      color: #4F46E5;
      font-size: 16px;
    }
    .details ul {
      list-style: none;
      padding: 0;
      margin: 10px 0 0 0;
    }
    .details li {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .details li:last-child {
      border-bottom: none;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button { 
      display: inline-block;
      background: #4F46E5;
      color: white !important;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: #4338CA;
    }
    .info-box {
      background-color: #FEF3C7;
      border: 1px solid #FCD34D;
      border-radius: 8px;
      padding: 16px;
      margin: 25px 0;
    }
    .info-box p {
      margin: 0;
      color: #92400E;
      font-size: 14px;
    }
    .footer { 
      text-align: center; 
      padding: 30px;
      color: #6b7280;
      font-size: 12px;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #4F46E5;
      text-decoration: none;
    }
    .link-fallback {
      margin-top: 20px;
      padding: 15px;
      background-color: #f3f4f6;
      border-radius: 6px;
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FDS - Firma Digital Simple</h1>
      <p>by DasLATAM</p>
    </div>
    
    <div class="content">
      <h2>Hola ${nombre},</h2>
      
      <p>Se ha generado un nuevo <strong>Contrato de Locación Temporaria</strong> donde figuras como <strong>${rol}</strong>.</p>
      
      <div class="details">
        <h3>📄 Detalles del Contrato</h3>
        <ul>
          <li><strong>Inmueble:</strong> ${contract.inmueble_direccion}</li>
          <li><strong>Barrio:</strong> ${contract.inmueble_barrio}, Lote ${contract.inmueble_lote}</li>
          <li><strong>Período:</strong> ${new Date(contract.fecha_inicio).toLocaleDateString('es-AR')} - ${new Date(contract.fecha_fin).toLocaleDateString('es-AR')}</li>
          <li><strong>Duración:</strong> ${contract.noches} noches</li>
          <li><strong>Precio Total:</strong> ${contract.moneda} ${contract.precio_total.toLocaleString('es-AR')}</li>
        </ul>
      </div>
      
      <p>Para firmar digitalmente este contrato, haz clic en el siguiente botón:</p>
      
      <div class="button-container">
        <a href="${url}" class="button">✍️ Firmar Contrato Ahora</a>
      </div>
      
      <div class="info-box">
        <p><strong>⏰ Importante:</strong> Este enlace es único, personal e intransferible. Es válido por 30 días.</p>
      </div>
      
      <div class="link-fallback">
        <strong>Si el botón no funciona, copia y pega este enlace en tu navegador:</strong><br>
        ${url}
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <strong>Validez Legal:</strong> Tu firma digital tendrá plena validez jurídica según la Ley 25.506 de Firma Digital y el Artículo 288 del Código Civil y Comercial de la Nación.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>FDS - Firma Digital Simple</strong></p>
      <p>Sistema de firma digital 100% legal y seguro</p>
      <p style="margin-top: 15px;">
        <a href="https://firmadigitalsimple.vercel.app">firmadigitalsimple.vercel.app</a>
      </p>
      <p style="margin-top: 15px;">© 2026 DasLATAM. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}