#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_credits.py -- gera CREDITS.md a partir de PROVENANCE.csv. NUNCA edite
CREDITS.md a mao -- rode este script de novo depois de qualquer mudanca em
PROVENANCE.csv (novo merge, nova reclassificacao, etc.).

Escopo: PROVENANCE.csv so cobre o conteudo que passou pelos scripts de
reorganizacao desta rodada (classify_nfc.py, classify_badusb.py,
merge_ir_rf.py) -- ou seja, ir/, rf/, nfc/ e badusb_extra_payloads/. Pastas
como themes/, wifi_portals/, interpreter_js_apps/ etc. NAO estao aqui --
a tabela completa, pasta-por-pasta, pra TODO o conteudo do repositorio
(incluindo essas) e a "Proveniencia detalhada por pasta" em
CONTRIBUTING.md, que continua sendo a fonte de verdade principal. Este
CREDITS.md e um complemento: um rollup por fonte+contagem de arquivo que
continua correto mesmo depois que badusb/nfc deixaram de ter pasta de
vendor no top-level (a licenca/URL por fonte nao muda so porque o arquivo
mudou de pasta).

VENDOR_SOURCES abaixo foi copiado da tabela ja verificada em
CONTRIBUTING.md ("Proveniencia detalhada por pasta") -- nunca adicione uma
URL aqui que nao esteja tambem documentada la. Varios vendor_key
diferentes podem apontar pro MESMO repositorio de origem (ex.:
UberGuidoZ_BadUSB, UberGuidoZ_Fun_Files, UberGuidoZ_Amiibo_Tools sao todos
UberGuidoZ/Flipper) -- a agregacao abaixo agrupa por FONTE real
(nome+URL+licenca), nao por vendor_key, senao a mesma fonte aparece
repetida em varias linhas.

Uso:
  python3 gen_credits.py
