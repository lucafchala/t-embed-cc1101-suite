#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
classify_badusb.py -- reorganiza sd_card_content/badusb_extra_payloads/ pra
taxonomia MITRE-ATT&CK-style (as mesmas 12 categorias que o BadUsb-Library
ja usa internamente), fundindo TODOS os 5 vendors numa arvore unica por
funcao -- sem "duas pastas pra mesma coisa" (o vendor vira so um nivel de
namespace dentro de cada categoria/plataforma/prontidao, nao um container
de topo separado).

Duas passadas:

  PASSO A -- reparenta BadUsb-Library/ (generico, sem precisar saber o
  nome exato de cada subpasta dele): pra cada arquivo dentro dele, move o
  nome do vendor de PREFIXO pra SUFIXO-antes-do-arquivo, preservando toda
  a profundidade de pasta que ja existia.
    badusb_extra_payloads/BadUsb-Library/<cat>/<plat>/<ready>/x.txt
    -> badusb_extra_payloads/<cat>/<plat>/<ready>/BadUsb-Library/x.txt

  PASSO B -- classifica por keyword (lidas de taxonomy.yaml) os outros 4
  vendors (Bruce-Scripts-Heaven_BAD, I-Am-Jakoby_BadUSB, magikh0e_BadUSB,
  UberGuidoZ_BadUSB), que NAO vem pre-organizados:
    badusb_extra_payloads/<vendor>/<relpath original>
    -> badusb_extra_payloads/<categoria>/<plataforma>/<prontidao>/<vendor>/<relpath original>
  Arquivo que nao bate em NENHUMA keyword de categoria vai pra
  badusb_extra_payloads/_unclassified/<vendor>/<relpath> -- nunca e forcado
  numa categoria errada.

Uso:
  python3 classify_badusb.py                 # dry-run: relatorio compacto (nao mexe em nada)
  python3 classify_badusb.py apply            # aplica de verdade + provenance_badusb.csv
  python3 classify_badusb.py sample N         # dry-run, mas mostra ate N nomes de arquivo
                                               # nao-classificados por categoria (default 40)
