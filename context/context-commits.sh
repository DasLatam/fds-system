#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/context"
mkdir -p "$OUT_DIR"

# 1) Log completo (detalle + diffs)
git -C "$ROOT" log --all --date=iso-strict --no-color \
  --pretty=format:'<commit hash="%H" short="%h" author="%an" email="%ae" date="%ad">%n<title>%s</title>%n<body><![CDATA[%b]]></body>%n</commit>%n' \
  > "$OUT_DIR/commits.xml"

# 2) Resumen rápido (para leer en 30 segundos)
git -C "$ROOT" log --all --date=short --no-color \
  --pretty=format:'%ad %h %an %s' \
  > "$OUT_DIR/commits.txt"

# 3) Patch consolidado de TODO el repo (todas las diferencias commit a commit)
#    Esto es lo más útil para que una IA entienda "qué cambió" históricamente.
git -C "$ROOT" log --all --no-color -p --date=iso-strict \
  --pretty=format:'commit %H%nAuthor: %an <%ae>%nDate: %ad%nSubject: %s%n%n%b%n' \
  > "$OUT_DIR/commits.patch"

# 4) Estadísticas por commit (archivos cambiados + líneas)
git -C "$ROOT" log --all --no-color --date=short \
  --pretty=format:'%ad %h %an %s' --numstat \
  > "$OUT_DIR/commits-numstat.txt"

echo "OK: generado en $OUT_DIR/"
echo " - commits.xml"
echo " - commits.txt"
echo " - commits.patch"
echo " - commits-numstat.txt"
