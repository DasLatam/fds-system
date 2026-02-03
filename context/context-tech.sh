#!/usr/bin/env bash
set -euo pipefail

# ROOT = carpeta padre de /context (este script vive en /context)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT_DIR="$ROOT/context"
OUT_FILE="$OUT_DIR/tech.md"

mkdir -p "$OUT_DIR"

has() { command -v "$1" >/dev/null 2>&1; }

REPO_NAME="$(basename "$ROOT")"

# --- Git info ---
GIT_OK="no"
BRANCH=""
REMOTE=""
LAST_COMMIT=""
if has git && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_OK="yes"
  BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
  REMOTE="$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)"
  LAST_COMMIT="$(git -C "$ROOT" log -1 --date=iso-strict --pretty=format:'%h %ad %an %s' 2>/dev/null || true)"
fi

# --- Tool versions ---
NODE_V=""; NPM_V=""; PNPM_V=""; YARN_V=""; PY_V=""
if has node; then NODE_V="$(node -v || true)"; fi
if has npm; then NPM_V="$(npm -v || true)"; fi
if has pnpm; then PNPM_V="$(pnpm -v || true)"; fi
if has yarn; then YARN_V="$(yarn -v || true)"; fi
if has python3; then PY_V="$(python3 -V 2>&1 || true)"; fi

# --- Stack hints ---
STACK_HINTS=""
[[ -f "$ROOT/next.config.js" || -f "$ROOT/next.config.mjs" || -f "$ROOT/next.config.ts" ]] && STACK_HINTS="${STACK_HINTS}- Next.js\n"
[[ -d "$ROOT/app" ]] && STACK_HINTS="${STACK_HINTS}- App Router\n"
[[ -f "$ROOT/tsconfig.json" ]] && STACK_HINTS="${STACK_HINTS}- TypeScript\n"
[[ -f "$ROOT/tailwind.config.js" || -f "$ROOT/tailwind.config.ts" || -f "$ROOT/postcss.config.js" || -f "$ROOT/postcss.config.mjs" ]] && STACK_HINTS="${STACK_HINTS}- Tailwind/PostCSS\n"
[[ -d "$ROOT/supabase" ]] && STACK_HINTS="${STACK_HINTS}- Supabase\n"
[[ -f "$ROOT/vercel.json" ]] && STACK_HINTS="${STACK_HINTS}- Vercel config\n"

# --- Env vars (solo nombres) ---
ENV_KEYS="$(ls "$ROOT"/.env* 2>/dev/null | while read -r f; do
  grep -E '^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=' "$f" 2>/dev/null \
    | sed -E 's/^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*).*/\1/' \
    | sed -E 's/[[:space:]]+$//'
done | sort -u)"

# --- Routes / pages (sin python) ---
API_ROUTES=""
PAGES=""
if [[ -d "$ROOT/app" ]]; then
  API_ROUTES="$(cd "$ROOT" && find app -type f -name 'route.*' 2>/dev/null | sort || true)"
  PAGES="$(cd "$ROOT" && find app -type f -name 'page.*' 2>/dev/null | sort || true)"
fi

# --- Supabase migrations ---
MIGRATIONS=""
if [[ -d "$ROOT/supabase/migrations" ]]; then
  MIGRATIONS="$(ls -1 "$ROOT/supabase/migrations" 2>/dev/null | sort || true)"
fi

# --- package.json -> scripts & deps (solo node; sin python) ---
SCRIPTS_MD="_No se pudo leer package.json (node o package.json ausente)._"
DEPS_MD="_No se pudo leer package.json (node o package.json ausente)._"
if [[ -f "$ROOT/package.json" ]] && has node; then
  SCRIPTS_MD="$(PKG="$ROOT/package.json" node - <<'NODE'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync(process.env.PKG, "utf8"));
