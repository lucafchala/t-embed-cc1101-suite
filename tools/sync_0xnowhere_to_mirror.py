#!/usr/bin/env python3
"""
Sincroniza o conteudo novo do 0xN0WHERE de sd_card_content/ para
sd_card_mirror/, seguindo os precedentes JA estabelecidos no repo:

- Evil Portal: sd_card_mirror/PortalTemplates/!repo/fake_login_borys/ (mirror
  fisico real, commit 49d4796a1) prova que o Bruce usa .html FLAT (sem
  subpasta aninhada), nome = nome do portal, e a tag <!-- AP="..." --> e
  OPCIONAL (o firmware pergunta manualmente se ausente). O 0xN0WHERE guarda
  o nome da AP separado em ap.config.txt -- em vez de descartar esse dado
  (violaria "nada que funcione sai do repo"), ele e dobrado pra dentro da
  tag AP na primeira linha do .html final, e a estrutura de pastas e
  achatada pra dentro do NOME do arquivo (" - " como separador), pra manter
  os arquivos navegaveis/legiveis no device sem inventar uma convencao nova.

- BadUSB: sd_card_mirror/badusb/!repo/works_both/BadUsb-Library/ prova que
  uma pasta de vendor inteira pode manter sua PROPRIA estrutura interna em
  vez de ser espalhada nos buckets MITRE -- e exatamente o precedente usado
  pra escolher merge_type=reparented no PROVENANCE.csv desta mesma leva. Os
  9 payloads do 0xN0WHERE ja foram confirmados nesta sessao como DuckyScript
  universal (sem ID/spoof de VID:PID), entao vao pra works_both/, nao
  flipper_only/.

Pareamento ap.config.txt <-> .html numa mesma pasta (ordem de prioridade):
  1) se existir "index.html" (case-insensitive), pareia com ele;
  2) senao, se existir EXATAMENTE um .html na pasta, pareia com ele (casos
     reais confirmados: WiFi Routers/NETGEAR/netgear.html,
     WiFi Routers/TP-Link/tplink.html -- o vendor as vezes nomeia o html
     como a propria marca em vez de "index.html");
  3) se nao existir nenhum .html -> ap.config.txt orfao, aborta (nunca
     adivinha onde a tag AP deveria ir);
  4) se existir mais de um .html e nenhum for "index.html" -> ambiguo,
     aborta (nunca adivinha qual dos dois recebe a tag AP).
Qualquer outro .html na mesma pasta que nao seja o escolhido pro pareamento
(ex.: Starbucks Coffee/index.html E starb.html no mesmo dir) e copiado como
arquivo solto, sem tag, com o nome do arquivo original preservado no rotulo
achatado pra nao colidir com o par.

So LEITURA em sd_card_content/ -- nunca escreve la. Escreve so em
sd_card_mirror/. Gera um manifest CSV com o mapeamento completo.
"""
import csv
import shutil
import sys
from pathlib import Path