"""
import sys
import os
import re
import shutil
import csv

try:
    import yaml
except ImportError:
    import subprocess
    print("pyyaml nao encontrado, instalando...")
    subprocess.run([sys.executable, "-m", "pip", "install", "--break-system-packages", "pyyaml"], check=True)
    import yaml

MODE = sys.argv[1] if len(sys.argv) > 1 else "dryrun"
APPLY = MODE == "apply"
SAMPLE_N = 40
if MODE == "sample" and len(sys.argv) > 2:
    SAMPLE_N = int(sys.argv[2])

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TAXONOMY_PATH = os.environ.get("TAXONOMY_PATH", os.path.join(SCRIPT_DIR, "taxonomy.yaml"))
REPO_ROOT = os.environ.get("REPO_ROOT", os.getcwd())
BADUSB_ROOT = os.path.join(REPO_ROOT, "sd_card_content", "badusb_extra_payloads")
PROVENANCE_CSV = os.path.join(REPO_ROOT, "provenance_badusb.csv")

LIBRARY_VENDOR = "BadUsb-Library"
OTHER_VENDORS = ["Bruce-Scripts-Heaven_BAD", "I-Am-Jakoby_BadUSB", "magikh0e_BadUSB", "UberGuidoZ_BadUSB"]

MAX_CONTENT_READ_BYTES = 2 * 1024 * 1024  # nao le arquivo maior que 2MB pra checar prontidao


def load_taxonomy():
    with open(TAXONOMY_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)


def walk_files(root):
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            ap = os.path.join(dirpath, fn)
            yield ap, os.path.relpath(ap, root)


_CAMEL_BOUNDARY_RE = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")
_SEP_RUN_RE = re.compile(r"[\s\-_.]+")


def _canon_sep(s):
    """Colapsa qualquer sequencia de espaco/hifen/underscore/ponto num
    unico underscore. Sem isso, uma keyword escrita com underscore (ex.:
    'fake_update') nunca bate em nomes reais que usam espaco ou hifen no
    lugar (ex.: 'IPHONE Fake Update.txt', 'Kiosk-Evasion-Bruteforce.txt')
    -- o match falhava de cara, antes mesmo de qualquer checagem de
    borda."""
    return _SEP_RUN_RE.sub("_", s)


def normalize_for_match(s):
    """Variante 'camel-split': insere separador nas transicoes
    minuscula->maiuscula (pra CamelCase sem separador, ex.
    'ProcessTerminator' -> 'process_terminator') e entao canonicaliza
    todos os separadores. Use junto com normalize_plain (ver
    build_variants) -- uma pega CamelCase de duas palavras coladas, a
    outra preserva nomes-de-marca em CamelCase que sao UMA palavra so
    (ex. 'RickRoll' nao deve virar 'rick_roll')."""
    return _canon_sep(_CAMEL_BOUNDARY_RE.sub("_", s)).lower()


def normalize_plain(s):
    """Variante 'plain': so canonicaliza separadores existentes, sem
    tentar adivinhar limite de palavra dentro de CamelCase. Preserva
    nomes de marca tipo 'RickRoll' como uma palavra so (fica 'rickroll',
    que e como a keyword 'rickroll' esta escrita no taxonomy.yaml)."""
    return _canon_sep(s).lower()


def build_variants(s):
    """As duas normalizacoes acima, pra testar contra as duas -- ver
    normalize_for_match/normalize_plain pra motivo de cada uma."""
    return (normalize_plain(s), normalize_for_match(s))


def kw_in(haystack_lower, kw):
    """Confere se kw aparece em haystack_lower respeitando borda de palavra
    nos lados onde a propria keyword NAO ja tem um caractere separador
    (ex.: "_rat" ja garante a borda esquerda por causa do "_" embutido,
    entao so exige borda de verdade do lado direito). Sem isso, keywords
    curtas e genericas tipo "ios" davam falso positivo (ex.: "Kiosk"
    contem "ios" no meio -- classificava plataforma errado). "Borda" aqui
    e qualquer caractere nao-alfanumerico (_, -, ., /, espaco, etc.), com
    DUAS excecoes: um "s" de plural logo apos o match (ex. "saved_password"
    batendo em "saved_passwords") ou um sufixo numerico colado (ex.
    "disableDefender2", "...Win7") tambem contam como borda valida, desde
    que o que vier depois seja fim-de-string ou uma borda de verdade."""
    kwl = _canon_sep(kw).lower()
    n = len(kwl)
    check_left = kwl[0].isalnum()
    check_right = kwl[-1].isalnum()
    start = 0
    while True:
        idx = haystack_lower.find(kwl, start)
        if idx == -1:
            return False
        left_ok = (not check_left) or idx == 0 or not haystack_lower[idx - 1].isalnum()
        right_idx = idx + n
        if not check_right or right_idx >= len(haystack_lower):
            right_ok = True
        elif not haystack_lower[right_idx].isalnum():
            right_ok = True
        elif haystack_lower[right_idx] == "s" and (
            right_idx + 1 >= len(haystack_lower) or not haystack_lower[right_idx + 1].isalnum()
        ):
            right_ok = True  # plural simples (ex.: "...password" + "s")
        elif haystack_lower[right_idx].isdigit():
            # sufixo de versao/numero colado (ex.: "disableDefender2",
            # "...Win7") -- descoberto no dry-run real da 4a rodada:
            # "disableDefender2" nao batia em "disable_defender" porque o
            # "2" colado quebrava a borda direita. Aceita como borda valida
            # so se, depois de consumir TODOS os digitos colados, o que
            # sobra e fim-de-string ou um separador de verdade -- assim
            # "util2fa" (letra logo apos os digitos) continua nao batendo.
            j = right_idx
            while j < len(haystack_lower) and haystack_lower[j].isdigit():
                j += 1
            right_ok = j >= len(haystack_lower) or not haystack_lower[j].isalnum()
        else:
            right_ok = False
        if left_ok and right_ok:
            return True
        start = idx + 1


def kw_in_any(variants, kw):
    return any(kw_in(v, kw) for v in variants)


def classify_category(variants, categories):
    for cat in categories:
        for kw in cat["keywords"]:
            if kw_in_any(variants, kw):
                return cat["name"]
    return "_unclassified"


def classify_category_detailed(rel_variants, content_variants, categories):
    """Tenta classificar so pelo nome/caminho primeiro (mais barato, mais
    confiavel); se nao bater nada, tenta de novo incluindo o CONTEUDO do
    arquivo -- muitos payloads Ducky Script tem comentario REM descrevendo
    a funcao real mesmo quando o nome do arquivo e so um apelido/marca
    (ex.: 'Honk.txt', 'Party_Parrot_Win.txt', 'PingMe.txt'). Retorna
    (categoria, fonte) onde fonte e 'name', 'content' ou None (sem match em
    nenhum dos dois -- vai pra _unclassified de verdade)."""
    cat = classify_category(rel_variants, categories)
    if cat != "_unclassified":
        return cat, "name"
    if any(content_variants):
        cat = classify_category(content_variants, categories)
        if cat != "_unclassified":
            return cat, "content"
    return "_unclassified", None


def classify_platform(variants, platforms):
    for plat in platforms:
        if not plat["keywords"]:
            return plat["name"]  # fallback (Win) -- lista de keywords vazia
        for kw in plat["keywords"]:
            if kw_in_any(variants, kw):
                return plat["name"]
    return platforms[-1]["name"] if platforms else "Win"


def read_head(abs_path, max_bytes):
    """Le ate max_bytes do arquivo como texto, se der. Devolve None se o
    arquivo for grande demais (provavelmente binario/asset, nao um
    script-texto) ou nao puder ser lido -- nesses casos quem chama cai de
    volta pra classificacao so por nome e prontidao default."""
    try:
        if os.path.getsize(abs_path) > max_bytes:
            return None
        with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read(max_bytes)
    except OSError:
        return None


def classify_readiness_from_content(content, markers):
    if content is None:
        return "directly_ready"  # arquivo grande/binario -- nao e placeholder de script
    if markers["needs_extension"] in content:
        return "configuration_needed"
    if markers["needs_stringln_collapse"] in content:
        return "configuration_needed"
    return "directly_ready"


def plan_pass_a():
    """reparenta BadUsb-Library/ -- generico, sem hardcode de subpastas"""
    plan = []
    lib_root = os.path.join(BADUSB_ROOT, LIBRARY_VENDOR)
    if not os.path.isdir(lib_root):
        return plan, [f"vendor nao encontrado: sd_card_content/badusb_extra_payloads/{LIBRARY_VENDOR}"]
    for ap, rel in walk_files(lib_root):
        dirpart, filename = os.path.split(rel)
        if dirpart:
            target_rel = os.path.join(dirpart, LIBRARY_VENDOR, filename)
        else:
            target_rel = os.path.join(LIBRARY_VENDOR, filename)
        # a categoria e sempre o primeiro segmento do path original dentro
        # do vendor (BadUsb-Library ja vem pre-organizado assim)
        category = rel.split(os.sep)[0] if os.sep in rel else "_root"
        plan.append({"src_abs": ap, "target_rel": target_rel, "vendor": LIBRARY_VENDOR, "category": category})
    return plan, []


def plan_pass_b(taxonomy):
    categories = taxonomy["badusb_categories"]
    platforms = taxonomy["badusb_platforms"]
    markers = taxonomy["badusb_readiness_markers"]

    plan = []
    problems = []
    stats = {}  # vendor -> {"category": Counter-like dict, "platform": {...}, "readiness": {...}}
    unclassified_samples = []

    for vendor in OTHER_VENDORS:
        vroot = os.path.join(BADUSB_ROOT, vendor)
        if not os.path.isdir(vroot):
            problems.append(f"vendor nao encontrado: sd_card_content/badusb_extra_payloads/{vendor}")
            continue
        vstats = {"category": {}, "platform": {}, "readiness": {}, "match_source": {}}
        for ap, rel in walk_files(vroot):
            rel_variants = build_variants(rel)
            # le o conteudo UMA vez -- reaproveitado tanto pra classificar
            # categoria/plataforma (via texto, ex. comentario REM) quanto
            # pra checar prontidao (markers EXTENSION/STRINGLN), sem abrir
            # o arquivo duas vezes.
            content = read_head(ap, MAX_CONTENT_READ_BYTES)
            content_variants = build_variants(content) if content is not None else ("", "")

            category, match_source = classify_category_detailed(rel_variants, content_variants, categories)
            vstats["category"][category] = vstats["category"].get(category, 0) + 1
            if match_source:
                vstats["match_source"][match_source] = vstats["match_source"].get(match_source, 0) + 1

            if category == "_unclassified":
                target_rel = os.path.join("_unclassified", vendor, rel)
                if len(unclassified_samples) < SAMPLE_N:
                    unclassified_samples.append(f"{vendor}/{rel}")
                plan.append({"src_abs": ap, "target_rel": target_rel, "vendor": vendor, "category": category})
                continue

            combined_variants = tuple(
                rv + "\n" + cv for rv, cv in zip(rel_variants, content_variants)
            )
            platform = classify_platform(combined_variants, platforms)
            readiness = classify_readiness_from_content(content, markers)
            vstats["platform"][platform] = vstats["platform"].get(platform, 0) + 1
            vstats["readiness"][readiness] = vstats["readiness"].get(readiness, 0) + 1

            target_rel = os.path.join(category, platform, readiness, vendor, rel)
            plan.append({
                "src_abs": ap, "target_rel": target_rel, "vendor": vendor,
                "category": category, "platform": platform, "readiness": readiness,
            })
        stats[vendor] = vstats

    return plan, problems, stats, unclassified_samples


def print_report(plan_a, plan_b, stats, unclassified_samples):
    print(f"=== Passo A: reparentar {LIBRARY_VENDOR}/ ===")
    print(f"  {len(plan_a)} arquivos serao movidos (mesma estrutura interna, so o vendor vira sufixo)")
    print()
    print("=== Passo B: classificar os outros 4 vendors ===")
    total_unclassified = 0
    for vendor, vstats in stats.items():
        total = sum(vstats["category"].values())
        n_unclassified = vstats["category"].get("_unclassified", 0)
        total_unclassified += n_unclassified
        print(f"  {vendor}: {total} arquivos")
        for cat, n in sorted(vstats["category"].items(), key=lambda kv: -kv[1]):
            marker = "  <-- SEM MATCH, vai pra _unclassified/" if cat == "_unclassified" else ""
            print(f"    {cat}: {n}{marker}")
        ms = vstats.get("match_source", {})
        if ms:
            print(f"    (classificado via nome: {ms.get('name', 0)}, via conteudo do arquivo: {ms.get('content', 0)})")
    print()
    print(f"Total nao-classificado (sem keyword de categoria bateu): {total_unclassified}")
    if unclassified_samples:
        print(f"Amostra de ate {SAMPLE_N} arquivos sem match (pra ajustar taxonomy.yaml):")
        for s in unclassified_samples:
            print(f"  {s}")
    print()
    print("Se a taxa de '_unclassified' estiver alta, edite badusb_categories em")
    print("taxonomy.yaml (adicione keywords) e rode de novo -- nao precisa mexer no script.")


def execute(plan, provenance_rows):
    for entry in plan:
        target_abs = os.path.join(BADUSB_ROOT, entry["target_rel"])
        if APPLY:
            os.makedirs(os.path.dirname(target_abs), exist_ok=True)
            shutil.move(entry["src_abs"], target_abs)
        provenance_rows.append({
            "new_path": f"sd_card_content/badusb_extra_payloads/{entry['target_rel']}",
            "function": "badusb", "bucket": entry.get("category", ""),
            "original_vendor_folder": entry["vendor"],
            "merge_type": "reparented" if entry["vendor"] == LIBRARY_VENDOR else (
                "classified-unmatched" if entry.get("category") == "_unclassified" else "classified"
            ),
        })


def sweep_empty_dirs(root):
    removed = []
    for dirpath, _dirnames, _filenames in os.walk(root, topdown=False):
        if dirpath == root:
            continue
        if not os.listdir(dirpath):
            os.rmdir(dirpath)
            removed.append(os.path.relpath(dirpath, root))
    return removed


def main():
    taxonomy = load_taxonomy()

    plan_a, problems_a = plan_pass_a()
    plan_b, problems_b, stats, unclassified_samples = plan_pass_b(taxonomy)

    problems = problems_a + problems_b
    if problems:
        print("ABORTADO -- problemas encontrados antes de qualquer alteracao:")
        for p in problems:
            print(f"  - {p}")
        sys.exit(1)

    print_report(plan_a, plan_b, stats, unclassified_samples)

    if not APPLY:
        print()
        print("Dry-run -- nada foi alterado. Rode 'python3 classify_badusb.py apply' pra executar,")
        print("ou 'python3 classify_badusb.py sample 100' pra ver mais nomes sem match.")
        return

    provenance_rows = []
    execute(plan_a, provenance_rows)
    execute(plan_b, provenance_rows)

    swept = sweep_empty_dirs(BADUSB_ROOT)
    if swept:
        print()
        print(f"Varredura final removeu {len(swept)} diretorio(s) vazio(s) que sobraram:")
        for rel in swept:
            print(f"  {rel}")

    with open(PROVENANCE_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["new_path", "function", "bucket", "original_vendor_folder", "merge_type"])
        w.writeheader()
        w.writerows(provenance_rows)

    print()
    print(f"Aplicado. Provenance de {len(provenance_rows)} entradas escrito em {PROVENANCE_CSV}")
    print("Rode 'git add -A' e revise 'git status' antes de commitar.")


if __name__ == "__main__":
    main()
