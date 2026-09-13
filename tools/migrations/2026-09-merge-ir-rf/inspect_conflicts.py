#!/usr/bin/env python3
"""
inspect_conflicts.py -- compara os arquivos .ir em conflito (mesmo caminho,
hash diferente) botão-por-botão dentro do próprio formato .ir do
Flipper/Bruce (blocos separados por "name:"), e sugere uma resolução por
arquivo em vez de exigir inspeção manual de cada um.

Lê merge_conflicts.tsv (gerado por merge_ir_rf.py). Não altera nenhum
arquivo -- só lê e classifica.

Uso: python3 inspect_conflicts.py
"""
import csv, re

VERDICT_ORDER = ["DEST_SUPERSET", "SRC_SUPERSET", "CONTEUDO_EQUIVALENTE", "DIVERGENTE", "ERRO"]

VERDICT_LEGEND = {
    "DEST_SUPERSET": "destino já tem tudo (e mais) -- origem pode ser descartada",
    "SRC_SUPERSET": "origem tem tudo do destino (e mais) -- dá pra substituir o destino",
    "CONTEUDO_EQUIVALENTE": "mesmos botões, mesmo dado -- hash bateu diferente por motivo cosmético (investigar)",
    "DIVERGENTE": "botões diferentes ou mesmo botão com dado diferente -- manter os dois, renomear um",
    "ERRO": "não consegui ler um dos dois arquivos",
}


def parse_ir_blocks(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except OSError as e:
        return None, str(e)
    blocks = []
    current = None
    for line in content.splitlines():
        m = re.match(r"^name:\s*(.*)$", line)
        if m:
            if current is not None:
                blocks.append(current)
            current = {"name": m.group(1).strip(), "lines": []}
        elif current is not None and line.strip() != "#":
            current["lines"].append(line.strip())
    if current is not None:
        blocks.append(current)
    return blocks, None


def analyze(src_path, dst_path):
    src_blocks, err1 = parse_ir_blocks(src_path)
    dst_blocks, err2 = parse_ir_blocks(dst_path)
    if err1 or err2:
        return {"verdict": "ERRO", "erro": err1 or err2}

    src_by_name, dst_by_name = {}, {}
    for b in src_blocks:
        src_by_name.setdefault(b["name"], []).append(b)
    for b in dst_blocks:
        dst_by_name.setdefault(b["name"], []).append(b)

    src_names, dst_names = set(src_by_name), set(dst_by_name)
    only_src = sorted(src_names - dst_names)
    only_dst = sorted(dst_names - src_names)
    shared = sorted(src_names & dst_names)

    diff_shared = []
    for n in shared:
        sb = sorted("\n".join(b["lines"]) for b in src_by_name[n])
        db = sorted("\n".join(b["lines"]) for b in dst_by_name[n])
        if sb != db:
            diff_shared.append(n)

    if not only_src and not diff_shared and only_dst:
        verdict = "DEST_SUPERSET"
    elif not only_dst and not diff_shared and only_src:
        verdict = "SRC_SUPERSET"
    elif not only_src and not only_dst and not diff_shared:
        verdict = "CONTEUDO_EQUIVALENTE"
    else:
        verdict = "DIVERGENTE"

    return {
        "verdict": verdict,
        "src_botoes": len(src_blocks), "dst_botoes": len(dst_blocks),
        "only_src": only_src, "only_dst": only_dst, "diff_shared": diff_shared,
    }


rows = []
with open("merge_conflicts.tsv", newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    for row in reader:
        rows.append(row)

results = [(row, analyze(row["origem"], row["destino"])) for row in rows]

by_verdict = {}
for row, a in results:
    by_verdict.setdefault(a["verdict"], []).append((row, a))

print(f"Total de conflitos analisados: {len(results)}\n")
for verdict in VERDICT_ORDER:
    items = by_verdict.get(verdict, [])
    if not items:
        continue
    print(f"=== {verdict} ({len(items)}) -- {VERDICT_LEGEND[verdict]} ===")
    for row, a in items:
        path = row["destino"]
        if verdict == "ERRO":
            print(f"  {path}  -- erro: {a.get('erro')}")
            continue
        print(f"  {path}  (origem {a['src_botoes']} botões, destino {a['dst_botoes']} botões)")
        if verdict == "DIVERGENTE":
            if a["only_src"]:
                print(f"      só na origem:  {', '.join(a['only_src'])}")
            if a["only_dst"]:
                print(f"      só no destino: {', '.join(a['only_dst'])}")
            if a["diff_shared"]:
                print(f"      mesmo nome, dado diferente: {', '.join(a['diff_shared'])}")
    print()

with open("conflict_analysis.tsv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter="\t")
    w.writerow(["destino", "origem", "veredito", "botoes_origem", "botoes_destino",
                "so_origem", "so_destino", "mesmo_nome_dado_diferente"])
    for row, a in results:
        if a["verdict"] == "ERRO":
            w.writerow([row["destino"], row["origem"], "ERRO", "", "", "", "", a.get("erro", "")])
        else:
            w.writerow([row["destino"], row["origem"], a["verdict"],
                        a["src_botoes"], a["dst_botoes"],
                        ";".join(a["only_src"]), ";".join(a["only_dst"]),
                        ";".join(a["diff_shared"])])

print("Escrito: conflict_analysis.tsv")
