# Contribuindo / Contributing

*English below.*

## Português

Este repositório é uma curadoria de conteúdo de terceiros para a placa
LilyGO T-Embed CC1101 Plus rodando Bruce oficial (instalado via
bmorcelli/Launcher). Contribuições são bem-vindas nas seguintes formas:

- **Reportar duplicatas não removidas** nos bancos de Sub-GHz, IR, NFC ou
  BadUSB — a deduplicação foi feita por hash de conteúdo, mas pode ter
  passado algo despercebido.
- **Sugerir novas fontes** de bancos de dados (Sub-GHz, IR, NFC, BadUSB,
  temas, scripts) — abra uma issue com o link do repositório e uma
  descrição do conteúdo.
- **Corrigir categorização** — se um arquivo em `subghz_extra_dbs/` ou
  `ir_extra_dbs/` está na marca/categoria errada, abra um PR movendo o
  arquivo para a pasta correta.
- **Melhorar a documentação** — correções nos READMEs, traduções, ou
  clareza nas instruções de flash.

Antes de abrir um PR adicionando arquivos, confirme que a fonte tem uma
licença compatível com redistribuição (veja a tabela de proveniência
abaixo) e inclua o link do repositório de origem na descrição do PR.

### Proveniência detalhada por pasta

| Pasta final | Repositório de origem | Licença |
|---|---|---|
| `Launcher/` | [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher) | Ver repositório |
| `SD_Card_T-Embed/UniversalIR/`, `UniversalRF/`, `BadUSB_BlueDucky/` | [BruceDevices/firmware](https://github.com/BruceDevices/firmware) | AGPL-3.0 |
| `SD_Card_T-Embed/subghz_extra_dbs/` (parte) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) | Ver repositório |
| `SD_Card_T-Embed/subghz_extra_dbs/` (parte) | [Zero-Sploit/FlipperZero-Subghz-DB](https://github.com/Zero-Sploit/FlipperZero-Subghz-DB) | Ver repositório |
| `SD_Card_T-Embed/subghz_extra_dbs/`, `ir_extra_dbs/`, `nfc/`, `badusb_extra_payloads/` (partes) | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) | Ver repositório |
| `SD_Card_T-Embed/subghz_extra_dbs/` (parte) | [Robbbbbbbbb/tesla-chargeport](https://github.com/Robbbbbbbbb/tesla-chargeport) | Ver repositório |
| `SD_Card_T-Embed/subghz_extra_dbs/` (parte) | [DRA6N/SubGhz_Cust_Serv](https://github.com/DRA6N/SubGhz_Cust_Serv) | Ver repositório |
| `SD_Card_T-Embed/ir_extra_dbs/` (parte) | [Lucaslhm/Flipper-IRDB](https://github.com/Lucaslhm/Flipper-IRDB) | Ver repositório |
| `SD_Card_T-Embed/nfc/AmiiboDB/` | [AmiiboDB/Amiibo](https://github.com/AmiiboDB/Amiibo) | Ver repositório |
| `SD_Card_T-Embed/badusb_extra_payloads/` (parte) | [I-Am-Jakoby/Flipper-Zero-BadUSB](https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB) | Ver repositório |
| `SD_Card_T-Embed/badusb_extra_payloads/` (parte) | [Starvinci/BadUsb-Library](https://github.com/Starvinci/BadUsb-Library) | Ver repositório |
| `SD_Card_T-Embed/badusb_extra_payloads/UberGuidoZ_BadUSB/`, `SD_Card_T-Embed/nfc/UberGuidoZ_*` | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) | Ver repositório |
| `SD_Card_T-Embed/nfc/Tonies_NFC/` | [nortakales/flipper-zero-tonies](https://github.com/nortakales/flipper-zero-tonies) | Ver repositório |
| `SD_Card_T-Embed/subghz_extra_dbs/` (parte) | [niltefa/Flipper-CrowdLED-Wristbands](https://github.com/niltefa/Flipper-CrowdLED-Wristbands) | MIT |
| `SD_Card_T-Embed/music_rtttl/` | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) (Music_Player) | GPL-3.0 |
| `SD_Card_T-Embed/themes/Bruce-Themes_community/` | [anonimoKali/Bruce-Themes](https://github.com/anonimoKali/Bruce-Themes) | Ver repositório |
| `SD_Card_T-Embed/interpreter_js_apps/BruceScripts_community/` | [badgib/BruceScripts](https://github.com/badgib/BruceScripts) | Ver repositório |
| `SD_Card_T-Embed/interpreter_js_apps/js-apps-bruce/` | [michauMiau/js-apps-bruce](https://github.com/michauMiau/js-apps-bruce) | Ver repositório |
| `Drivers_Windows/` | [Xinyuan-LilyGO/CH9102_Driver](https://github.com/Xinyuan-LilyGO/CH9102_Driver) | Proprietária (WCH), redistribuída pela LilyGO |
| `Ferramentas_Flash/` | [espressif/esptool](https://github.com/espressif/esptool) | GPL-2.0 |
| `Documentacao/` | [Xinyuan-LilyGO/T-Embed-CC1101](https://github.com/Xinyuan-LilyGO/T-Embed-CC1101) | Ver repositório |
| `Bibliotecas_Dev/RadioLib/` | [jgromes/RadioLib](https://github.com/jgromes/RadioLib) | MIT |
| `Bibliotecas_Dev/LVGL/` | [lvgl/lvgl](https://github.com/lvgl/lvgl) | MIT |
| `Bibliotecas_Dev/FastLED/` | [FastLED/FastLED](https://github.com/FastLED/FastLED) | MIT |

"Ver repositório" significa que a licença não foi confirmada nesta
organização — consulte o repositório de origem antes de redistribuir ou
usar comercialmente esse conteúdo específico.

> **Nota**: o `UberGuidoZ/Flipper` deixou de ser usado só para Sub-GHz —
> nesta rodada também foram incorporadas pastas dele de BadUSB, NFC
> (Fun Files, dicionários Mifare Classic, Amiibo Tools, bruteforce H10301)
> e as músicas RTTTL do Music_Player.

### Itens descartados na curadoria

| Item | Motivo |
|---|---|
| Wordlists de bruteforce (rockyou.txt, openwall.txt) | Não incluídas por tamanho e por serem padrão da indústria, fáceis de obter separadamente |
| 3 arquivos "prank" de ~15MB (`Bruce-Scripts-Heaven_BAD/`) | Hexdumps de imagem sem função real de payload |
| `techniixdotcom/Bruce-Scripts`, `0xN0WHERE/BRUCE-FILES` | Cópias exatas de `sloth632/Bruce-Scripts-Heaven`, descartadas por redundância |
| Bruce Theme Builder, Bruce Web Flasher, CapibaraZero Web-Flasher | Ferramentas web, não arquivos para incluir em repositório |
| `tutyr2-jpg/Bruce-A-C-Edition`, `Bollgio/BruceIRF` | Forks alternativos do Bruce; este repositório documenta o Bruce oficial via Launcher |
| `twowayteigan/all-public-esp32-firmware` | Apenas uma lista de links, sem binários próprios |
| CapibaraZero | Firmware alternativo; fora do escopo deste repositório |
| XRemote (app de IR avançado) | App compilado especificamente para o hardware do Flipper Zero (`.fap`), não roda no Bruce/ESP32 |
| Sentry Safe plugin, GPS reader (`ezod/flipperzero-gps`), COM Port Scanner Emulator | Apps `.fap` do Flipper Zero — dependem de hardware/SDK do Flipper, não portáveis ao Bruce |
| Wav_Player (UberGuidoZ) | Arquivos de áudio grandes (.wav) — descartado por tamanho; o formato RTTTL (`music_rtttl/`) já cobre música no buzzer do Bruce |
| T119 bruteforcer | Conteúdo equivalente já presente no banco Sub-GHz agregado, descartado por redundância |

---

## English

This repository is a curation of third-party content for the LilyGO
T-Embed CC1101 Plus board running official Bruce (installed via
bmorcelli/Launcher). Contributions are welcome in the following forms:

- **Report duplicates that weren't caught** in the Sub-GHz, IR, NFC, or
  BadUSB databases — deduplication was done by content hash, but something
  may have slipped through.
- **Suggest new sources** of databases (Sub-GHz, IR, NFC, BadUSB, themes,
  scripts) — open an issue with the repository link and a description of
  the content.
- **Fix categorization** — if a file in `subghz_extra_dbs/` or
  `ir_extra_dbs/` is under the wrong brand/category, open a PR moving it to
  the correct folder.
- **Improve documentation** — README fixes, translations, or clearer flash
  instructions.

Before opening a PR that adds files, confirm the source has a license
compatible with redistribution (see the provenance table below) and
include the source repository link in the PR description.

### Detailed provenance by folder

See the table above (Português section) — it applies identically in both
languages; folder names are kept in their original Portuguese form
throughout the repository for consistency with the file structure.

> **Note**: `UberGuidoZ/Flipper` is no longer used only for Sub-GHz — this
> round also pulled in its BadUSB, NFC (Fun Files, Mifare Classic
> dictionaries, Amiibo Tools, H10301 bruteforce) and Music_Player (RTTTL)
> folders.

### Items dropped during curation

| Item | Reason |
|---|---|
| Bruteforce wordlists (rockyou.txt, openwall.txt) | Not included due to size and because they're security-industry standard, easy to obtain separately |
| 3 "prank" files of ~15MB each (`Bruce-Scripts-Heaven_BAD/`) | Image hexdumps with no real payload function |
| `techniixdotcom/Bruce-Scripts`, `0xN0WHERE/BRUCE-FILES` | Exact copies of `sloth632/Bruce-Scripts-Heaven`, dropped as redundant |
| Bruce Theme Builder, Bruce Web Flasher, CapibaraZero Web-Flasher | Web tools, not files to include in a repository |
| `tutyr2-jpg/Bruce-A-C-Edition`, `Bollgio/BruceIRF` | Alternative Bruce forks; this repository documents official Bruce via Launcher |
| `twowayteigan/all-public-esp32-firmware` | Just a list of links, no binaries of its own |
| CapibaraZero | Alternative firmware; out of scope for this repository |
| XRemote (advanced IR app) | App compiled specifically for Flipper Zero hardware (`.fap`), does not run on Bruce/ESP32 |
| Sentry Safe plugin, GPS reader (`ezod/flipperzero-gps`), COM Port Scanner Emulator | Flipper Zero `.fap` apps — depend on Flipper's own hardware/SDK, not portable to Bruce |
| Wav_Player (UberGuidoZ) | Large audio (.wav) files — dropped for size; the RTTTL format (`music_rtttl/`) already covers buzzer music on Bruce |
| T119 bruteforcer | Equivalent content already present in the aggregated Sub-GHz database, dropped as redundant |
