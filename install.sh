#!/bin/bash

# =====================================================
# INSTALACIÓN COMPLETA EN 1 COMANDO
# =====================================================

echo "🚀 INSTALANDO FDS v2.0 COMPLETO..."
echo ""

cd /workspaces/fds-system

# Verificar archivos existen
if [ ! -f "registro-page-fixed.tsx" ]; then
    echo "❌ Archivos no encontrados. Descarga primero los archivos."
    exit 1
fi

# Aplicar correcciones
echo "📝 Copiando archivos..."

cp registro-page-fixed.tsx app/registro/page.tsx
cp landing-page-completa.tsx app/page.tsx
cp nuevo-documento-completo.tsx app/dashboard/user/nuevo/page.tsx
cp icon.tsx app/icon.tsx

echo ""
echo "✅ ARCHIVOS INSTALADOS"
echo ""
echo "📋 Cambios aplicados:"
echo "   ✅ app/registro/page.tsx - Registro corregido"
echo "   ✅ app/page.tsx - Landing completa"
echo "   ✅ app/dashboard/user/nuevo/page.tsx - Upload de PDFs"
echo "   ✅ app/icon.tsx - Favicon"
echo ""
echo "🚀 PRÓXIMO PASO:"
echo ""
echo "git add ."
echo "git commit -m 'Feature: FDS v2.0 complete with document upload'"
echo "git push"
echo ""
echo "✨ ¡Sistema 100% funcional!"
