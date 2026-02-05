#!/usr/bin/env bash
set -euo pipefail

ARCHIVE="${1:-}"
if [[ -z "$ARCHIVE" ]]; then
  echo "Uso: scripts/apply-tgz-with-backup.sh <archivo.tgz>" >&2
  exit 1
fi
if [[ ! -f "$ARCHIVE" ]]; then
  echo "ERROR: No existe: $ARCHIVE" >&2
  exit 1
fi

# chequeo “estás en repo”
if [[ ! -f "package.json" ]]; then
  echo "WARN: No veo package.json en el cwd. Asegurate de correrlo desde la raíz del repo." >&2
fi

BACKUP=".backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP"

# listar archivos del tgz
tar -tzf "$ARCHIVE" > .tgz_filelist.txt

# backup de archivos que van a ser pisados
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if [[ -f "$f" ]]; then
    mkdir -p "$BACKUP/$(dirname "$f")"
    cp -p "$f" "$BACKUP/$f"
  fi
done < .tgz_filelist.txt

# aplicar
tar -xzf "$ARCHIVE" -C .

echo "OK: aplicado $ARCHIVE"
echo "Backup: $BACKUP"
echo "Archivos del tgz: $(wc -l < .tgz_filelist.txt | tr -d ' ')"
