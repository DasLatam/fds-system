#!/usr/bin/env python3
import os
import sys
import tarfile
import glob

EXCLUDE_DIRS = {".git", ".next", "node_modules"}
EXCLUDE_FILES = {".DS_Store"}
EXCLUDE_PREFIXES = {"._"}  # archivos macOS

def iter_files(path: str):
    path = path.rstrip("/")

    if os.path.isdir(path):
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            for f in files:
                if f in EXCLUDE_FILES: 
                    continue
                if any(f.startswith(p) for p in EXCLUDE_PREFIXES):
                    continue
                full = os.path.join(root, f)
                yield full
    elif os.path.isfile(path):
        base = os.path.basename(path)
        if base in EXCLUDE_FILES or any(base.startswith(p) for p in EXCLUDE_PREFIXES):
            return
        yield path

def expand_args(args):
    expanded = []
    for a in args:
        # Si existe literal, lo usamos literal (importantísimo para app/s/[token]/...)
        if os.path.exists(a):
            expanded.append(a)
            continue
        # Si no existe, intentamos glob (por si pasás app/dashboard/**/*.tsx)
        matches = glob.glob(a, recursive=True)
        if matches:
            expanded.extend(matches)
        else:
            print(f"[WARN] No existe: {a}", file=sys.stderr)
    return expanded

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/make-patch-tgz.py salida.tgz [paths...]", file=sys.stderr)
        sys.exit(1)

    out = sys.argv[1]
    paths = expand_args(sys.argv[2:])

    if not paths:
        print("[ERROR] No se encontraron archivos para empaquetar.", file=sys.stderr)
        sys.exit(2)

    repo_root = os.getcwd()
    added = set()

    with tarfile.open(out, "w:gz") as tar:
        for p in paths:
            for f in iter_files(p):
                rel = os.path.relpath(f, repo_root)
                if rel.startswith(".."):
                    print(f"[WARN] Fuera del repo, se omite: {f}", file=sys.stderr)
                    continue
                if rel in added:
                    continue
                tar.add(f, arcname=rel)
                added.add(rel)

    print(f"[OK] Generado: {out} ({len(added)} archivos)")

if __name__ == "__main__":
    main()
