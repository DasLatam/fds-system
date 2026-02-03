#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$ROOT/context/supabase"
mkdir -p "$OUT_DIR"

SCHEMA_OK="no"
METHOD="none"

# 1) Supabase CLI local (requiere stack corriendo)
if command -v supabase >/dev/null 2>&1; then
  if supabase status >/dev/null 2>&1; then
    if supabase db dump --schema-only > "$OUT_DIR/schema.sql" 2>/dev/null; then
      SCHEMA_OK="yes"
      METHOD="supabase_cli_local"
    fi
  fi
fi

# 2) pg_dump con DATABASE_URL (remoto o local) si lo anterior no funcionó
if [[ "$SCHEMA_OK" != "yes" ]]; then
  if command -v pg_dump >/dev/null 2>&1; then
    if [[ -n "${DATABASE_URL:-}" ]]; then
      # No mostramos DATABASE_URL. Solo usamos para dump.
      if pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges > "$OUT_DIR/schema.sql" 2>/dev/null; then
        SCHEMA_OK="yes"
        METHOD="pg_dump_database_url"
      fi
    fi
  fi
fi

# Summary
{
  echo "# Supabase context summary"
  echo
  echo "- generated_at_utc: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "- schema_dumped: $SCHEMA_OK"
  echo "- method: $METHOD"
  echo "- supabase_cli_present: $(command -v supabase >/dev/null 2>&1 && echo yes || echo no)"
  echo "- pg_dump_present: $(command -v pg_dump >/dev/null 2>&1 && echo yes || echo no)"
  echo "- has_DATABASE_URL_env: $([[ -n "${DATABASE_URL:-}" ]] && echo yes || echo no)"
  echo
  echo "## Repo folders detected"
  echo "- supabase/migrations: $([[ -d "$ROOT/supabase/migrations" ]] && echo yes || echo no)"
  echo "- supabase/seed: $([[ -d "$ROOT/supabase/seed" ]] && echo yes || echo no)"
  echo "- supabase/functions: $([[ -d "$ROOT/supabase/functions" ]] && echo yes || echo no)"
} > "$OUT_DIR/supabase-summary.md"

echo "OK: $OUT_DIR"
echo " - supabase-summary.md"
if [[ "$SCHEMA_OK" == "yes" ]]; then
  echo " - schema.sql"
else
  echo " - schema.sql NO generado (ver supabase-summary.md)"
fi
