#!/usr/bin/env bash
set -euo pipefail

# Ejecutalo desde cualquier lado, pero dentro del repo.
# Si estás en /context, sube uno.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/context"
OUT_FILE="$OUT_DIR/arbol.xml"

mkdir -p "$OUT_DIR"

python3 - <<PY
import os, subprocess

root = r"$ROOT"
out  = r"$OUT_FILE"

EXCLUDES = {
  ".git", "node_modules", ".next", "dist", "build", ".turbo", ".vercel",
  "coverage", ".cache"
}

def is_excluded(rel_path: str) -> bool:
  parts = rel_path.split("/")
  if any(p in EXCLUDES for p in parts):
    return True
  if rel_path.endswith(".DS_Store"):
    return True
  return False

def get_paths():
  # Prefer git tracked files (más limpio)
  try:
    subprocess.check_output(["git", "-C", root, "rev-parse", "--is-inside-work-tree"], stderr=subprocess.DEVNULL)
    data = subprocess.check_output(["git", "-C", root, "ls-files", "-z"])
    paths = [p.decode("utf-8","replace") for p in data.split(b"\\x00") if p]
  except Exception:
    paths = []
    for dirpath, dirnames, filenames in os.walk(root):
      rel_dir = os.path.relpath(dirpath, root).replace("\\\\","/")
      if rel_dir == ".":
        rel_dir = ""
      # prune dirs excluded
      dirnames[:] = [d for d in dirnames if not is_excluded((rel_dir + "/" + d).strip("/"))]
      for f in filenames:
        rel = (rel_dir + "/" + f).strip("/").replace("\\\\","/")
        if not is_excluded(rel):
          paths.append(rel)

  # filtrado final + sort
  paths = [p.strip("/").replace("\\\\","/") for p in paths if p and not is_excluded(p.strip("/").replace("\\\\","/"))]
  paths.sort()
  return paths

def emit_xml(paths):
  stack = []
  lines = []
  lines.append('<?xml version="1.0" encoding="UTF-8"?>')
  lines.append(f'<repo root="{os.path.basename(root)}">')

  for p in paths:
    parts = p.split("/")
    dirs, fname = parts[:-1], parts[-1]

    # common prefix
    common = 0
    while common < len(stack) and common < len(dirs) and stack[common] == dirs[common]:
      common += 1

    # close dirs
    for i in range(len(stack)-1, common-1, -1):
      lines.append(" " * ((i+1)*2) + "</dir>")
    stack = stack[:common]

    # open dirs
    for i in range(common, len(dirs)):
      d = dirs[i]
      lines.append(" " * ((i+1)*2) + f'<dir name="{d}">')
      stack.append(d)

    # file
    lines.append(" " * ((len(stack)+1)*2) + f'<file name="{fname}"/>')

  # close remaining
  for i in range(len(stack)-1, -1, -1):
    lines.append(" " * ((i+1)*2) + "</dir>")

  lines.append("</repo>")
  return "\\n".join(lines) + "\\n"

paths = get_paths()
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
  f.write(emit_xml(paths))

print(out)
PY

echo "OK: generado $OUT_FILE"
