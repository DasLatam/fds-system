import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  console.log('=== SEND EMAILS API CALLED ===');
  
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

    console.log('=== SMTP Configuration ===');
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    console.log('SMTP:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      user: smtpConfig.auth.user ? '✓ SET' : '✗ MISSING',
      pass: smtpConfig.auth.pass ? '✓ SET' : '✗ MISSING'
    });

    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      throw new Error('SMTP configuration missing');
    }

    const transporter = nodemailer.createTransport(smtpConfig);
    await transporter.verify();
    console.log('✓ SMTP connection successful');

    const locadorToken = generateToken();
    const locatarioToken = generateToken();

    await supabase
      .from('contracts')
      .update({
        locador_firma_token: locadorToken,
        locatario_firma_token: locatarioToken
      })
      .eq('id', contractId);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const locadorUrl = `${baseUrl}/firma/${contractId}?token=${locadorToken}&tipo=locador`;
    const locatarioUrl = `${baseUrl}/firma/${contractId}?token=${locatarioToken}&tipo=locatario`;

    console.log('Sending email to locador:', contract.locador_email);
    await transporter.sendMail({
      from: `"FDS" <${smtpConfig.auth.user}>`,
      to: contract.locador_email,
      subject: 'Nuevo contrato para firmar',
      html: generateEmailHTML('locador', contract, locadorUrl)
    });
    console.log('✓ Email to locador sent');

    console.log('Sending email to locatario:', contract.locatario_email);
    await transporter.sendMail({
      from: `"FDS" <${smtpConfig.auth.user}>`,
      to: contract.locatario_email,
      subject: 'Nuevo contrato para firmar',
      html: generateEmailHTML('locatario', contract, locatarioUrl)
    });
    console.log('✓ Email to locatario sent');

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ EMAIL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateEmailHTML(tipo: string, contract: any, url: string): string {
  const nombre = tipo === 'locador' ? contract.locador_nombre : contract.locatario_nombre;
  return `<h1>Hola ${nombre}</h1><p>Haz clic para firmar: <a href="${url}">Firmar Contrato</a></p>`;
}
