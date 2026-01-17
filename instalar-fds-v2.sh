#!/bin/bash

# =====================================================
# INSTALACIÓN COMPLETA - FDS v2.0
# Este script hace TODO automáticamente
# =====================================================

set -e  # Salir si hay algún error

echo "🚀 INSTALACIÓN AUTOMÁTICA DE FDS v2.0"
echo "======================================"
echo ""

# Variables
PROJECT_DIR="/workspaces/fds-system"
ARCHIVE_PATH="$1"

# Validar que se pasó el archivo
if [ -z "$ARCHIVE_PATH" ]; then
    echo "❌ Error: Debes especificar la ruta del archivo .tar.gz"
    echo ""
    echo "Uso: ./instalar-fds-v2.sh /path/to/fds-v2-completo.tar.gz"
    echo ""
    exit 1
fi

# Validar que el archivo existe
if [ ! -f "$ARCHIVE_PATH" ]; then
    echo "❌ Error: El archivo $ARCHIVE_PATH no existe"
    exit 1
fi

# Ir al directorio del proyecto
cd "$PROJECT_DIR" || exit 1

echo "📍 Directorio actual: $(pwd)"
echo ""

# =====================================================
# PASO 1: BACKUP
# =====================================================
echo "📦 PASO 1/5: Haciendo backup..."
echo ""

# Backup de .env.local
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    echo "✅ Backup de .env.local creado"
else
    echo "⚠️  No hay .env.local para respaldar"
fi

# Backup de node_modules (opcional, comentado por defecto)
# if [ -d "node_modules" ]; then
#     echo "Guardando node_modules..."
#     mv node_modules node_modules.backup
# fi

echo ""

# =====================================================
# PASO 2: LIMPIEZA
# =====================================================
echo "🗑️  PASO 2/5: Limpiando archivos antiguos..."
echo ""

# Borrar carpetas de código
rm -rf app/ components/ lib/ types/ public/

# Borrar configs
rm -f middleware.ts next.config.js tailwind.config.js postcss.config.js tsconfig.json vercel.json

# Borrar docs
rm -f CHANGELOG.md CORRECCIONES.md DEPLOYMENT.md LEEME-*.md NOTAS-FINALES.md README*.md SECURITY.md TROUBLESHOOTING.md

# Borrar SQLs y scripts
rm -f supabase-*.sql test-resend.js generate_structure_xml.py

echo "✅ Archivos antiguos eliminados"
echo ""

# =====================================================
# PASO 3: DESCOMPRIMIR
# =====================================================
echo "📦 PASO 3/5: Descomprimiendo FDS v2.0..."
echo ""

# Descomprimir en /tmp primero
TMP_DIR=$(mktemp -d)
tar -xzf "$ARCHIVE_PATH" -C "$TMP_DIR"

# Copiar archivos (buscar el directorio fds-v2 dentro)
if [ -d "$TMP_DIR/fds-v2" ]; then
    cp -r "$TMP_DIR/fds-v2/"* .
    echo "✅ Archivos descomprimidos y copiados"
elif [ -d "$TMP_DIR/home/claude/fds-v2" ]; then
    cp -r "$TMP_DIR/home/claude/fds-v2/"* .
    echo "✅ Archivos descomprimidos y copiados (ruta alternativa)"
else
    # Copiar todo directamente
    cp -r "$TMP_DIR/"* .
    echo "✅ Archivos descomprimidos y copiados (raíz)"
fi

# Limpiar temp
rm -rf "$TMP_DIR"

echo ""

# =====================================================
# PASO 4: RESTAURAR CONFIGS
# =====================================================
echo "⚙️  PASO 4/5: Restaurando configuración..."
echo ""

# Restaurar .env.local
if [ -f ".env.local.backup" ]; then
    # Si existe .env.local nuevo, preguntar
    if [ -f ".env.local" ]; then
        echo "⚠️  Hay un .env.local nuevo y un backup"
        echo "¿Quieres usar el backup? (y/n)"
        read -r response
        if [ "$response" = "y" ]; then
            mv .env.local.backup .env.local
            echo "✅ Usando .env.local del backup"
        else
            echo "✅ Usando .env.local nuevo (edítalo manualmente)"
            echo "   Backup guardado en: .env.local.backup"
        fi
    else
        mv .env.local.backup .env.local
        echo "✅ .env.local restaurado del backup"
    fi
fi

# Si no existe .env.local, copiar del example
if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
    echo "⚠️  No hay .env.local"
    echo "   Copiando .env.example a .env.local..."
    cp .env.example .env.local
    echo "   ⚠️  EDITA .env.local con tus credenciales antes de continuar"
fi

echo ""

# =====================================================
# PASO 5: INSTALAR DEPENDENCIAS
# =====================================================
echo "📦 PASO 5/5: Instalando dependencias..."
echo ""

# Verificar si existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json"
    exit 1
fi

# Instalar
echo "Ejecutando: npm install"
echo "(Esto puede tomar 2-3 minutos...)"
echo ""

npm install

echo ""
echo "✅ Dependencias instaladas"
echo ""

# =====================================================
# RESUMEN
# =====================================================
echo "═══════════════════════════════════════════════════"
echo "✅ INSTALACIÓN COMPLETADA"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1. ⚙️  Configurar .env.local (si no lo hiciste):"
echo "   nano .env.local"
echo ""
echo "2. 💾 Ejecutar SQL en Supabase:"
echo "   - Abre: Supabase Dashboard → SQL Editor"
echo "   - Copia: DATABASE.sql"
echo "   - Ejecuta el SQL completo"
echo ""
echo "3. 📧 Configurar DNS en Ferozo (ver INSTRUCCIONES-INSTALACION.md)"
echo ""
echo "4. 🚀 Iniciar el servidor de desarrollo:"
echo "   npm run dev"
echo ""
echo "5. 🌐 Abrir: http://localhost:3000"
echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo "📚 DOCUMENTACIÓN:"
echo "   - README.md → Visión general"
echo "   - INSTRUCCIONES-INSTALACION.md → Guía completa"
echo "   - DATABASE.sql → Schema de BD"
echo ""
echo "🎉 ¡FDS v2.0 está listo! 🎉"
echo ""
