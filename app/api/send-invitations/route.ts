import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { generateSignerInvitationEmail } from '@/lib/email-templates';

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

    // Get signers
    const { data: signers } = await supabase
      .from('signers')
      .select('*')
      .eq('document_id', documentId)
      .is('signed_at', null);

    if (!signers || signers.length === 0) {
      return NextResponse.json({ message: 'No hay firmantes pendientes' });
    }

    // Send emails
    const results = [];
    for (const signer of signers) {
      try {
        const signUrl = \`\${process.env.NEXT_PUBLIC_SITE_URL}/firma/\${signer.signature_token}\`;
        
        const { data, error } = await resend.emails.send({
          from: 'FDS <noreply@daslatam.org>',
          to: signer.email,
          subject: \`Documento para firmar: \${document.title}\`,
          html: generateSignerInvitationEmail({
            signerName: signer.name,
            documentTitle: document.title,
            signUrl,
            expiresAt: document.expires_at,
          }),
        });

        if (error) {
          console.error(\`Error sending to \${signer.email}:\`, error);
          results.push({ email: signer.email, success: false, error });
        } else {
          // Update invitation_sent_at
          await supabase
            .from('signers')
            .update({ invitation_sent_at: new Date().toISOString() })
            .eq('id', signer.id);

          results.push({ email: signer.email, success: true, id: data?.id });
        }
      } catch (err) {
        results.push({ email: signer.email, success: false, error: err });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Send invitations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
