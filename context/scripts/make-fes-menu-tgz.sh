#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-fes-menu.tgz}"

# Por defecto usa el arbol.xml del repo
XML="${2:-}"
if [[ -z "${XML}" ]]; then
  if [[ -f "context/arbol.xml" ]]; then
    XML="context/arbol.xml"
  elif [[ -f "arbol.xml" ]]; then
    XML="arbol.xml"
  else
    echo "ERROR: No encuentro arbol.xml (busqué context/arbol.xml y arbol.xml)." >&2
    exit 1
  fi
fi

LIST=".fes_menu_files.txt"
rm -f "$LIST"

python3 - "$XML" > "$LIST" <<'PY'
import os, sys
import xml.etree.ElementTree as ET

xml_path = sys.argv[1]
tree = ET.parse(xml_path)
root = tree.getroot()

paths = []

def walk(node, prefix=""):
  # node puede ser <repo>, <dir>, <file>
  if node.tag == "dir":
    name = node.attrib.get("name","")
    new_prefix = prefix + name + "/"
    for ch in node:
      walk(ch, new_prefix)
  elif node.tag == "file":
    name = node.attrib.get("name","")
    paths.append(prefix + name)
  else:
    for ch in node:
      walk(ch, prefix)

walk(root, "")

def want(p: str) -> bool:
  # Core navegación / auth guard
  if p in ("middleware.ts", "app/layout.tsx", "app/page.tsx"):
    return True

  # Todo el dashboard y subpáginas (ahí suele vivir el “menú del cuerpo”)
  if p.startswith("app/dashboard/"):
    return True

  # Páginas que impactan nav, redirects y flow
  if p.startswith("app/login/"):
    return True
  if p.startswith("app/profile/"):
    return True
  if p.startswith("app/onboarding/"):
    return True
  if p.startswith("app/s/") or p.startswith("app/signed/"):
    return True

  # Legales y pricing (aparecen en nav)
  if p.startswith("app/terms/") or p.startswith("app/privacy/") or p.startswith("app/pricing/"):
    return True

  # Admin + helpers relevantes al nav
  if p.startswith("app/admin/"):
    return True
  if p in ("lib/security/admin.server.ts", "lib/audit/labels.ts"):
    return True

  return False

selected = []
missing = []
for p in sorted(set(paths)):
  if not want(p):
    continue
  if os.path.exists(p):
    selected.append(p)
  else:
    missing.append(p)

# imprimimos SOLO los existentes (tar -T no necesita quoting y evita zsh globbing)
for p in selected:
  print(p)

# log por stderr
sys.stderr.write(f"Seleccionados: {len(selected)}\n")
if missing:
  sys.stderr.write("Faltantes (en FS, pero estaban en arbol.xml):\n")
  for m in missing:
    sys.stderr.write(f"  - {m}\n")
PY

# Crear tgz usando lista (no hay problemas con zsh ni con corchetes)
if tar --help 2>/dev/null | grep -q -- " -T "; then
  tar -czf "$OUT" -T "$LIST"
else
  # fallback (nombres sin espacios en tu repo)
  tar -czf "$OUT" $(cat "$LIST")
fi

echo "OK: creado $OUT"
echo "Incluye $(wc -l < "$LIST" | tr -d ' ') archivos"
