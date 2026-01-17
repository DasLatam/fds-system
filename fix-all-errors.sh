#!/bin/bash

# =====================================================
# CORRECCIÓN COMPLETA DE ERRORES DE TYPESCRIPT Y CSS
# Aplica todas las correcciones necesarias
# =====================================================

echo "🔧 Aplicando correcciones de TypeScript y configuración..."
echo ""

PROJECT_DIR="/workspaces/fds-system"
cd "$PROJECT_DIR" || exit 1

# =====================================================
# 1. CORREGIR lib/supabase/server.ts
# =====================================================
echo "📝 1/5: Corrigiendo lib/supabase/server.ts..."

cat > lib/supabase/server.ts << 'ENDFILE'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component - cookies can't be set
          }
        },
      },
    }
  )
}
ENDFILE

echo "   ✅ server.ts corregido"

# =====================================================
# 2. BORRAR tailwind.config.js y CREAR tailwind.config.ts
# =====================================================
echo "📝 2/5: Corrigiendo tailwind.config..."

rm -f tailwind.config.js

cat > tailwind.config.ts << 'ENDFILE'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
ENDFILE

echo "   ✅ tailwind.config.ts creado"

# =====================================================
# 3. CREAR send-invitations/route.ts SI NO EXISTE
# =====================================================
echo "📝 3/5: Verificando send-invitations/route.ts..."

mkdir -p app/api/send-invitations

if [ ! -f "app/api/send-invitations/route.ts" ]; then
  cat > app/api/send-invitations/route.ts << 'ENDFILE'
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
        const signUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/firma/${signer.signature_token}`;
        
        const { data, error } = await resend.emails.send({
          from: 'FDS <noreply@daslatam.org>',
          to: signer.email,
          subject: `Documento para firmar: ${document.title}`,
          html: generateSignerInvitationEmail({
            signerName: signer.name,
            documentTitle: document.title,
            signUrl,
            expiresAt: document.expires_at,
          }),
        });

        if (error) {
          console.error(`Error sending to ${signer.email}:`, error);
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
ENDFILE
  echo "   ✅ send-invitations/route.ts creado"
else
  echo "   ℹ️  send-invitations/route.ts ya existe"
fi

# =====================================================
# 4. CONFIGURAR VSCODE PARA IGNORAR WARNINGS CSS
# =====================================================
echo "📝 4/5: Configurando VSCode..."

mkdir -p .vscode

cat > .vscode/settings.json << 'ENDFILE'
{
  "css.validate": false,
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
ENDFILE

echo "   ✅ VSCode configurado"

# =====================================================
# 5. REINICIAR SERVIDOR TYPESCRIPT (VSCode)
# =====================================================
echo "📝 5/5: Limpiando cache..."

# Limpiar .next si existe
if [ -d ".next" ]; then
  rm -rf .next
  echo "   ✅ Cache .next limpiado"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ TODAS LAS CORRECCIONES APLICADAS"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. En VSCode, presiona:"
echo "   - Ctrl+Shift+P (o Cmd+Shift+P en Mac)"
echo "   - Escribe: 'TypeScript: Restart TS Server'"
echo "   - Enter"
echo ""
echo "2. Commit los cambios:"
echo "   git add ."
echo "   git commit -m 'Fix: TypeScript and Tailwind config errors'"
echo "   git push"
echo ""
echo "3. Los warnings de CSS (@tailwind, @apply) ahora están"
echo "   suprimidos en VSCode."
echo ""
echo "✅ ¡Listo! Los errores deberían desaparecer."
echo ""
