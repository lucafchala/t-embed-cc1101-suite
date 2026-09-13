#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
merge_provenance.py -- concatena os provenance_*.csv gerados pelos scripts
de reorganizacao (classify_nfc.py, classify_badusb.py) e o registro de
auditoria do merge ir/rf (tools/migrations/2026-09-merge-ir-rf/
provenance_ir_rf_merge.csv) num PROVENANCE.csv unico na raiz do repo.

Cada fonte pode ter nomes de coluna diferentes -- um "field_map" por fonte
traduz pro schema comum (FIELDNAMES) antes de juntar. So concatena as
fontes que existirem -- nao e erro faltar uma.

Linhas cujo merge_type/acao contenha "dropped"/"discard" (ex.: o
"duplicate-dropped" do merge ir/rf) documentam um arquivo REMOVIDO, nao
uma localizacao final -- sao excluidas da checagem de new_path duplicado
(esperado que varias delas apontem pro mesmo destino sobrevivente).

Uso:
  python3 merge_provenance.py
"""
import csv
import os
import sys

REPO_ROOT = os.environ.get("REPO_ROOT", os.getcwd())
FIELDNAMES = ["new_path", "function", "bucket", "original_vendor_folder", "merge_type"]

# Cada fonte: path relativo ao REPO_ROOT + field_map (None = colunas ja
# batem com FIELDNAMES; dict = traduz coluna-do-arquivo -> campo-comum)
SOURCES = [
    {
        "path": "tools/migrations/2026-09-merge-ir-rf/provenance_ir_rf_merge.csv",
        "field_map": {
            "new_path": "destino",
            "function": "funcao",
            "bucket": "categoria",
            "original_vendor_folder": "origem_original",
            "merge_type": "acao",
        },
    },
    {"path": "provenance_nfc.csv", "field_map": None},
    {"path": "provenance_badusb.csv", "field_map": None},
]

OUT = os.path.join(REPO_ROOT, "PROVENANCE.csv")

# merge_type/acao que documentam um arquivo removido (nao uma localizacao
# final) -- excluidos da checagem de new_path duplicado.
DROPPED_MARKERS = ("dropped", "discard")


def main():
    found = []
    rows = []
    for src in SOURCES:
        path = os.path.join(REPO_ROOT, src["path"])
        if not os.path.exists(path):
            print(f"  (pulando {src['path']} -- nao existe ainda)")
            continue
        found.append(src["path"])
        field_map = src["field_map"]
        with open(path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            file_fields = reader.fieldnames or []
            if field_map is None:
                missing = [c for c in FIELDNAMES if c not in file_fields]
                if missing:
                    print(f"ABORTADO -- {src['path']} nao tem as colunas esperadas: faltam {missing}")
                    sys.exit(1)
                for row in reader:
                    rows.append({k: row.get(k, "") for k in FIELDNAMES})
            else:
                missing = [c for c in field_map.values() if c not in file_fields]
                if missing:
                    print(f"ABORTADO -- {src['path']} nao tem as colunas mapeadas: faltam {missing}")
                    sys.exit(1)
                for row in reader:
                    rows.append({k: row.get(field_map[k], "") for k in FIELDNAMES})

    if not found:
        print("Nenhuma fonte de provenance encontrada.")
        sys.exit(1)

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES)
        w.writeheader()
        w.writerows(rows)

    print(f"Juntado de {', '.join(found)}: {len(rows)} linhas escritas em {OUT}")

    seen = {}
    dupes = []
    for row in rows:
        p = row["new_path"]
        mt = (row.get("merge_type") or "").lower()
        if "(descartado" in p or any(marker in mt for marker in DROPPED_MARKERS):
            continue
        if p in seen:
            dupes.append(p)
        seen[p] = True
    if dupes:
        print()
        print(f"AVISO -- {len(dupes)} new_path duplicado(s) no provenance combinado (confira!):")
        for d in dupes[:20]:
            print(f"  {d}")


if __name__ == "__main__":
    main()
