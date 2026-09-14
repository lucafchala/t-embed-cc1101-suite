#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
merge_provenance.py -- concatena os provenance_*.csv gerados pelos scripts
de reorganizacao (classify_nfc.py, classify_badusb.py) e o registro de
auditoria do merge ir/rf (tools/migrations/2026-09-merge-ir-rf/
provenance_ir_rf_merge.csv) num PROVENANCE.csv unico na raiz do repo.

Cada fonte pode ter nomes de coluna diferentes -- um "field_map" por fonte
traduz pro schema comum (FIELDNAMES) antes de juntar. Uma fonte tambem
pode ter "path_prefix_renames": o registro de auditoria do merge ir/rf
foi gravado ANTES do rename final ir_extra_dbs/subghz_extra_dbs -> ir/rf,
entao os "destino" que ele guarda usam o nome de container antigo -- sem
essa reescrita, toda linha vinda dessa fonte apareceria como orfa mesmo
existindo, so que sob o nome novo do container.

So concatena as fontes que existirem -- nao e erro faltar uma.

Linhas cujo merge_type/acao contenha "dropped"/"discard" (ex.: o
"duplicate-dropped" do merge ir/rf) documentam um arquivo REMOVIDO, nao
uma localizacao final -- sao excluidas da checagem de new_path duplicado
(esperado que varias delas apontem pro mesmo destino sobrevivente).

Tambem cruza com DEDUP_LOGS (ex.: tools/provenance_sources/dedup_removed_badusb.csv) pra excluir
linhas cujo arquivo foi apagado por uma dedup posterior ao provenance_*.csv
de origem ter sido gravado.

Uso:
  python3 merge_provenance.py
"""
import csv
import os
import sys

REPO_ROOT = os.environ.get("REPO_ROOT", os.getcwd())
FIELDNAMES = ["new_path", "function", "bucket", "original_vendor_folder", "merge_type"]

# Cada fonte: path relativo ao REPO_ROOT + field_map (None = colunas ja
# batem com FIELDNAMES; dict = traduz coluna-do-arquivo -> campo-comum) +
# path_prefix_renames opcional (aplicado so no campo new_path, pra corrigir
# containers renomeados depois que o CSV de origem foi gravado).
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
        "path_prefix_renames": {
            "sd_card_content/ir_extra_dbs/": "sd_card_content/ir/",
            "sd_card_content/subghz_extra_dbs/": "sd_card_content/rf/",
        },
    },
    {"path": "tools/provenance_sources/provenance_nfc.csv", "field_map": None, "path_prefix_renames": None},
    {"path": "tools/provenance_sources/provenance_badusb.csv", "field_map": None, "path_prefix_renames": None},
]

OUT = os.path.join(REPO_ROOT, "PROVENANCE.csv")

# Logs de dedup pos-classificacao: arquivos listados aqui como
# "removed_path" foram fisicamente apagados depois que o provenance_*.csv
# de origem foi gravado (ex.: dedup_badusb.py rodou DEPOIS do apply do
# classify_badusb.py). Excluidos do PROVENANCE.csv final pra nao deixar
# linha orfa apontando pra um arquivo que nao existe mais.
DEDUP_LOGS = ["tools/provenance_sources/dedup_removed_badusb.csv"]

# merge_type/acao que documentam um arquivo removido (nao uma localizacao
# final) -- excluidos da checagem de new_path duplicado.
DROPPED_MARKERS = ("dropped", "discard")


def load_removed_paths():
    removed = set()
    for name in DEDUP_LOGS:
        p = os.path.join(REPO_ROOT, name)
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rp = row.get("removed_path")
                if rp:
                    removed.add(rp)
    return removed


def apply_prefix_renames(path, renames):
    if not renames:
        return path
    for old, new in renames.items():
        if path.startswith(old):
            return new + path[len(old):]
    return path


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
        renames = src.get("path_prefix_renames")
        with open(path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            file_fields = reader.fieldnames or []
            if field_map is None:
                missing = [c for c in FIELDNAMES if c not in file_fields]
                if missing:
                    print(f"ABORTADO -- {src['path']} nao tem as colunas esperadas: faltam {missing}")
                    sys.exit(1)
                for row in reader:
                    mapped = {k: row.get(k, "") for k in FIELDNAMES}
                    mapped["new_path"] = apply_prefix_renames(mapped["new_path"], renames)
                    rows.append(mapped)
            else:
                missing = [c for c in field_map.values() if c not in file_fields]
                if missing:
                    print(f"ABORTADO -- {src['path']} nao tem as colunas mapeadas: faltam {missing}")
                    sys.exit(1)
                for row in reader:
                    mapped = {k: row.get(field_map[k], "") for k in FIELDNAMES}
                    mapped["new_path"] = apply_prefix_renames(mapped["new_path"], renames)
                    rows.append(mapped)

    if not found:
        print("Nenhuma fonte de provenance encontrada.")
        sys.exit(1)

    removed_paths = load_removed_paths()
    if removed_paths:
        before = len(rows)
        rows = [r for r in rows if r["new_path"] not in removed_paths]
        print(f"Excluidas {before - len(rows)} linha(s) cujo arquivo foi removido por um dedup posterior.")

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
