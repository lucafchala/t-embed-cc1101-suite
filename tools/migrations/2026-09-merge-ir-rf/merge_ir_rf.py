#!/usr/bin/env python3
"""
merge_ir_rf.py -- funde universal_ir/assets/* em ir_extra_dbs/*
                  e universal_rf/*        em subghz_extra_dbs/*

Corrige um gap do dryrun_merge_ir_rf_v2.py: aquele script só sabia
classificar "só existe na origem" (mover) e "categoria inteira idêntica"
(descartar). Arquivo que existe nos dois lados com hash IGUAL mas dentro
de uma categoria só PARCIALMENTE duplicada nunca era tocado -- ficava
como duplicata órfã, sem mover nem descartar. Este script fecha esse
buraco com uma terceira classe (duplicado) que se aplica por arquivo, não
por categoria inteira.

Classificação por arquivo:
  - só existe na origem               -> SEGURO mover      (git mv)
  - existe nos dois, hash IGUAL       -> SEGURO descartar  (git rm na origem)
  - existe nos dois, hash DIFERENTE   -> CONFLITO real, NUNCA tocado aqui

Uso:
  python3 merge_ir_rf.py            # dry-run: só mostra o plano, não muda nada
  python3 merge_ir_rf.py apply      # executa de fato (git mv / git rm)

Roda a partir da raiz do clone (mesmo padrão dos scripts anteriores).
"""
import os, sys, csv, hashlib, subprocess
from collections import defaultdict

ROOT = os.path.abspath(".")
APPLY = len(sys.argv) > 1 and sys.argv[1] == "apply"

MERGES = [
    ("ir", "sd_card_content/universal_ir/assets", "sd_card_content/ir_extra_dbs"),
    ("rf", "sd_card_content/universal_rf", "sd_card_content/subghz_extra_dbs"),
]

LOG_PATH = "merge_ir_rf.log"
log_f = open(LOG_PATH, "a", encoding="utf-8")


def log(msg):
    log_f.write(msg + "\n")


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def dir_signature(path):
    sig = {}
    for dirpath, _, filenames in os.walk(path):
        for fn in filenames:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, path)
            sig[rel] = sha256_file(full)
    return sig


def do_move(s, d):
    log(f"git mv {s} -> {d}")
    if APPLY:
        os.makedirs(os.path.dirname(d), exist_ok=True)
        r = subprocess.run(["git", "mv", s, d], cwd=ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            log(f"  FALHOU: {r.stderr.strip()}")
            return False
    return True


def do_drop(s):
    log(f"git rm {s}")
    if APPLY:
        r = subprocess.run(["git", "rm", "--quiet", s], cwd=ROOT, capture_output=True, text=True)
        if r.returncode != 0:
            log(f"  FALHOU: {r.stderr.strip()}")
            return False
    return True


def remove_empty_dirs(base):
    if not os.path.isdir(base):
        return
    for dirpath, _, _ in os.walk(base, topdown=False):
        try:
            os.rmdir(dirpath)
            log(f"pasta vazia removida: {dirpath}")
        except OSError:
            pass


move_rows, dup_rows, conflict_rows = [], [], []
subtotals = defaultdict(lambda: {"novos": 0, "duplicados": 0, "conflitos": 0})

for label, source_root, target_root in MERGES:
    if not os.path.isdir(source_root):
        continue
    for name in sorted(os.listdir(source_root)):
        src = os.path.join(source_root, name)
        if not os.path.isdir(src):
            continue
        dst = os.path.join(target_root, name)
        key = f"[{label}] {name}"

        if not os.path.exists(dst):
            move_rows.append((label, name, "categoria_inteira", src, dst))
            n_files = sum(len(fs) for _, _, fs in os.walk(src))
            subtotals[key]["novos"] += n_files
            continue

        sig_src = dir_signature(src)
        sig_dst = dir_signature(dst)

        for rel, h in sorted(sig_src.items()):
            s = os.path.join(src, rel)
            d = os.path.join(dst, rel)
            if rel not in sig_dst:
                move_rows.append((label, name, "arquivo_novo", s, d))
                subtotals[key]["novos"] += 1
            elif sig_dst[rel] == h:
                dup_rows.append((label, name, rel, s, d))
                subtotals[key]["duplicados"] += 1
            else:
                conflict_rows.append((label, name, rel, s, d, h[:12], sig_dst[rel][:12]))
                subtotals[key]["conflitos"] += 1

print(f"{'APLICANDO' if APPLY else 'DRY-RUN (nada muda ainda)'}\n")
print(f"{'categoria':30s} {'novos':>8s} {'duplicados':>11s} {'conflitos':>10s}")
for key in sorted(subtotals):
    s = subtotals[key]
    print(f"{key:30s} {s['novos']:8d} {s['duplicados']:11d} {s['conflitos']:10d}")

n_move = len(move_rows)
n_dup = len(dup_rows)
n_conflict = len(conflict_rows)
print(f"\nTOTAL: {n_move} pra mover, {n_dup} duplicatas pra descartar, {n_conflict} conflitos reais\n")

if n_conflict:
    print("Conflitos (mesmo caminho, conteúdo diferente -- NÃO tocados por este script):")
    for label, name, rel, s, d, hs, hd in conflict_rows:
        print(f"  [{label}] {name}/{rel}   origem={hs}  destino={hd}")

with open("merge_conflicts.tsv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter="\t")
    w.writerow(["funcao", "categoria", "caminho_relativo", "origem", "destino", "sha256_origem", "sha256_destino"])
    for row in conflict_rows:
        w.writerow(row)

if APPLY:
    if n_move + n_dup == 0:
        print("\nNADA pra mover ou descartar -- abortando (nada a fazer, ou algo está errado).")
        log_f.close()
        sys.exit(1)
    if n_conflict > 150:
        print(f"\nAVISO: {n_conflict} conflitos é muito mais que o esperado (~39).")
        print("Abortando por segurança -- roda sem 'apply' e manda o resultado antes de tentar de novo.")
        log_f.close()
        sys.exit(1)

    ok_move = sum(1 for label, name, tipo, s, d in move_rows if do_move(s, d))
    ok_drop = sum(1 for label, name, rel, s, d in dup_rows if do_drop(s))

    remove_empty_dirs("sd_card_content/universal_ir/assets")
    remove_empty_dirs("sd_card_content/universal_rf")

    prov_path = "provenance_ir_rf_merge.csv"
    write_header = not os.path.exists(prov_path)
    with open(prov_path, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if write_header:
            w.writerow(["destino", "origem_original", "funcao", "categoria", "acao"])
        for label, name, tipo, s, d in move_rows:
            w.writerow([d, s, label, name, "moved"])
        for label, name, rel, s, d in dup_rows:
            w.writerow([d, s, label, name, "duplicate-dropped"])

    print(f"\nAplicado: {ok_move}/{n_move} movidos, {ok_drop}/{n_dup} duplicatas descartadas.")
    print(f"Log detalhado (todo git mv/git rm): {LOG_PATH}")
    print(f"Provenance desta operação: {prov_path}  (rascunho -- vai ser incorporado ao PROVENANCE.csv oficial na Fase 5)")
    print("\nPróximo passo: 'git status --short' e 'git diff --stat', depois commitar.")
else:
    print("Nada foi alterado (dry-run). Se os números acima fazem sentido, roda:")
    print("  python3 merge_ir_rf.py apply")

print("\nNÃO incluídos neste script (tratamento separado):")
print("  - sd_card_content/universal_ir/layouts.ini")
print("  - sd_card_content/badusb_ducky_scripts/ (3 arquivos)")

log_f.close()
