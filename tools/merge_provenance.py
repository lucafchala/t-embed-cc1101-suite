#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
merge_provenance.py -- concatena os provenance_*.csv gerados pelos scripts
de reorganizacao (classify_nfc.py, classify_badusb.py, e o
provenance_ir_rf_merge.csv de uma rodada anterior, se existir) num
PROVENANCE.csv unico na raiz do repo. Roda DEPOIS que classify_nfc.py e
classify_badusb.py ja tiverem sido aplicados de verdade (apply) -- nao
antes, senao nao ha nada pra juntar.

So concatena os arquivos que existirem -- nao e erro faltar um (por
exemplo, se so nfc foi aplicado ainda e badusb nao).

Uso:
  python3 merge_provenance.py
"""
import csv
import os
import sys

REPO_ROOT = os.environ.get("REPO_ROOT", os.getcwd())
SOURCES = ["provenance_ir_rf_merge.csv", "provenance_nfc.csv", "provenance_badusb.csv"]
OUT = os.path.join(REPO_ROOT, "PROVENANCE.csv")
FIELDNAMES = ["new_path", "function", "bucket", "original_vendor_folder", "merge_type"]


def main():
    found = []
    rows = []
    for name in SOURCES:
        path = os.path.join(REPO_ROOT, name)
        if not os.path.exists(path):
            print(f"  (pulando {name} -- nao existe ainda)")
            continue
        found.append(name)
        with open(path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            file_fields = reader.fieldnames or []
            missing = [c for c in FIELDNAMES if c not in file_fields]
            if missing:
                print(f"ABORTADO -- {name} nao tem as colunas esperadas: faltam {missing}")
                sys.exit(1)
            for row in reader:
                rows.append({k: row.get(k, "") for k in FIELDNAMES})

    if not found:
        print("Nenhum provenance_*.csv encontrado -- rode classify_nfc.py e/ou")
        print("classify_badusb.py com 'apply' primeiro.")
        sys.exit(1)

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES)
        w.writeheader()
        w.writerows(rows)

    print(f"Juntado de {', '.join(found)}: {len(rows)} linhas escritas em {OUT}")
    # checagem basica: nenhum new_path duplicado (indicaria um bug em algum
    # dos scripts de origem -- dois arquivos diferentes tentando ocupar o
    # mesmo caminho final)
    seen = {}
    dupes = []
    for row in rows:
        p = row["new_path"]
        if "(descartado" in p:
            continue  # linhas de dedup-discard nao sao um path real final
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

