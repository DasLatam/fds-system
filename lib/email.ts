import nodemailer from 'nodemailer';
import type { EmailTemplate } from '@/types';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }: EmailTemplate) {
  try {
    const info = await transporter.sendMail({
      from: `"FDS - DasLATAM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error };
  }
}

// Plantillas de email
export function getContractInvitationEmail(
  recipientName: string,
  role: 'locador' | 'locatario',
  contractId: string,
  signatureLink: string
): EmailTemplate {
  const roleText = role === 'locador' ? 'Locador' : 'Locatario';
  
  return {
    to: '',
    subject: `Contrato de Alquiler - Firma requerida (${roleText})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; padding: 15px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .logo { width: 80px; height: 80px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="DasLATAM" class="logo">
            <h1>FDS - Firma Digital Simple</h1>
          </div>
          <div class="content">
            <h2>Hola ${recipientName},</h2>
            <p>Se ha generado un nuevo contrato de alquiler temporario que requiere tu firma como <strong>${roleText}</strong>.</p>
            <p>Para revisar y firmar el contrato, haz clic en el siguiente botón:</p>
            <center>
              <a href="${signatureLink}" class="button">Firmar Contrato</a>
            </center>
            <p><small>O copia este enlace en tu navegador:<br>${signatureLink}</small></p>
            <p>Este enlace es único y personal. No lo compartas con nadie.</p>
            <p><strong>Importante:</strong> El contrato debe ser firmado por ambas partes para ser válido.</p>
          </div>
          <div class="footer">
            <p>© 2026 DasLATAM - Firma Digital Simple (FDS)<br>
            Este es un correo automático, por favor no respondas.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function getContractSignedEmail(
  recipientName: string,
  signerRole: 'locador' | 'locatario'
): EmailTemplate {
  const roleText = signerRole === 'locador' ? 'el Locador' : 'el Locatario';
  
  return {
    to: '',
    subject: 'Contrato firmado por una de las partes',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #06B6D4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .logo { width: 80px; height: 80px; margin-bottom: 15px; }
          .success { background: #d1fae5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="DasLATAM" class="logo">
            <h1>✓ Firma Recibida</h1>
          </div>
          <div class="content">
            <h2>Hola ${recipientName},</h2>
            <div class="success">
              <p><strong>Buenas noticias!</strong> ${roleText} ha firmado el contrato de alquiler.</p>
            </div>
            <p>El contrato está pendiente de la firma de la otra parte. Te notificaremos cuando el proceso esté completo.</p>
          </div>
          <div class="footer">
            <p>© 2026 DasLATAM - Firma Digital Simple (FDS)</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function getContractCompleteEmail(
  recipientName: string,
  pdfUrl: string
): EmailTemplate {
  return {
    to: '',
    subject: '¡Contrato completamente firmado!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; padding: 15px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .logo { width: 80px; height: 80px; margin-bottom: 15px; }
          .success { background: #d1fae5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo.png" alt="DasLATAM" class="logo">
            <h1>🎉 Contrato Completo</h1>
          </div>
          <div class="content">
            <h2>Hola ${recipientName},</h2>
            <div class="success">
              <p><strong>¡Excelentes noticias!</strong> El contrato ha sido firmado por ambas partes.</p>
            </div>
            <p>El contrato está ahora legalmente válido y puedes descargarlo en el siguiente enlace:</p>
            <center>
              <a href="${pdfUrl}" class="button">Descargar Contrato Firmado</a>
            </center>
            <p><strong>Importante:</strong> Guarda una copia de este contrato para tus registros.</p>
          </div>
          <div class="footer">
            <p>© 2026 DasLATAM - Firma Digital Simple (FDS)</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}