"""
import csv
import os
from collections import defaultdict

REPO_ROOT = os.environ.get("REPO_ROOT", os.getcwd())
PROVENANCE_CSV = os.path.join(REPO_ROOT, "PROVENANCE.csv")
OUT = os.path.join(REPO_ROOT, "CREDITS.md")

# vendor_key -> (nome de exibicao, URL, licenca) -- copiado de
# CONTRIBUTING.md, nao inventado aqui.
VENDOR_SOURCES = {
    '_Converted_': ('https://github.com/Lucaslhm/Flipper-IRDB', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/ir/#/_Converted_)'),
    'LED_Lighting': ('https://github.com/danielweidman/pixmob-ir-reverse-engineering', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/ir/L/LED_Lighting)'),
    'Skylanders_LEGO_Toys': ('https://github.com/sealldeveloper/FlipperSkylanders', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/nfc/Skylanders_LEGO_Toys)'),
    'Concert_bracelet': ('https://github.com/MakeTotalSense/Flipper-Concert-bracelets', 'MIT', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/C/Concert_bracelet)'),
    'Customer_Assistance_Buttons': ('https://github.com/DRA6N/SubGhz_Cust_Serv', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/C/Customer_Assistance_Buttons)'),
    'DEFCON32_Bracelet_FREE-WILi': ('https://github.com/freewili/bracelet_subfiles', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/D/DEFCON32_Bracelet_FREE-WILi)'),
    'Doorbells': ('https://github.com/UberGuidoZ/Flipper', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/D/Doorbells)'),
    'Garages': ('https://github.com/jimilinuxguy/flipperzero-deBruijn', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/G/Garages)'),
    'Gas_Sign': ('https://github.com/UberGuidoZ/Flipper', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/G/Gas_Sign)'),
    'Gates': ('https://github.com/UberGuidoZ/Flipper', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/G/Gates)'),
    'LED': ('https://github.com/user-attachments/assets', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/L/LED)'),
    'Misc': ('https://github.com/UberGuidoZ/Flipper', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/M/Misc)'),
    'Projection_Screens': ('https://github.com/UberGuidoZ/Flipper', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/P/Projection_Screens)'),
    'Restaurant_Pagers': ('https://github.com/Eng1n33r/flipperzero-firmware', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/R/Restaurant_Pagers)'),
    'Sleep_Files': ('https://github.com/UberGuidoZ/Flipper', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/S/Sleep_Files)'),
    'Smoke_Alarm': ('https://github.com/tofurky/kidde_cc1101', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/S/Smoke_Alarm)'),
    'TouchTunes': ('https://github.com/jimilinuxguy/flipperzero-touchtunes', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/T/TouchTunes)'),
    'Vehicles': ('https://github.com/UberGuidoZ/Flipper', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/rf/V/Vehicles)'),
    'Bruce-Themes_community': ('https://github.com/anonimoKali/Bruce-Themes', 'CC0-1.0', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/themes/Bruce-Themes_community)'),
    'koua29_community': ('https://github.com/koua29/bruce-hud-themes', 'Unknown', 'Auto-detected via README/LICENSE reference during full credit audit (sd_card_content/themes/koua29_community)'),
    'BruceIRF': ('https://github.com/bollgio/BruceIRF', 'AGPL-3.0', "ESP32 Bruce fork adding UniversalIR/UniversalRF modules; source of this repo's 'Universal*' IR leftover folders"),
    "Bruce-Scripts-Heaven_RFID": ("sloth632/Bruce-Scripts-Heaven", "https://github.com/sloth632/Bruce-Scripts-Heaven", "Ver repositório"),
    "Bruce-Scripts-Heaven_BAD": ("sloth632/Bruce-Scripts-Heaven", "https://github.com/sloth632/Bruce-Scripts-Heaven", "Ver repositório"),
    "universal_rf": ("BruceDevices/firmware", "https://github.com/BruceDevices/firmware", "AGPL-3.0"),
    "universal_ir": ("BruceDevices/firmware", "https://github.com/BruceDevices/firmware", "AGPL-3.0"),
    "AmiiboDB": ("AmiiboDB/Amiibo", "https://github.com/AmiiboDB/Amiibo", "Ver repositório"),
    "UberGuidoZ_Amiibo_Tools": ("UberGuidoZ/Flipper", "https://github.com/UberGuidoZ/Flipper", "Ver repositório"),
    "Tonies_NFC": ("nortakales/flipper-zero-tonies", "https://github.com/nortakales/flipper-zero-tonies", "Ver repositório"),
    "UberGuidoZ_BadUSB": ("UberGuidoZ/Flipper", "https://github.com/UberGuidoZ/Flipper", "Ver repositório"),
    "BadUsb-Library": ("Starvinci/BadUsb-Library", "https://github.com/Starvinci/BadUsb-Library", "Ver repositório"),
    "I-Am-Jakoby_BadUSB": ("I-Am-Jakoby/Flipper-Zero-BadUSB", "https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB", "Ver repositório"),
    "UberGuidoZ_Fun_Files": ("UberGuidoZ/Flipper", "https://github.com/UberGuidoZ/Flipper", "Ver repositório"),
    "magikh0e_BadUSB": ("magikh0e/FlipperZero_Stuff", "https://github.com/magikh0e/FlipperZero_Stuff", "Ver repositório"),
    "UberGuidoZ_Mifare_Classic_Dict": ("UberGuidoZ/Flipper", "https://github.com/UberGuidoZ/Flipper", "Ver repositório"),
    "UberGuidoZ_H10301_RFID_Bruteforce": ("UberGuidoZ/Flipper", "https://github.com/UberGuidoZ/Flipper", "Ver repositório"),
}


def vendor_of(ovf):
    parts = ovf.split("/")
    if parts and parts[0] == "sd_card_content" and len(parts) > 1:
        return parts[1]  # linhas de ir/rf guardam o path original inteiro
    return parts[0] if parts else ovf


def main():
    rows = list(csv.DictReader(open(PROVENANCE_CSV, encoding="utf-8")))

    vendor_counts = defaultdict(lambda: defaultdict(int))  # vendor_key -> function -> count
    for r in rows:
        vendor = vendor_of(r["original_vendor_folder"])
        vendor_counts[vendor][r["function"]] += 1

    # agrupa por FONTE real (nome, URL, licenca), nao por vendor_key --
    # varios vendor_keys podem apontar pro mesmo repositorio de origem.
    source_counts = defaultdict(lambda: defaultdict(int))
    unknown_counts = defaultdict(lambda: defaultdict(int))

    for vendor, func_counts in vendor_counts.items():
        if vendor in VENDOR_SOURCES:
            key = VENDOR_SOURCES[vendor]
            for func, n in func_counts.items():
                source_counts[key][func] += n
        else:
            for func, n in func_counts.items():
                unknown_counts[vendor][func] += n

    lines = []
    lines.append("# CREDITS.md\n")
    lines.append(
        "**Gerado automaticamente por `tools/gen_credits.py` a partir de "
        "`PROVENANCE.csv` -- nao edite este arquivo a mao.** Rode "
        "`python3 tools/gen_credits.py` de novo depois de qualquer mudanca "
        "em PROVENANCE.csv.\n"
    )
    lines.append(
        "Escopo: cobre so o conteudo que passou pelos scripts de "
        "reorganizacao (`ir/`, `rf/`, `nfc/`, `badusb_extra_payloads/`). "
        "Para a tabela completa pasta-por-pasta de TODO o repositorio "
        "(incluindo `themes/`, `wifi_portals/`, `interpreter_js_apps/` "
        "etc.), veja [CONTRIBUTING.md](CONTRIBUTING.md#proveniencia-detalhada-por-pasta) "
        "-- essa continua sendo a fonte de verdade principal; este arquivo "
        "e um complemento (rollup por fonte+contagem que continua correto "
        "mesmo com badusb/nfc reorganizados por funcao em vez de por "
        "vendor).\n"
    )
    lines.append("| Fonte | Licença | Arquivos | Funções |")
    lines.append("|---|---|---|---|")

    def total_of(d):
        return sum(d.values())

    ordered_sources = sorted(source_counts.keys(), key=lambda k: -total_of(source_counts[k]))
    for name, url, license_ in ordered_sources:
        fc = source_counts[(name, url, license_)]
        funcs = ", ".join(f"{f} ({n})" for f, n in sorted(fc.items(), key=lambda kv: -kv[1]))
        lines.append(f"| [{name}]({url}) | {license_} | {total_of(fc)} | {funcs} |")

    if unknown_counts:
        lines.append("")
        lines.append("### Fontes sem URL confirmada em CONTRIBUTING.md\n")
        lines.append(
            "(presentes em PROVENANCE.csv mas ainda sem entrada em "
            "`VENDOR_SOURCES` -- confira CONTRIBUTING.md e adicione lá "
            "primeiro, depois aqui.)\n"
        )
        lines.append("| Pasta original | Arquivos | Funções |")
        lines.append("|---|---|---|")
        for vendor in sorted(unknown_counts.keys(), key=lambda v: -total_of(unknown_counts[v])):
            fc = unknown_counts[vendor]
            funcs = ", ".join(f"{f} ({n})" for f, n in sorted(fc.items(), key=lambda kv: -kv[1]))
            lines.append(f"| `{vendor}` | {total_of(fc)} | {funcs} |")

    lines.append("")
    lines.append(f"**Total de arquivos rastreados em PROVENANCE.csv: {len(rows)}**")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"CREDITS.md gerado ({len(rows)} linhas de PROVENANCE.csv, {len(source_counts)} fontes distintas, {len(unknown_counts)} vendor(s) sem URL confirmada)")


if __name__ == "__main__":
    main()
