#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$ROOT/context/runtime.md"

has() { command -v "$1" >/dev/null 2>&1; }

# env keys (solo nombres)
ENV_KEYS="$(ls "$ROOT"/.env* 2>/dev/null | while read -r f; do
  grep -E '^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=' "$f" 2>/dev/null \
    | sed -E 's/^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*).*/\1/' \
    | sed -E 's/[[:space:]]+$//'
done | sort -u)"

# URLs encontradas en repo (solo para ubicar endpoints, no secretos)
URLS="$(cd "$ROOT" && grep -RInE 'https?://|supabase\.co|vercel\.app|resend\.com' app lib scripts types supabase 2>/dev/null | head -n 200 || true)"

{
  echo "# Runtime / Deploy context (sin secretos)"
  echo
  echo "## Repo"
  echo "- root: $ROOT"
  echo
  echo "## Variables de entorno (solo nombres)"
  if [[ -n "$ENV_KEYS" ]]; then
    echo '```'
    echo "$ENV_KEYS"
    echo '```'
  else
    echo "_No se detectaron .env* con claves._"
  fi
  echo
  echo "## Archivos relevantes"
  for f in next.config.* middleware.ts supabase/config.toml vercel.json; do
    [[ -f "$ROOT/$f" ]] && echo "- $f"
  done
  echo
  echo "## URLs / endpoints detectados (primeras 200 coincidencias)"
  echo '```'
  echo "$URLS"
  echo '```'
} > "$OUT"

echo "OK: generado $OUT"
