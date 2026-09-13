#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
classify_nfc.py -- reorganiza sd_card_content/nfc/ pela taxonomia por
marca/dispositivo definida em taxonomy.yaml (nfc_merge_groups /
nfc_simple_rename), resolvendo a duplicacao real ja identificada:
  - Amiibo esta espalhado em 3 vendors (AmiiboDB, Bruce-Scripts-Heaven_RFID/
    Amiibo, UberGuidoZ_Amiibo_Tools)
  - Tonies esta espalhado em 2 vendors (Tonies_NFC, Bruce-Scripts-Heaven_
    RFID/Toniebox)

Mesma logica de 3 classes por arquivo usada no merge ir/rf
(merge_ir_rf.py): dentro de cada grupo, pro mesmo caminho relativo de
destino --
  - so 1 fonte tem esse arquivo            -> MOVIDO
  - 2+ fontes tem o MESMO hash             -> DEDUP (mantem 1 copia, descarta
                                               as outras -- sao bit-a-bit
                                               identicas, nao e perda de
                                               conteudo)
  - 2+ fontes tem hash DIFERENTE           -> CONFLITO (mantem todas, com
                                               sufixo _altN nas que vieram
                                               depois da primeira)

Movimentacao e feita com shutil.move (nao git mv por arquivo -- lento
demais pra milhares de arquivos). Depois de rodar com "apply", faca
`git add -A` -- o git detecta rename por similaridade de conteudo sozinho
pra maioria dos arquivos, então o historico nao se perde na pratica.

Uso:
  python3 classify_nfc.py                 # dry-run: só relatorio, nao mexe em nada
  python3 classify_nfc.py apply           # aplica de verdade + escreve provenance_nfc.csv
