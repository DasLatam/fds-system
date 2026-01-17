#!/bin/bash

# =====================================================
# SCRIPT MAESTRO - APLICAR FIXES CRÍTICOS
# FDS v2.0
# =====================================================

echo "🔧 APLICANDO CORRECCIONES CRÍTICAS"
echo "===================================="
echo ""

PROJECT_DIR="/workspaces/fds-system"
cd "$PROJECT_DIR" || exit 1

# Verificar que existe la carpeta FIXES
if [ ! -d "FIXES" ]; then
    echo "❌ Carpeta FIXES no encontrada"
    echo "Primero descomprime: tar -xzf FIXES-CRITICOS.tar.gz"
    exit 1
fi

echo "📋 Aplicando archivos..."
echo ""

# 1. Registro definitivo
echo "1/4: Corrigiendo registro..."
cp FIXES/registro-definitivo.tsx app/registro/page.tsx
echo "   ✅ app/registro/page.tsx"

# 2. Página de firma completa
echo "2/4: Actualizando página de firma..."
cp FIXES/firma-completa.tsx app/firma/[id]/page.tsx
echo "   ✅ app/firma/[id]/page.tsx"

# 3. API de emails finales
echo "3/4: Creando API de confirmación..."
mkdir -p app/api/send-completion-emails
cp FIXES/api/send-completion-emails.ts app/api/send-completion-emails/route.ts
echo "   ✅ app/api/send-completion-emails/route.ts"

# 4. Configurar SITE_URL
echo "4/4: Configurando SITE_URL..."
chmod +x FIXES/fix-site-url.sh
./FIXES/fix-site-url.sh

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ CORRECCIONES APLICADAS"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📝 Archivos actualizados:"
echo "   ✅ Registro (sin error foreign key)"
echo "   ✅ Página de firma (con datos + PDF + canvas)"
echo "   ✅ API de emails (confirmación final)"
echo "   ✅ SITE_URL configurado"
echo ""
echo "⚠️  IMPORTANTE - CONFIGURAR EN VERCEL:"
echo ""
echo "Ve a: Vercel Dashboard → Settings → Environment Variables"
echo ""
echo "Agregar:"
echo "  Name: NEXT_PUBLIC_SITE_URL"
echo "  Value: https://firmadigitalsimple.vercel.app"
echo "  Environment: Production"
echo ""
echo "Luego REDEPLOY el proyecto."
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "🚀 Próximo paso:"
echo ""
echo "git add ."
echo "git commit -m 'Fix: Critical issues (registration, signature, emails)'"
echo "git push"
echo ""
echo "✨ ¡Listo!"
