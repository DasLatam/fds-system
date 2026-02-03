#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$ROOT/context/keyfiles"
mkdir -p "$OUT_DIR"

# lista fija de archivos “core” (ajustable)
FILES=(
  "package.json"
  "next.config.ts"
  "middleware.ts"
  "tsconfig.json"
)

# agregar todas las rutas API de Next App Router
while IFS= read -r f; do
  FILES+=("$f")
done < <(cd "$ROOT" && find app -type f -name 'route.*' 2>/dev/null | sort || true)

# dump
for f in "${FILES[@]}"; do
  if [[ -f "$ROOT/$f" ]]; then
    mkdir -p "$OUT_DIR/$(dirname "$f")"
    cp "$ROOT/$f" "$OUT_DIR/$f"
  fi
done

echo "OK: generado $OUT_DIR (archivos core + app/**/route.*)"
