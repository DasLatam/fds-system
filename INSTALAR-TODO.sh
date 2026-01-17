#!/bin/bash

# =====================================================
# INSTALACIÓN COMPLETA FDS v2.0
# Instala TODAS las correcciones y mejoras
# =====================================================

echo "🚀 INSTALACIÓN COMPLETA FDS v2.0"
echo "=================================="
echo ""

PROJECT_DIR="/workspaces/fds-system"
cd "$PROJECT_DIR" || exit 1

# Verificar archivos
if [ ! -d "FIXES" ] || [ ! -d "FIXES-PARTE2" ]; then
    echo "❌ Faltan archivos"
    echo ""
    echo "Ejecuta primero:"
    echo "  tar -xzf FIXES-CRITICOS.tar.gz"
    echo "  tar -xzf FIXES-PARTE2.tar.gz"
    exit 1
fi

echo "📦 PARTE 1: FIXES CRÍTICOS"
echo "=========================="
echo ""

# PARTE 1
echo "1. Registro corregido..."
cp FIXES/registro-definitivo.tsx app/registro/page.tsx

echo "2. Página de firma completa..."
cp FIXES/firma-completa.tsx app/firma/[id]/page.tsx

echo "3. API de emails finales..."
mkdir -p app/api/send-completion-emails
cp FIXES/api/send-completion-emails.ts app/api/send-completion-emails/route.ts

echo "4. Configurando SITE_URL..."
chmod +x FIXES/fix-site-url.sh
./FIXES/fix-site-url.sh

echo ""
echo "✅ PARTE 1 COMPLETADA"
echo ""

echo "📦 PARTE 2: MEJORAS COMPLETAS"
echo "============================="
echo ""

# PARTE 2
echo "1. Dashboard mejorado..."
cp FIXES-PARTE2/dashboard-user-mejorado.tsx app/dashboard/user/page.tsx

echo "2. Detalle de documento..."
mkdir -p app/dashboard/user/documento/[id]
cp FIXES-PARTE2/documento-detalle.tsx app/dashboard/user/documento/[id]/page.tsx

echo "3. Términos completos..."
mkdir -p app/legal/terminos
cp FIXES-PARTE2/terminos-completos.tsx app/legal/terminos/page.tsx

echo "4. Privacidad completa..."
mkdir -p app/legal/privacidad
cp FIXES-PARTE2/privacidad-completa.tsx app/legal/privacidad/page.tsx

echo "5. Perfil de usuario..."
mkdir -p app/dashboard/user/perfil
cp FIXES-PARTE2/perfil-usuario.tsx app/dashboard/user/perfil/page.tsx

echo ""
echo "✅ PARTE 2 COMPLETADA"
echo ""

echo "═══════════════════════════════════════════════════"
echo "✅ INSTALACIÓN COMPLETA EXITOSA"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📝 ARCHIVOS INSTALADOS:"
echo ""
echo "PARTE 1 - Fixes Críticos:"
echo "  ✅ Registro (sin error foreign key)"
echo "  ✅ Página de firma (datos + PDF + canvas)"
echo "  ✅ API de confirmación"
echo "  ✅ SITE_URL configurado"
echo ""
echo "PARTE 2 - Mejoras:"
echo "  ✅ Dashboard mejorado"
echo "  ✅ Detalle de documento"
echo "  ✅ Términos y condiciones completos"
echo "  ✅ Política de privacidad completa"
echo "  ✅ Edición de perfil"
echo ""
echo "⚠️  MANUAL:"
echo "  📋 Actualiza Footer con footer-actualizado.tsx"
echo ""
echo "🔧 CONFIGURACIÓN PENDIENTE:"
echo ""
echo "En Vercel Dashboard → Settings → Environment Variables:"
echo "  Name: NEXT_PUBLIC_SITE_URL"
echo "  Value: https://firmadigitalsimple.vercel.app"
echo "  Environment: Production"
echo ""
echo "Luego REDEPLOY el proyecto."
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo ""
echo "git add ."
echo "git commit -m 'Feature: Complete FDS v2.0 system'"
echo "git push"
echo ""
echo "✨ ¡Sistema 100% funcional!"
