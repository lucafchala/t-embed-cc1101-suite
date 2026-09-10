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
| `SD_Card_T-Embed/ir_extra_dbs/<Categoria>/flipperdevices_IRDB/` | [flipperdevices/IRDB](https://github.com/flipperdevices/IRDB) | MIT |
| `SD_Card_T-Embed/ir_extra_dbs/_sasiplavnik_extra/` | [sasiplavnik/Flipper-IRDB](https://github.com/sasiplavnik/Flipper-IRDB) | Ver repositório |
| `SD_Card_T-Embed/themes/Bruce-Themes_wendells01/` | [wendells01/Bruce-Themes](https://github.com/wendells01/Bruce-Themes) | Ver repositório |
| `SD_Card_T-Embed/themes/Pwnagotchi_theme_pfefferle/` | [pfefferle/bruce-pwnagotchi-theme](https://github.com/pfefferle/bruce-pwnagotchi-theme) | Ver repositório |
| `SD_Card_T-Embed/wifi_portals/router_login_batcherss/` | [Batcherss/evil-portal-html](https://github.com/Batcherss/evil-portal-html) | Ver repositório |
| `SD_Card_T-Embed/wifi_portals/fake_login_borys/` | [Borys-esp/EvilPortal_DB](https://github.com/Borys-esp/EvilPortal_DB) | Ver repositório |
| `SD_Card_T-Embed/interpreter_js_apps/ProtoPirate.js` | [Senape3000/ProtoPirate-Bruce](https://github.com/Senape3000/ProtoPirate-Bruce) | Ver repositório |
| `SD_Card_T-Embed/interpreter_js_apps/App_Store.js`, `rename-catch.js`, `rf_433_replay.js`, `ir_brute_force.js`, `rf_brute_nmrf.js` | [Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store) | Ver repositório |
| `SD_Card_T-Embed/interpreter_js_apps/browser_OnChainTemplars.js`, `cryptocurrencies_OnChainTemplars.js` | [OnChainTemplars/bruce-apps](https://github.com/OnChainTemplars/bruce-apps) | GPL-3.0 |
| `SD_Card_T-Embed/ir_extra_dbs/_magikh0e_extra/` | [magikh0e/FlipperZero_Stuff](https://github.com/magikh0e/FlipperZero_Stuff) | Ver repositório |
| `SD_Card_T-Embed/themes/Bruce-Themes_community/` | [anonimoKali/Bruce-Themes](https://github.com/anonimoKali/Bruce-Themes) | Ver repositório |
| `SD_Card_T-Embed/interpreter_js_apps/BruceScripts_community/` | [badgib/BruceScripts](https://github.com/badgib/BruceScripts) | Ver repositório |
| `SD_Card_T-Embed/interpreter_js_apps/js-apps-bruce/` | [michauMiau/js-apps-bruce](https://github.com/michauMiau/js-apps-bruce) | Ver repositório |

"Ver repositório" significa que a licença não foi confirmada nesta
organização — consulte o repositório de origem antes de redistribuir ou
usar comercialmente esse conteúdo específico.

> **Nota sobre conteúdo removido**: versões anteriores deste repositório
> vendorizavam também drivers USB-serial (WCH CH9102), o `esptool`,
> documentação de hardware da placa e bibliotecas de desenvolvimento
> (RadioLib, LVGL, FastLED) nas pastas `Drivers_Windows/`,
> `Ferramentas_Flash/`, `Documentacao/` e `Bibliotecas_Dev/`. Essas pastas
> foram removidas numa limpeza posterior — esse tipo de conteúdo fica
> desatualizado rápido e a fonte oficial de cada projeto já cobre isso
> melhor. Os links diretos estão na seção Quickstart do README raiz.

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
| Bruce Theme Builder, Bruce Web Flasher, CapibaraZero Web-Flasher | Ferramentas web, não arquivos pra incluir em repositório — linkadas em [Links úteis](README.md#-links-úteis) no README raiz em vez disso |
| `tutyr2-jpg/Bruce-A-C-Edition`, `Bollgio/BruceIRF` | Forks alternativos do Bruce; este repositório documenta o Bruce oficial via Launcher |
| `twowayteigan/all-public-esp32-firmware` | Apenas uma lista de links, sem binários próprios |
| CapibaraZero | Firmware alternativo; fora do escopo deste repositório |
| XRemote (app de IR avançado) | App compilado especificamente para o hardware do Flipper Zero (`.fap`), não roda no Bruce/ESP32 |
| Sentry Safe plugin, GPS reader (`ezod/flipperzero-gps`), COM Port Scanner Emulator | Apps `.fap` do Flipper Zero — dependem de hardware/SDK do Flipper, não portáveis ao Bruce |
| Wav_Player (UberGuidoZ) | Arquivos de áudio grandes (.wav) — descartado por tamanho; o formato RTTTL (`music_rtttl/`) já cobre música no buzzer do Bruce |
| T119 bruteforcer | Conteúdo equivalente já presente no banco Sub-GHz agregado, descartado por redundância |
| `rf_jammer.js` (Jiggyv3/Bruce-App-Store) | Ferramenta de jamming ativo de RF — diferente do resto do conteúdo agregado porque a interferência se propaga pro ambiente (afeta qualquer receptor na frequência, não um alvo específico), e o próprio código traz aviso de que é ilegal operar isso na maioria das jurisdições |
| `Information Stealer.txt`, `Disable Firewall and Create An Admin Account.txt` (magikh0e/FlipperZero_Stuff, pasta `BadUSB/`) | Payloads que o próprio autor rotula como "Backdoor" — criam conta de admin oculta e desativam o firewall num Windows alvo sem consentimento. Categoria diferente dos payloads ofensivos de segurança já presentes em `badusb_extra_payloads/` — não incluídos |
| `probonopd/irdb` | Banco de IR grande mas em formato `.csv` próprio, não `.ir` — precisaria de conversão |
| `sosbgit/Flipper-Zero-IRDB`, `logickworkshop/Flipper-IRDB`, `mahan518/Flipper_IR_Database`, `heytem/Flipper-Zero-IR-DataBase`, `RandomDebugError/irdb` | Forks/cópias confirmadas de bancos de IR já incluídos — reconferido por hash a pedido, zero arquivos novos |
| `Jalapenothedragon/evil-portal-html` | Mesmo conjunto de templates que `Batcherss/evil-portal-html` já incluído, com 2 variantes a menos — reconferido por hash, zero arquivos novos |
| `MuddledBox/FlipperZeroSub-GHz`, `ErikLentz/Flipper-Finds` | Reconferidos por hash a pedido: só metadado de repositório (LICENSE/README) e uma foto eram "novos" — nenhum arquivo de conteúdo real |

> **Nota**: `ir_brute_force.js`/`rf_brute_nmrf.js` (Jiggyv3) e o restante de
> `OnChainTemplars/bruce-apps` — inicialmente descartados por serem
> reimplementações com a mesma função de scripts já incluídos — foram
> **reincluídos** a pedido, já que não têm problema de segurança, só
> duplicam funcionalidade. `magikh0e/FlipperZero_Stuff` também teve seu
> único arquivo `.ir` legítimo (controle de vaporizador Arizer XQ2)
> incluído. Os 2 payloads BadUSB "Backdoor" do mesmo autor e o
> `rf_jammer.js` são as únicas exclusões que seguem de fora.

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

> **Note on removed content**: earlier versions of this repository also
> vendored USB-serial drivers (WCH CH9102), `esptool`, the board's hardware
> documentation, and development libraries (RadioLib, LVGL, FastLED) under
> `Drivers_Windows/`, `Ferramentas_Flash/`, `Documentacao/`, and
> `Bibliotecas_Dev/`. Those folders were removed in a later cleanup — that
> kind of content goes stale fast and each project's official source
> already covers it better. Direct links live in the root README's
> Quickstart section.

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
| Bruce Theme Builder, Bruce Web Flasher, CapibaraZero Web-Flasher | Web tools, not files to include in a repository — linked in [Useful links](README.en.md#-useful-links) in the root README instead |
| `tutyr2-jpg/Bruce-A-C-Edition`, `Bollgio/BruceIRF` | Alternative Bruce forks; this repository documents official Bruce via Launcher |
| `twowayteigan/all-public-esp32-firmware` | Just a list of links, no binaries of its own |
| CapibaraZero | Alternative firmware; out of scope for this repository |
| XRemote (advanced IR app) | App compiled specifically for Flipper Zero hardware (`.fap`), does not run on Bruce/ESP32 |
| Sentry Safe plugin, GPS reader (`ezod/flipperzero-gps`), COM Port Scanner Emulator | Flipper Zero `.fap` apps — depend on Flipper's own hardware/SDK, not portable to Bruce |
| Wav_Player (UberGuidoZ) | Large audio (.wav) files — dropped for size; the RTTTL format (`music_rtttl/`) already covers buzzer music on Bruce |
| T119 bruteforcer | Equivalent content already present in the aggregated Sub-GHz database, dropped as redundant |
| `rf_jammer.js` (Jiggyv3/Bruce-App-Store) | Active RF jamming tool — unlike the rest of the aggregated content, the interference radiates into the environment (it affects any receiver on that frequency, not one specific target), and the code itself warns it's illegal to operate in most jurisdictions |
| `Information Stealer.txt`, `Disable Firewall and Create An Admin Account.txt` (magikh0e/FlipperZero_Stuff, `BadUSB/` folder) | Payloads the author himself labels "Backdoor" — they create a hidden admin account and disable the firewall on a targeted Windows machine without consent. Different category from the offensive-security payloads already in `badusb_extra_payloads/` — not included |
| `probonopd/irdb` | Large IR database but in its own `.csv` format, not `.ir` — would need conversion |
| `sosbgit/Flipper-Zero-IRDB`, `logickworkshop/Flipper-IRDB`, `mahan518/Flipper_IR_Database`, `heytem/Flipper-Zero-IR-DataBase`, `RandomDebugError/irdb` | Confirmed forks/copies of IR databases already included — rechecked by hash on request, zero new files |
| `Jalapenothedragon/evil-portal-html` | Same set of templates as `Batcherss/evil-portal-html` already included, minus 2 variants — rechecked by hash, zero new files |
| `MuddledBox/FlipperZeroSub-GHz`, `ErikLentz/Flipper-Finds` | Rechecked by hash on request: only repo metadata (LICENSE/README) and one photo came back "new" — no actual content files |

> **Note**: `ir_brute_force.js`/`rf_brute_nmrf.js` (Jiggyv3) and the rest of
> `OnChainTemplars/bruce-apps` — initially dropped for duplicating the
> function of scripts already included — were **added back** on request,
> since they carry no safety concern, only functional overlap.
> `magikh0e/FlipperZero_Stuff` also had its one legitimate `.ir` file
> (Arizer XQ2 vaporizer remote) included. The same author's 2 "Backdoor"
> BadUSB payloads and `rf_jammer.js` are the only exclusions that remain.
