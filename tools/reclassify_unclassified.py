#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reclassify_unclassified.py -- reclassifica badusb_extra_payloads/_unclassified/
contra a taxonomia ATUAL de tools/taxonomy.yaml, SEM reprocessar a arvore
inteira. Existe porque classify_badusb.py so sabe operar a partir dos
vendors originais no topo de badusb_extra_payloads/ (que ja nao existem
mais depois do apply) -- depois da primeira classificacao, estender
taxonomy.yaml com keywords novas exige ESTE script pra recuperar os
arquivos que ficaram em _unclassified/ e agora batem numa categoria real.

Reusa a mesma logica de matching de classify_badusb.py (importado como
modulo, sem duplicar codigo) -- as regras vivem so em taxonomy.yaml.

Uso:
  python3 reclassify_unclassified.py            # dry-run
  python3 reclassify_unclassified.py apply       # aplica + atualiza tools/provenance_sources/provenance_badusb.csv
"""
import sys
import os
import csv
import shutil
import importlib.util

MODE = sys.argv[1] if len(sys.argv) > 1 else "dryrun"
APPLY = MODE == "apply"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.environ.get("REPO_ROOT", os.getcwd())
BADUSB_ROOT = os.path.join(REPO_ROOT, "sd_card_content", "badusb_extra_payloads")
UNCLASSIFIED_ROOT = os.path.join(BADUSB_ROOT, "_unclassified")
PROVENANCE_CSV = os.path.join(REPO_ROOT, "tools/provenance_sources/provenance_badusb.csv")

spec = importlib.util.spec_from_file_location("classify_badusb", os.path.join(SCRIPT_DIR, "classify_badusb.py"))
classify_badusb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(classify_badusb)


def load_provenance_rows():
    with open(PROVENANCE_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def main():
    taxonomy = classify_badusb.load_taxonomy()
    categories = taxonomy["badusb_categories"]
    platforms = taxonomy["badusb_platforms"]
    markers = taxonomy["badusb_readiness_markers"]

    if not os.path.isdir(UNCLASSIFIED_ROOT):
        print("Nada em _unclassified/ -- nada a fazer.")
        return

    moves = []
    still_unclassified = 0
    for vendor in sorted(os.listdir(UNCLASSIFIED_ROOT)):
        vroot = os.path.join(UNCLASSIFIED_ROOT, vendor)
        if not os.path.isdir(vroot):
            continue
        for ap, rel in classify_badusb.walk_files(vroot):
            rel_variants = classify_badusb.build_variants(rel)
            content = classify_badusb.read_head(ap, classify_badusb.MAX_CONTENT_READ_BYTES)
            content_variants = classify_badusb.build_variants(content) if content is not None else ("", "")
            category, match_source = classify_badusb.classify_category_detailed(rel_variants, content_variants, categories)
            if category == "_unclassified":
                still_unclassified += 1
                continue
            combined_variants = tuple(rv + "\n" + cv for rv, cv in zip(rel_variants, content_variants))
            platform = classify_badusb.classify_platform(combined_variants, platforms)
            readiness = classify_badusb.classify_readiness_from_content(content, markers)
            old_rel_from_badusb_root = os.path.relpath(ap, BADUSB_ROOT)
            target_rel = os.path.join(category, platform, readiness, vendor, rel)
            moves.append({
                "src_abs": ap,
                "target_rel": target_rel,
                "vendor": vendor,
                "category": category,
                "platform": platform,
                "readiness": readiness,
                "old_new_path": f"sd_card_content/badusb_extra_payloads/{old_rel_from_badusb_root}",
                "new_new_path": f"sd_card_content/badusb_extra_payloads/{target_rel}",
                "match_source": match_source,
            })

    print(f"Arquivos em _unclassified/ que agora batem numa categoria real: {len(moves)}")
    for m in moves:
        print(f"  [{m['category']}/{m['platform']}/{m['readiness']}] {m['vendor']}: {m['old_new_path']} -> {m['new_new_path']} (via {m['match_source']})")
    print(f"Continuam sem match: {still_unclassified}")

    if not APPLY:
        print("\n(dry-run -- nada foi alterado. Rode com 'apply' pra mover de verdade.)")
        return

    if not moves:
        print("\nNada pra aplicar.")
        return

    rows = load_provenance_rows()
    by_new_path = {r["new_path"]: r for r in rows}

    for m in moves:
        target_abs = os.path.join(BADUSB_ROOT, m["target_rel"])
        os.makedirs(os.path.dirname(target_abs), exist_ok=True)
        shutil.move(m["src_abs"], target_abs)
        row = by_new_path.get(m["old_new_path"])
        if row is not None:
            row["new_path"] = m["new_new_path"]
            row["bucket"] = m["category"]
            row["merge_type"] = "reclassified"
        else:
            rows.append({
                "new_path": m["new_new_path"], "function": "badusb", "bucket": m["category"],
                "original_vendor_folder": m["vendor"], "merge_type": "reclassified",
            })

    removed_dirs = 0
    for dirpath, dirnames, filenames in os.walk(UNCLASSIFIED_ROOT, topdown=False):
        if not dirnames and not filenames:
            os.rmdir(dirpath)
            removed_dirs += 1
    print(f"\nVarredura removeu {removed_dirs} diretorio(s) vazio(s) em _unclassified/.")

    with open(PROVENANCE_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["new_path", "function", "bucket", "original_vendor_folder", "merge_type"])
        w.writeheader()
        w.writerows(rows)
    print(f"tools/provenance_sources/provenance_badusb.csv atualizado ({len(rows)} linhas).")


if __name__ == "__main__":
    main()
