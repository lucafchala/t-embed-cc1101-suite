#!/usr/bin/env python3
"""
resolve_conflicts.py -- aplica a decisão final pros 39 conflitos reais de
IR, com base em conflict_analysis.tsv (gerado por inspect_conflicts.py).

Regra (a mesma lógica usada pra classificar os 39 desta rodada manualmente,
agora automatizada porque o padrão é sistemático e se repete):

  - DEST_SUPERSET / CONTEUDO_EQUIVALENTE (arquivo .ir)
      -> destino já cobre tudo (igual ou mais) -- descarta a origem.

  - DIVERGENTE, mas SEM dado diferente em botão compartilhado E com o
    MESMO NÚMERO TOTAL de botões dos dois lados
      -> é só diferença de rotulagem (Off/POWER_OFF, CH+/Ch_next, etc. --
         um padrão que se repete em vários arquivos, não coincidência) --
         cobertura funcional é idêntica, descarta a origem e fica a
         convenção de nome que já é dominante no ir_extra_dbs.

  - DIVERGENTE com dado realmente diferente em botão compartilhado, OU
    contagem de botões diferente (remoto genuinamente diferente ou
    parcial, ex.: BenQ.ir com vocabulário de botão totalmente distinto)
      -> mantém os DOIS: destino como está, origem entra com sufixo
         "_alt" no nome. Nunca sobrescreve, nunca descarta dado único.

  - Qualquer conflito que não seja um arquivo .ir (a heurística de botão
    não se aplica -- ex.: um ReadMe.md que colidiu)
      -> não decide sozinho: só mostra um diff e espera revisão manual.

Uso:
  python3 resolve_conflicts.py            # dry-run: só mostra o plano
  python3 resolve_conflicts.py apply      # executa (git rm / git mv)
"""
import csv, os, sys, subprocess

ROOT = os.path.abspath(".")
APPLY = len(sys.argv) > 1 and sys.argv[1] == "apply"

drop_rows, keep_both_rows, review_rows = [], [], []

with open("conflict_analysis.tsv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    all_rows = list(reader)

for row in all_rows:
    v = row["veredito"]
    is_ir = row["origem"].lower().endswith(".ir")

    if v in ("DEST_SUPERSET", "CONTEUDO_EQUIVALENTE"):
        (drop_rows if is_ir else review_rows).append(row)
    elif v == "DIVERGENTE":
        same_count = row["botoes_origem"] == row["botoes_destino"]
        no_data_diff = not row["mesmo_nome_dado_diferente"].strip()
        if not is_ir:
            review_rows.append(row)
        elif same_count and no_data_diff:
            drop_rows.append(row)
        else:
            keep_both_rows.append(row)
    else:
        review_rows.append(row)

print(f"{'APLICANDO' if APPLY else 'DRY-RUN (nada muda ainda)'}\n")
print(f"Total de conflitos lidos: {len(all_rows)} "
      f"(descartar={len(drop_rows)}, manter-os-dois={len(keep_both_rows)}, revisar-manual={len(review_rows)})\n")

print(f"=== Descartar origem ({len(drop_rows)}) -- destino já cobre tudo, igual ou por rótulo ===")
for row in drop_rows:
    print(f"  [{row['veredito']:22s}] {row['origem']}")

print(f"\n=== Manter os dois ({len(keep_both_rows)}) -- dado genuinamente diferente, origem vira _alt ===")
for row in keep_both_rows:
    print(f"  [{row['veredito']:22s}] {row['origem']}")
    if row["so_origem"] or row["so_destino"]:
        print(f"      só origem: {row['so_origem']}  |  só destino: {row['so_destino']}")
    if row["mesmo_nome_dado_diferente"]:
        print(f"      dado diferente em: {row['mesmo_nome_dado_diferente']}")

if review_rows:
    print(f"\n=== Precisa de revisão manual ({len(review_rows)}) -- não é .ir, heurística de botão não se aplica ===")
    for row in review_rows:
        print(f"  {row['origem']}  vs  {row['destino']}")
        r = subprocess.run(["diff", "-u", row["origem"], row["destino"]], capture_output=True, text=True)
        out = r.stdout.strip()
        print(out[:2000] if out else "  (diff vazio -- conteúdo textual idêntico, só o hash bateu diferente por algum motivo binário)")
    print("\n  Nenhuma ação automática nesses -- decido depois de ver o diff acima.")

if APPLY:
    ok_drop = 0
    for row in drop_rows:
        r = subprocess.run(["git", "rm", "--quiet", row["origem"]], cwd=ROOT, capture_output=True, text=True)
        if r.returncode == 0:
            ok_drop += 1
        else:
            print(f"FALHOU git rm {row['origem']}: {r.stderr.strip()}")

    ok_keep = 0
    prov_rows = []
    for row in keep_both_rows:
        origem = row["origem"]
        base, ext = os.path.splitext(row["destino"])
        novo_destino = f"{base}_alt{ext}"
        n = 1
        while os.path.exists(novo_destino):
            n += 1
            novo_destino = f"{base}_alt{n}{ext}"
        os.makedirs(os.path.dirname(novo_destino), exist_ok=True)
        r = subprocess.run(["git", "mv", origem, novo_destino], cwd=ROOT, capture_output=True, text=True)
        if r.returncode == 0:
            ok_keep += 1
            prov_rows.append((novo_destino, origem))
            print(f"  renomeado: {origem} -> {novo_destino}")
        else:
            print(f"FALHOU git mv {origem} -> {novo_destino}: {r.stderr.strip()}")

    def remove_empty_dirs(base):
        if not os.path.isdir(base):
            return
        for dirpath, _, _ in os.walk(base, topdown=False):
            try:
                os.rmdir(dirpath)
                print(f"pasta vazia removida: {dirpath}")
            except OSError:
                pass

    remove_empty_dirs("sd_card_content/universal_ir/assets")
    remove_empty_dirs("sd_card_content/universal_rf")

    prov_path = "provenance_ir_rf_merge.csv"
    write_header = not os.path.exists(prov_path)
    with open(prov_path, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if write_header:
            w.writerow(["destino", "origem_original", "funcao", "categoria", "acao"])
        for d, s in prov_rows:
            w.writerow([d, s, "ir", "conflito-resolvido", "kept-both-renamed-alt"])

    print(f"\nDescartados: {ok_drop}/{len(drop_rows)}")
    print(f"Mantidos (renomeados _alt): {ok_keep}/{len(keep_both_rows)}")
    print("\nPróximo passo: 'git status --short' e 'git diff --cached --stat', depois commitar.")
else:
    print("\nSe a divisão acima faz sentido, roda:")
    print("  python3 resolve_conflicts.py apply")