"""
import sys
import os
import shutil
import hashlib
import csv

try:
    import yaml
except ImportError:
    import subprocess
    print("pyyaml nao encontrado, instalando...")
    subprocess.run([sys.executable, "-m", "pip", "install", "--break-system-packages", "pyyaml"], check=True)
    import yaml

APPLY = len(sys.argv) > 1 and sys.argv[1] == "apply"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TAXONOMY_PATH = os.environ.get("TAXONOMY_PATH", os.path.join(SCRIPT_DIR, "taxonomy.yaml"))
REPO_ROOT = os.environ.get("REPO_ROOT", os.getcwd())
NFC_ROOT = os.path.join(REPO_ROOT, "sd_card_content", "nfc")
PROVENANCE_CSV = os.path.join(REPO_ROOT, "provenance_nfc.csv")


def load_taxonomy():
    with open(TAXONOMY_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def walk_files(root):
    """yield (abs_path, relpath_from_root) for every regular file under root"""
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            ap = os.path.join(dirpath, fn)
            rp = os.path.relpath(ap, root)
            yield ap, rp


def plan_merge_group(group_name, sources):
    """
    sources: list of relpaths under NFC_ROOT (each either a directory or a
    single file). Returns (plan, problems) where plan is a list of dict
    entries describing what happens to every source file, and problems is
    a list of fatal issues (missing source paths) that abort this group.
    """
    problems = []
    # dest_relpath -> list of (source_label, abs_src_path, hash)
    buckets = {}

    for src_rel in sources:
        src_abs = os.path.join(NFC_ROOT, src_rel)
        if not os.path.exists(src_abs):
            problems.append(f"fonte nao encontrada: sd_card_content/nfc/{src_rel}")
            continue
        if os.path.isfile(src_abs):
            # arquivo solto -- destino e so o basename
            dest_rel = os.path.basename(src_abs)
            h = sha256_of(src_abs)
            buckets.setdefault(dest_rel, []).append((src_rel, src_abs, h))
        else:
            for ap, rp in walk_files(src_abs):
                h = sha256_of(ap)
                buckets.setdefault(rp, []).append((src_rel, ap, h))

    if problems:
        return None, problems

    plan = []
    for dest_rel, entries in buckets.items():
        if len(entries) == 1:
            src_label, src_abs, h = entries[0]
            plan.append({
                "action": "move", "group": group_name, "dest_rel": dest_rel,
                "src_label": src_label, "src_abs": src_abs, "hash": h,
            })
        else:
            hashes = set(h for (_l, _a, h) in entries)
            if len(hashes) == 1:
                # todas identicas -- mantem a primeira, descarta o resto
                keep_label, keep_abs, keep_hash = entries[0]
                plan.append({
                    "action": "move", "group": group_name, "dest_rel": dest_rel,
                    "src_label": keep_label, "src_abs": keep_abs, "hash": keep_hash,
                })
                for drop_label, drop_abs, drop_hash in entries[1:]:
                    plan.append({
                        "action": "dedup_discard", "group": group_name, "dest_rel": dest_rel,
                        "src_label": drop_label, "src_abs": drop_abs, "hash": drop_hash,
                    })
            else:
                # conteudo diferente no mesmo caminho -- mantem todas com sufixo
                root, ext = os.path.splitext(dest_rel)
                for i, (src_label, src_abs, h) in enumerate(entries):
                    if i == 0:
                        final_rel = dest_rel
                    else:
                        suffix = f"_alt{i}" if i > 1 else "_alt"
                        final_rel = f"{root}{suffix}{ext}"
                    plan.append({
                        "action": "move", "group": group_name, "dest_rel": final_rel,
                        "src_label": src_label, "src_abs": src_abs, "hash": h,
                        "conflict": True,
                    })

    return plan, []


def execute_plan(all_plans, provenance_rows):
    for entry in all_plans:
        group = entry["group"]
        dest_abs = os.path.join(NFC_ROOT, group, entry["dest_rel"])
        if entry["action"] == "move":
            if APPLY:
                os.makedirs(os.path.dirname(dest_abs), exist_ok=True)
                shutil.move(entry["src_abs"], dest_abs)
            merge_type = "hash-merged-conflict-suffixed" if entry.get("conflict") else (
                "moved" if not entry.get("_was_dup_survivor") else "hash-merged-dedup-kept"
            )
            provenance_rows.append({
                "new_path": f"sd_card_content/nfc/{group}/{entry['dest_rel']}",
                "function": "nfc", "bucket": group,
                "original_vendor_folder": entry["src_label"],
                "merge_type": merge_type,
            })
        elif entry["action"] == "dedup_discard":
            if APPLY:
                os.remove(entry["src_abs"])
            provenance_rows.append({
                "new_path": f"sd_card_content/nfc/{group}/{entry['dest_rel']} (descartado -- duplicata exata)",
                "function": "nfc", "bucket": group,
                "original_vendor_folder": entry["src_label"],
                "merge_type": "hash-merged-dedup-discarded",
            })


def sweep_empty_dirs(root):
    """varredura final: remove qualquer diretorio vazio que sobrou sob root
    (ex.: o container do vendor que ficou vazio depois que so as SUBpastas
    dele foram listadas como fonte em grupos diferentes). So remove
    diretorios sem nenhum arquivo dentro, em qualquer profundidade -- nunca
    remove algo que ainda tenha conteudo."""
    removed = []
    for dirpath, _dirnames, _filenames in os.walk(root, topdown=False):
        if dirpath == root:
            continue
        # dirnames/filenames do os.walk sao um snapshot tirado ANTES da
        # descida recursiva -- se um filho foi removido nesta mesma
        # varredura (bottom-up), essa lista fica desatualizada. Checa o
        # estado real do diretorio agora, nao o snapshot.
        if not os.listdir(dirpath):
            os.rmdir(dirpath)
            removed.append(os.path.relpath(dirpath, root))
    return removed


def cleanup_empty_dirs(paths):
    """apos mover tudo, remove diretorios de vendor que ficaram vazios.
    Se algo sobrar (nao deveria), avisa em vez de apagar silenciosamente."""
    leftovers = []
    for rel in paths:
        abs_p = os.path.join(NFC_ROOT, rel)
        if not os.path.isdir(abs_p):
            continue
        remaining = list(walk_files(abs_p))
        if remaining:
            leftovers.append((rel, len(remaining)))
            continue
        if APPLY:
            # remove a arvore de diretorios vazios (nao remove se sobrou arquivo)
            # -- checa os.listdir() real a cada passo, nao o snapshot do os.walk
            # (que fica desatualizado apos um filho ser removido na mesma varredura)
            for dirpath, _dirnames, _filenames in os.walk(abs_p, topdown=False):
                if not os.listdir(dirpath):
                    os.rmdir(dirpath)
            if os.path.isdir(abs_p) and not os.listdir(abs_p):
                os.rmdir(abs_p)
    return leftovers


def main():
    tax = load_taxonomy()
    merge_groups = tax.get("nfc_merge_groups", {})
    simple_rename = tax.get("nfc_simple_rename", {})

    all_problems = []
    all_plans = []
    for group_name, sources in merge_groups.items():
        plan, problems = plan_merge_group(group_name, sources)
        if problems:
            all_problems.extend([f"[{group_name}] {p}" for p in problems])
            continue
        all_plans.extend(plan)

    if all_problems:
        print("ABORTADO -- problemas encontrados antes de qualquer alteracao:")
        for p in all_problems:
            print(f"  - {p}")
        sys.exit(1)

    # relatorio por grupo
    print("=== plano de merge (nfc) ===")
    by_group = {}
    for entry in all_plans:
        g = by_group.setdefault(entry["group"], {"moved": 0, "dedup_discarded": 0, "conflict_kept": 0})
        if entry["action"] == "dedup_discard":
            g["dedup_discarded"] += 1
        elif entry["action"] == "move" and entry.get("conflict"):
            g["conflict_kept"] += 1
        elif entry["action"] == "move":
            g["moved"] += 1

    for group_name, stats in by_group.items():
        print(f"  {group_name}: {stats['moved']} movidos, {stats['dedup_discarded']} duplicatas exatas descartadas, {stats['conflict_kept']} em conflito (mantidos com sufixo)")

    print()
    print("=== renames simples (sem merge) ===")
    simple_problems = []
    for src_rel, dest_rel in simple_rename.items():
        src_abs = os.path.join(NFC_ROOT, src_rel)
        if not os.path.exists(src_abs):
            simple_problems.append(f"fonte nao encontrada: sd_card_content/nfc/{src_rel}")
            continue
        if src_rel == dest_rel:
            print(f"  {src_rel} -- ja esta no lugar certo, nada a fazer")
        else:
            n = sum(1 for _ in walk_files(src_abs))
            print(f"  {src_rel} -> {dest_rel} ({n} arquivos)")
            if APPLY:
                dest_abs = os.path.join(NFC_ROOT, dest_rel)
                os.makedirs(os.path.dirname(dest_abs), exist_ok=True)
                shutil.move(src_abs, dest_abs)

    if simple_problems:
        print("ABORTADO -- problemas nos renames simples:")
        for p in simple_problems:
            print(f"  - {p}")
        sys.exit(1)

    provenance_rows = []
    if APPLY:
        execute_plan(all_plans, provenance_rows)
        all_sources = [s for sources in merge_groups.values() for s in sources]
        leftovers = cleanup_empty_dirs(all_sources)
        if leftovers:
            print()
            print("AVISO -- sobrou arquivo em pastas que deveriam estar vazias apos o merge:")
            for rel, n in leftovers:
                print(f"  {rel}: {n} arquivo(s) restante(s) -- NAO removidos, confira manualmente")

        swept = sweep_empty_dirs(NFC_ROOT)
        if swept:
            print()
            print(f"Varredura final removeu {len(swept)} diretorio(s) vazio(s) que sobraram (containers de vendor sem arquivo direto):")
            for rel in swept:
                print(f"  {rel}")

        with open(PROVENANCE_CSV, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["new_path", "function", "bucket", "original_vendor_folder", "merge_type"])
            w.writeheader()
            w.writerows(provenance_rows)
        print()
        print(f"Aplicado. Provenance de {len(provenance_rows)} entradas escrito em {PROVENANCE_CSV}")
        print("Rode 'git add -A' e revise 'git status' antes de commitar -- o git deve")
        print("detectar a maioria como rename por similaridade de conteudo.")
    else:
        print()
        print("Dry-run -- nada foi alterado. Rode 'python3 classify_nfc.py apply' pra executar.")


if __name__ == "__main__":
    main()

