#!/bin/bash

# =====================================================
# INSTALAR FIXES PARTE 2
# Dashboard, Términos, Privacidad, Footer, Perfil
# =====================================================

echo "🚀 INSTALANDO FIXES PARTE 2"
echo "=============================="
echo ""

PROJECT_DIR="/workspaces/fds-system"
cd "$PROJECT_DIR" || exit 1

echo "📋 Aplicando archivos..."
echo ""

# 1. Dashboard mejorado
echo "1/6: Actualizando dashboard..."
cp FIXES-PARTE2/dashboard-user-mejorado.tsx app/dashboard/user/page.tsx
echo "   ✅ app/dashboard/user/page.tsx"

# 2. Detalle de documento
echo "2/6: Creando página de detalle..."
mkdir -p app/dashboard/user/documento/[id]
cp FIXES-PARTE2/documento-detalle.tsx app/dashboard/user/documento/[id]/page.tsx
echo "   ✅ app/dashboard/user/documento/[id]/page.tsx"

# 3. Términos completos
echo "3/6: Actualizando términos..."
mkdir -p app/legal/terminos
cp FIXES-PARTE2/terminos-completos.tsx app/legal/terminos/page.tsx
echo "   ✅ app/legal/terminos/page.tsx"

# 4. Privacidad completa
echo "4/6: Actualizando privacidad..."
mkdir -p app/legal/privacidad
cp FIXES-PARTE2/privacidad-completa.tsx app/legal/privacidad/page.tsx
echo "   ✅ app/legal/privacidad/page.tsx"

# 5. Perfil de usuario
echo "5/6: Creando página de perfil..."
mkdir -p app/dashboard/user/perfil
cp FIXES-PARTE2/perfil-usuario.tsx app/dashboard/user/perfil/page.tsx
echo "   ✅ app/dashboard/user/perfil/page.tsx"

# 6. Footer actualizado
echo "6/6: Actualizando footer..."
echo "   ℹ️  Copia footer-actualizado.tsx al componente Footer en tu layout"

echo ""
echo "═══════════════════════════════════════════════════"
echo "✅ FIXES PARTE 2 INSTALADOS"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📝 Archivos actualizados:"
echo "   ✅ Dashboard de usuario mejorado"
echo "   ✅ Página de detalle de documento"
echo "   ✅ Términos y condiciones completos"
echo "   ✅ Política de privacidad completa"
echo "   ✅ Edición de perfil"
echo "   ℹ️  Footer con links (copiar manualmente)"
echo ""
echo "🚀 Próximo paso:"
echo ""
echo "git add ."
echo "git commit -m 'Feature: Complete dashboard, legal pages, and profile'"
echo "git push"
echo ""
echo "✨ ¡Listo!"