const scripts = pkg.scripts || {};
const keys = Object.keys(scripts).sort();
let out = "```\n";
for (const k of keys) out += `${k}: ${scripts[k]}\n`;
out += "```\n";
process.stdout.write(out);
NODE
  )"

  DEPS_MD="$(PKG="$ROOT/package.json" node - <<'NODE'
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync(process.env.PKG, "utf8"));
const deps = pkg.dependencies || {};
const dev  = pkg.devDependencies || {};
const keys = ["next","react","react-dom","typescript","tailwindcss","postcss","autoprefixer","@supabase/supabase-js","resend","zod"];
let out = "```\n";
for (const k of keys) if (deps[k]) out += `${k}: ${deps[k]}\n`;
for (const k of keys) if (dev[k]) out += `${k} (dev): ${dev[k]}\n`;
out += "```\n";
process.stdout.write(out);
NODE
  )"
fi

# --- Write tech.md ---
{
  echo "# Contexto técnico y método — $REPO_NAME"
  echo
  echo "## Identificación"
  echo "- Repo: \`$REPO_NAME\`"
  echo "- Git: \`$GIT_OK\`"
  if [[ "$GIT_OK" == "yes" ]]; then
    echo "- Branch actual: \`$BRANCH\`"
    [[ -n "$REMOTE" ]] && echo "- Remote origin: \`$REMOTE\`"
    [[ -n "$LAST_COMMIT" ]] && echo "- Último commit: \`$LAST_COMMIT\`"
  fi
  echo
  echo "## Stack detectado (heurístico)"
  if [[ -n "$STACK_HINTS" ]]; then
    printf "%b" "$STACK_HINTS"
  else
    echo "- (no se pudo inferir automáticamente)"
  fi
  echo
  echo "## Versiones de herramientas"
  [[ -n "$NODE_V" ]] && echo "- Node: \`$NODE_V\`"
  [[ -n "$NPM_V" ]] && echo "- npm: \`$NPM_V\`"
  [[ -n "$PNPM_V" ]] && echo "- pnpm: \`$PNPM_V\`"
  [[ -n "$YARN_V" ]] && echo "- yarn: \`$YARN_V\`"
  [[ -n "$PY_V" ]] && echo "- Python: \`$PY_V\`"
  echo
  echo "## Método de trabajo recomendado"
  echo "- Reproducir local: instalar deps → correr dev → reproducir bug → validar fix."
  echo "- Cambios chicos: 1 objetivo por commit."
  echo "- Verificación: flujos críticos (auth, creación, firma, emails)."
  echo "- Deploy: merge a main → Vercel build → validar en producción."
  echo
  echo "## Scripts (package.json)"
  printf "%s\n" "$SCRIPTS_MD"
  echo
  echo "## Dependencias principales (package.json)"
  printf "%s\n" "$DEPS_MD"
  echo
  echo "## Rutas (Next App Router)"
  echo "### API routes (app/**/route.*)"
  if [[ -n "$API_ROUTES" ]]; then
    echo '```'
    echo "$API_ROUTES"
    echo '```'
  else
    echo "_No detectadas._"
  fi
  echo
  echo "### Pages (app/**/page.*)"
  if [[ -n "$PAGES" ]]; then
    echo '```'
    echo "$PAGES"
    echo '```'
  else
    echo "_No detectadas._"
  fi
  echo
  echo "## Supabase"
  if [[ -d "$ROOT/supabase" ]]; then
    echo "- Detectado directorio /supabase"
    if [[ -n "$MIGRATIONS" ]]; then
      echo "### Migrations (supabase/migrations)"
      echo '```'
      echo "$MIGRATIONS"
      echo '```'
    else
      echo "- No se detectaron migrations."
    fi
  else
    echo "- No se detectó carpeta /supabase."
  fi
  echo
  echo "## Variables de entorno detectadas (solo nombres)"
  if [[ -n "$ENV_KEYS" ]]; then
    echo '```'
    echo "$ENV_KEYS"
    echo '```'
  else
    echo "_No se detectaron claves en .env*._"
  fi
  echo
  echo "## Notas"
  echo "- Pensado para pegar completo como contexto en una conversación nueva."
  echo "- No incluye secretos: solo nombres de variables."
} > "$OUT_FILE"

echo "OK: generado $OUT_FILE"
