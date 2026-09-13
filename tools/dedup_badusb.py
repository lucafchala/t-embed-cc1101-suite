#!/usr/bin/env python3
"""
dedup_badusb.py -- pos-processamento de deduplicacao por hash de conteudo
pra sd_card_content/badusb_extra_payloads/, DEPOIS do apply real de
classify_badusb.py.

Motivo: Bruce-Scripts-Heaven_BAD e uma mega-colecao com sub-colecoes
sobrepostas/duplicadas (omg-payloads-master/, UNC0V3R3D-BadUSB/, uma pasta
BadUSB/ que espelha a propria raiz do vendor, etc.) -- classify_badusb.py
classifica cada arquivo pelo nome/conteudo, sem checar se o MESMO conteudo
ja foi classificado a partir de outro caminho de origem. Isso deixa
duplicatas exatas espalhadas pela arvore final (126 grupos encontrados no
scan de 2026-09-13).

Uso:
    python3 tools/dedup_badusb.py            # dry-run (nao mexe em nada)
    python3 tools/dedup_badusb.py apply      # aplica de verdade: remove os
                                              # arquivos redundantes,
                                              # mantendo so 1 copia canonica
                                              # por grupo de hash

Le provenance_badusb.csv (gerado pelo apply do classify_badusb.py) pra
decidir qual copia manter quando ha duplicata -- a escolha e por REGRA
(nunca por ordem de descoberta no filesystem, que seria nao-deterministica
entre rodadas):

  1. original_vendor_folder contem "BadUsb-Library" -> sempre vence (e o
     vendor curado oficialmente, nunca um scrape).
  2. original_vendor_folder bate em um dos marcadores conhecidos de
     colecao-duplicada-embutida (REDUNDANT_MARKERS abaixo) -> sempre perde
     pra qualquer copia que nao bata nesses marcadores.
  3. bucket == "_unclassified" -> perde pra qualquer copia que tenha caido
     numa categoria real (uma copia classificada e estritamente mais util
     que uma igual em _unclassified).
  4. Empate depois disso: mantem o path mais curto, desempate alfabetico
     (so pra ser deterministico -- na pratica quase nunca chega aqui).

Cada arquivo removido e logado em dedup_removed_badusb.csv
(removed_path, kept_path, sha256) -- nunca so deletado sem rastro.
"""
import csv
import hashlib
import os
import sys
from collections import defaultdict

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BADUSB_ROOT = os.path.join(REPO_ROOT, "sd_card_content", "badusb_extra_payloads")
PROVENANCE_CSV = os.path.join(REPO_ROOT, "provenance_badusb.csv")
DEDUP_LOG_CSV = os.path.join(REPO_ROOT, "dedup_removed_badusb.csv")

# Marcadores de colecao-duplicada-embutida conhecida dentro de
# Bruce-Scripts-Heaven_BAD (achados no dry-run/apply real de 2026-09-13).
# Qualquer copia cujo original_vendor_folder contenha um desses e sempre
# a candidata a ser removida quando existir outra copia sem esse marcador.
REDUNDANT_MARKERS = [
    "omg-payloads-master",
    "UNC0V3R3D-BadUSB",
    "UNC0V3R3D-BadUSB-Collection",
    # pasta "BadUSB/" dentro do proprio Bruce-Scripts-Heaven_BAD que
    # espelha a raiz do vendor (ex.: exfiltration/Win/History-Pig/... e
    # BadUSB/exfiltration/Win/History-Pig/... com o MESMO conteudo) --
    # a barra depois de "BadUSB" evita casar com "BadUSB-FalsePhilosopher/"
    "Bruce-Scripts-Heaven_BAD/BadUSB/",
]


def load_provenance():
    rows = {}
    if not os.path.exists(PROVENANCE_CSV):
        print(f"AVISO: {PROVENANCE_CSV} nao encontrado -- o criterio de "
              f"escolha vai usar so o tamanho do path (menos preciso).")
        return rows
    with open(PROVENANCE_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows[row["new_path"]] = row
    return rows


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def rank_key(relpath, prov_row):
    ovf = (prov_row or {}).get("original_vendor_folder", "") or ""
    bucket = (prov_row or {}).get("bucket", "") or ""

    if "BadUsb-Library" in ovf:
        source_rank = 0
    elif any(marker in ovf for marker in REDUNDANT_MARKERS):
        source_rank = 2
    else:
        source_rank = 1

    bucket_norm = bucket.strip("/").lower()
    bucket_rank = 1 if bucket_norm == "_unclassified" else 0

    return (source_rank, bucket_rank, len(relpath), relpath)


def main():
    apply_mode = len(sys.argv) > 1 and sys.argv[1] == "apply"
    prov = load_provenance()

    if not os.path.isdir(BADUSB_ROOT):
        print(f"ERRO: {BADUSB_ROOT} nao existe.")
        sys.exit(1)

    hashes = defaultdict(list)
    total_files = 0
    for dirpath, _dirnames, filenames in os.walk(BADUSB_ROOT):
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, REPO_ROOT)
            total_files += 1
            try:
                h = sha256_of(full)
            except OSError as e:
                print(f"AVISO: nao consegui ler {rel}: {e}")
                continue
            hashes[h].append(rel)

    dup_groups = {h: paths for h, paths in hashes.items() if len(paths) > 1}
    total_redundant = sum(len(paths) - 1 for paths in dup_groups.values())

    print(f"Total de arquivos escaneados: {total_files}")
    print(f"Grupos de conteudo duplicado: {len(dup_groups)}")
    print(f"Arquivos redundantes (alem da 1a copia de cada): {total_redundant}")
    print()

    removed_log = []
    for h, paths in sorted(dup_groups.items(), key=lambda kv: kv[1][0]):
        ranked = sorted(paths, key=lambda p: rank_key(p, prov.get(p)))
        keep = ranked[0]
        discard = ranked[1:]
        print(f"[grupo {h[:12]}] mantem: {keep}")
        for d in discard:
            print(f"    remove: {d}")
            removed_log.append({"removed_path": d, "kept_path": keep, "sha256": h})
            if apply_mode:
                os.remove(os.path.join(REPO_ROOT, d))

    if apply_mode:
        removed_dirs = 0
        for dirpath, dirnames, filenames in os.walk(BADUSB_ROOT, topdown=False):
            if not dirnames and not filenames:
                os.rmdir(dirpath)
                removed_dirs += 1
        print(f"\nVarredura final removeu {removed_dirs} diretorio(s) vazio(s).")

        with open(DEDUP_LOG_CSV, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["removed_path", "kept_path", "sha256"])
            w.writeheader()
            w.writerows(removed_log)
        print(f"Log gravado em {DEDUP_LOG_CSV} ({len(removed_log)} linhas).")
        print("\nAPLICADO DE VERDADE -- arquivos redundantes removidos.")
    else:
        print("\n(dry-run -- nada foi removido. Rode com 'apply' pra remover de verdade.)")
        print(f"Removeria {len(removed_log)} arquivo(s) redundante(s).")


if __name__ == "__main__":
    main()