def convert_wifi_portals(src_root: Path, dst_root: Path, manifest_rows: list):
    """
    src_root: .../sd_card_content/wifi_portals/!repo/0xNOWHERE_BRUCE-FILES
    dst_root: .../sd_card_mirror/PortalTemplates/!repo/0xNOWHERE_BRUCE-FILES
    """
    if dst_root.exists() and any(dst_root.iterdir()):
        raise SystemExit(f"Destino ja existe e nao esta vazio, abortando pra nao misturar/sobrescrever "
                          f"silenciosamente numa re-execucao: {dst_root}")
    dst_root.mkdir(parents=True, exist_ok=True)
    seen_dest_names = set()
    unhandled = []

    for dirpath, dirnames, filenames in _walk_sorted(src_root):
        rel_dir = Path(dirpath).relative_to(src_root)
        ap_file = Path(dirpath) / "ap.config.txt"
        has_ap = ap_file.is_file()

        html_files = sorted(f for f in filenames if f.lower().endswith(".html"))
        other_files = [f for f in filenames if f != "ap.config.txt" and f not in html_files]
        unhandled.extend(str(Path(dirpath) / f) for f in other_files)

        ap_name = None
        paired_file = None
        if has_ap:
            ap_name = ap_file.read_text(encoding="utf-8", errors="replace").strip().splitlines()[0].strip()
            index_candidates = [f for f in html_files if f.lower() == "index.html"]
            if index_candidates:
                paired_file = index_candidates[0]
            elif len(html_files) == 1:
                paired_file = html_files[0]
            elif len(html_files) == 0:
                raise SystemExit(f"ap.config.txt orfao (nenhum .html no mesmo dir) em {dirpath} -- "
                                  f"revisar manualmente, nao da pra dobrar a tag AP em lugar nenhum.")
            else:
                raise SystemExit(f"ap.config.txt ambiguo em {dirpath}: {len(html_files)} arquivos .html "
                                  f"({html_files}) e nenhum se chama 'index.html' -- decisao manual "
                                  f"necessaria pra saber qual recebe a tag AP.")

        for fname in html_files:
            src_file = Path(dirpath) / fname
            if fname == paired_file:
                label = " - ".join(rel_dir.parts) if rel_dir.parts else "index"
                transform = "ap_tag_folded"
            else:
                stem = Path(fname).stem
                label = " - ".join(list(rel_dir.parts) + [stem]) if rel_dir.parts else stem
                transform = "as_is_copy"

            dest_name = f"{label}.html"
            if dest_name in seen_dest_names:
                raise SystemExit(f"COLISAO DE NOME apos achatamento: '{dest_name}' (de {src_file}) ja usado -- "
                                  f"regra de achatamento precisa de ajuste antes de continuar.")
            seen_dest_names.add(dest_name)

            content = src_file.read_text(encoding="utf-8", errors="replace")
            if transform == "ap_tag_folded":
                content = f'<!-- AP="{ap_name}" -->\n' + content

            dest_path = dst_root / dest_name
            dest_path.write_text(content, encoding="utf-8")
            manifest_rows.append({
                "source_path": str(src_file),
                "dest_path": str(dest_path),
                "transformation": transform,
                "ap_name": ap_name if fname == paired_file else "",
            })

    if unhandled:
        raise SystemExit("Arquivos nao reconhecidos (nem .html nem ap.config.txt) -- "
                          "revisar manualmente antes de prosseguir:\n" + "\n".join(unhandled))
    return manifest_rows


def copy_badusb_vendor(src_root: Path, dst_root: Path, manifest_rows: list):
    """
    src_root: .../sd_card_content/badusb_extra_payloads/_vendor_0xNOWHERE
    dst_root: .../sd_card_mirror/badusb/!repo/works_both/_vendor_0xNOWHERE
    Copia 1:1 preservando a estrutura interna do vendor (precedente BadUsb-Library).
    """
    if dst_root.exists():
        raise SystemExit(f"Destino ja existe, abortando pra nao sobrescrever silenciosamente: {dst_root}")
    shutil.copytree(src_root, dst_root)
    for f in sorted(src_root.rglob("*")):
        if f.is_file():
            rel = f.relative_to(src_root)
            manifest_rows.append({
                "source_path": str(f),
                "dest_path": str(dst_root / rel),
                "transformation": "as_is_copy_vendor_structure",
                "ap_name": "",
            })
    return manifest_rows


def _walk_sorted(root: Path):
    import os
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        filenames.sort()
        yield dirpath, dirnames, filenames


def write_manifest(rows: list, out_csv: Path):
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["source_path", "dest_path", "transformation", "ap_name"])
        w.writeheader()
        for r in rows:
            w.writerow(r)


if __name__ == "__main__":
    repo = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    rows = []
    n_before = len(rows)
    convert_wifi_portals(
        repo / "sd_card_content" / "wifi_portals" / "!repo" / "0xNOWHERE_BRUCE-FILES",
        repo / "sd_card_mirror" / "PortalTemplates" / "!repo" / "0xNOWHERE_BRUCE-FILES",
        rows,
    )
    n_portal = len(rows) - n_before
    n_before = len(rows)
    copy_badusb_vendor(
        repo / "sd_card_content" / "badusb_extra_payloads" / "_vendor_0xNOWHERE",
        repo / "sd_card_mirror" / "badusb" / "!repo" / "works_both" / "_vendor_0xNOWHERE",
        rows,
    )
    n_badusb = len(rows) - n_before
    write_manifest(rows, repo / "sync_manifest_wifi_badusb_to_card.csv")
    n_ap_folded = sum(1 for r in rows if r["transformation"] == "ap_tag_folded")
    print(f"Evil Portal: {n_portal} arquivos .html gerados em PortalTemplates/!repo/0xNOWHERE_BRUCE-FILES/ "
          f"({n_ap_folded} com tag AP dobrada de ap.config.txt)")
    print(f"BadUSB: {n_badusb} arquivos copiados em badusb/!repo/works_both/_vendor_0xNOWHERE/")
    print(f"OK: {len(rows)} linhas escritas em sync_manifest_wifi_badusb_to_card.csv")
