#!/bin/bash

# =====================================================
# FIX: undefined en links de firma
# =====================================================

echo "🔧 Verificando configuración de SITE_URL..."
echo ""

# Verificar .env.local
if [ ! -f ".env.local" ]; then
    echo "❌ No existe .env.local"
    echo "Creando desde .env.example..."
    cp .env.example .env.local
fi

# Leer el valor actual
CURRENT_SITE_URL=$(grep "NEXT_PUBLIC_SITE_URL" .env.local | cut -d '=' -f2)

echo "Valor actual: $CURRENT_SITE_URL"
echo ""

if [ -z "$CURRENT_SITE_URL" ] || [ "$CURRENT_SITE_URL" == "your_site_url" ]; then
    echo "⚠️  NEXT_PUBLIC_SITE_URL no está configurado correctamente"
    echo ""
    echo "Configurando automáticamente para Vercel..."
    
    # Detectar si estamos en producción o desarrollo
    if [ -n "$VERCEL_URL" ]; then
        # Estamos en Vercel
        NEW_URL="https://$VERCEL_URL"
    else
        # Desarrollo local
        NEW_URL="http://localhost:3000"
    fi
    
    # Actualizar .env.local
    sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$NEW_URL|g" .env.local
    
    echo "✅ Configurado como: $NEW_URL"
else
    echo "✅ SITE_URL ya está configurado"
fi

echo ""
echo "📋 IMPORTANTE:"
echo ""
echo "Si deployaste en Vercel, DEBES configurar en:"
echo "Vercel Dashboard → Project → Settings → Environment Variables"
echo ""
echo "Variable:"
echo "  Name: NEXT_PUBLIC_SITE_URL"
echo "  Value: https://firmadigitalsimple.vercel.app"
echo ""
echo "Luego redeploy el proyecto."
