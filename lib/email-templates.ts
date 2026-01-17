interface SignerInvitation {
  signerName: string;
  documentTitle: string;
  signUrl: string;
  expiresAt?: string;
}

export function generateSignerInvitationEmail({
  signerName,
  documentTitle,
  signUrl,
  expiresAt,
}: SignerInvitation): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">📝 Documento para Firmar</h1>
    <p style="margin: 10px 0 0 0;">FDS - Firma Digital Simple</p>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2>Hola ${signerName},</h2>
    
    <p>Has sido invitado/a a firmar digitalmente el siguiente documento:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <strong>📄 Documento:</strong><br>
      ${documentTitle}
    </div>
    
    <p>Tu firma digital tiene plena validez jurídica según la Ley 25.506 de Firma Digital de Argentina.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${signUrl}" style="display: inline-block; background: #4F46E5; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">✍️ Firmar Documento</a>
    </div>
    
    ${expiresAt ? `
    <p style="color: #ef4444; font-size: 14px;">
      ⏰ <strong>Importante:</strong> Este enlace expira el ${new Date(expiresAt).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </p>
    ` : ''}
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${signUrl}" style="color: #4F46E5; word-break: break-all;">${signUrl}</a>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
    <p><strong>FDS - Firma Digital Simple</strong></p>
    <p>Sistema de firma digital 100% legal y seguro</p>
    <p>© 2026 DasLATAM. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `;
}

export function generateSignatureCompletedEmail({
  documentTitle,
  allSigned,
}: {
  documentTitle: string;
  allSigned: boolean;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1>✅ Firma ${allSigned ? 'Completada' : 'Registrada'}</h1>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb;">
    <h2>Documento: ${documentTitle}</h2>
    
    ${allSigned ? `
      <p>🎉 <strong>¡Excelente noticia!</strong> Todas las partes han firmado el documento.</p>
      <p>El documento está ahora completo y tiene plena validez legal.</p>
    ` : `
      <p>✅ Tu firma ha sido registrada exitosamente.</p>
      <p>El documento está esperando la firma de otras partes.</p>
    `}
    
    <p>Gracias por usar FDS - Firma Digital Simple.</p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px;">
    <p><strong>FDS - Firma Digital Simple</strong></p>
    <p>© 2026 DasLATAM</p>
  </div>
</body>
</html>
  `;
}
