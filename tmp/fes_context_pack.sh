set -euo pipefail

OUT_DIR="./tmp/_fes_context"
KEY_DIR="$OUT_DIR/key_files"

rm -rf "$OUT_DIR"
mkdir -p "$KEY_DIR"

echo "==> Repo: $(pwd)" | tee "$OUT_DIR/README.txt"
echo "==> Generated: $(date -Iseconds)" | tee -a "$OUT_DIR/README.txt"

echo "==> Saving tree..."
if command -v tree >/dev/null 2>&1; then
  tree -a -I "node_modules|.next|.git|.vercel|dist|build|coverage|.turbo|.cache|.DS_Store|tmp/_fes_context" \
    -L 6 > "$OUT_DIR/tree.txt"
else
  find . -maxdepth 6 \
    -not -path "./node_modules/*" \
    -not -path "./.next/*" \
    -not -path "./.git/*" \
    -not -path "./.vercel/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "./coverage/*" \
    -not -path "./.turbo/*" \
    -not -path "./.cache/*" \
    -not -path "./tmp/_fes_context/*" \
    -not -name ".DS_Store" \
    -print > "$OUT_DIR/tree.txt"
fi

echo "==> Saving git info..."
{
  echo "### git rev-parse"
  git rev-parse --show-toplevel
  echo
  echo "### git branch"
  git branch --show-current
  echo
  echo "### git status"
  git status -sb
  echo
  echo "### last 10 commits"
  git log -10 --oneline --decorate
} > "$OUT_DIR/git.txt"

echo "==> Listing env files (names only, no content)..."
(
  ls -la .env* 2>/dev/null || true
  echo
  ls -la vercel.json 2>/dev/null || true
) > "$OUT_DIR/env_files.txt"

copy_if_exists () {
  local p="$1"
  if [ -f "$p" ]; then
    mkdir -p "$KEY_DIR/$(dirname "$p")"
    cp "$p" "$KEY_DIR/$p"
  fi
}

echo "==> Copying key files if present..."
copy_if_exists "package.json"
copy_if_exists "package-lock.json"
copy_if_exists "pnpm-lock.yaml"
copy_if_exists "yarn.lock"
copy_if_exists "next.config.js"
copy_if_exists "next.config.mjs"
copy_if_exists "tsconfig.json"
copy_if_exists "middleware.ts"
copy_if_exists "vercel.json"

copy_if_exists "app/layout.tsx"
copy_if_exists "app/page.tsx"

copy_if_exists "app/login/page.tsx"
copy_if_exists "app/auth/callback-client/page.tsx"
copy_if_exists "app/auth/set-session/route.ts"
copy_if_exists "app/auth/callback/route.ts"

copy_if_exists "app/dashboard/page.tsx"
copy_if_exists "app/dashboard/new/page.tsx"
copy_if_exists "app/dashboard/doc/[id]/page.tsx"

copy_if_exists "app/api/sign/route.ts"
copy_if_exists "app/api/signing-request/route.ts"
copy_if_exists "app/api/signing-request/resend/route.ts"
copy_if_exists "app/api/verify/route.ts"
copy_if_exists "app/v/[audit_code]/page.tsx"

copy_if_exists "lib/supabase/server.ts"
copy_if_exists "lib/supabase/client.ts"
copy_if_exists "lib/resend.ts"

echo "==> Zipping..."
(
  cd ./tmp
  zip -qr _fes_context.zip _fes_context
)

echo "==> Done:"
echo " - Folder: $OUT_DIR"
echo " - Zip:    ./tmp/_fes_context.zip"
