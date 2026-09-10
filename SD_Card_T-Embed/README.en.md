# SD_Card_T-Embed/

**Copy the contents of this folder (files and subfolders, not the folder
itself) to the root of a FAT32 microSD card** and insert it into the board
before powering it on with Bruce already installed (via the Launcher).

> Despite the folder's name (inherited from this repository's target
> board), almost everything here is **Bruce-generic** — it works on any
> board running the firmware, not just the T-Embed CC1101. The only
> exceptions are `themes/` and any boot images, which can depend on each
> board's specific screen resolution.

## Overview

| Subfolder | Files | Contents |
|---|---|---|
| [`UniversalIR/`](#universalir-and-universalrf) | 829 | Official Bruce IR database |
| [`UniversalRF/`](#universalir-and-universalrf) | 2,052 | Official Bruce Sub-GHz database (Garages/Gates/Vehicles) |
| [`BadUSB_BlueDucky/`](#badusb_blueducky) | 3 | Official Ducky Script payloads |
| [`nfc/`](#nfc) | 8,008 | NFC/RFID tags (Amiibo, Tonies, Mifare dictionaries, novelty tags, community, Skylanders/LEGO) |
| [`themes/`](#themes) | 410 | UI themes |
| [`wifi_portals/`](#wifi_portals) | 43 | Captive portal (Evil Portal) templates |
| [`interpreter_js_apps/`](#interpreter_js_apps) | 73 | Apps/scripts for Bruce's JS interpreter |
| [`subghz_extra_dbs/`](#subghz_extra_dbs) | 14,086 | Extra Sub-GHz databases, by category |
| [`ir_extra_dbs/`](#ir_extra_dbs) | 16,825 | Extra IR databases, by category |
| [`badusb_extra_payloads/`](#badusb_extra_payloads) | 3,316 | Extra BadUSB payloads |
| [`music_rtttl/`](#music_rtttl) | 11,195 | RTTTL-format songs (text `.txt`) for Bruce's audio player |

Total: **56,841 files**, ~1.1 GB.

---

## UniversalIR/ and UniversalRF/

Official databases shipped with the Bruce release — 829 IR files and
2,052 RF files (organized into categories like Garages, Gates, Vehicles),
curated and validated by the project maintainers.

- Source: [BruceDevices/firmware](https://github.com/BruceDevices/firmware) (official release)
- License: AGPL-3.0

## BadUSB_BlueDucky/

Official Ducky Script payloads shipped with Bruce (3 files, PT-BR and EN).

- Source: [BruceDevices/firmware](https://github.com/BruceDevices/firmware) (official release)
- License: AGPL-3.0

## nfc/

NFC/RFID tags from multiple sources, merged and deduplicated by content
hash:

| Subfolder | Contents | Source |
|---|---|---|
| `AmiiboDB/` | Full Amiibo dump (`.bin`/`.nfc`) | [AmiiboDB/Amiibo](https://github.com/AmiiboDB/Amiibo) |
| `Bruce-Scripts-Heaven_RFID/` | Community RFID tags | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| `Tonies_NFC/` | 738 Toniebox tags (Paw Patrol, Pokémon, DC, National Geographic Kids, etc.), organized by language/collection | [nortakales/flipper-zero-tonies](https://github.com/nortakales/flipper-zero-tonies) |
| `UberGuidoZ_Fun_Files/` | Novelty NFC tags (RickRoll, links, easter eggs) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `UberGuidoZ_Mifare_Classic_Dict/` | Key dictionaries for Mifare Classic cards | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `UberGuidoZ_Amiibo_Tools/` | Amiibo converters/tools (complements AmiiboDB, not duplicated) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `UberGuidoZ_H10301_RFID_Bruteforce/` | Bruteforcer for the HID H10301 access-card format (26-bit Wiegand) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `Skylanders_LEGO_Toys/` | 784 NFC dumps of Skylanders figures + 2 per-UID cryptographic key generator scripts (Skylanders/Disney Infinity) | [sealldeveloper/FlipperSkylanders](https://github.com/sealldeveloper/FlipperSkylanders), [LNRC/Flipper-Infinity-Skylanders](https://github.com/LNRC/Flipper-Infinity-Skylanders) |

Total: 8,008 files.

> **Warning — `UberGuidoZ_H10301_RFID_Bruteforce/`**: unlike the rest of
> this folder (dumps/replay of specific tags), this is a **physical
> access control** bruteforcer (HID H10301 cards, Wiegand 26-bit) — it
> systematically tries credential combinations against a real reader.
> Category: **physical access control, active fuzzing/brute force,
> authorized testing only**. Not equivalent to the regular NFC dumps in
> this folder.

## themes/

UI themes for Bruce:

- `README.md`, `Theme_Builder.html`, `example/` — official Bruce material
- `Bruce-Themes_community/` — extra community themes ([anonimoKali/Bruce-Themes](https://github.com/anonimoKali/Bruce-Themes))
- `Bruce-Themes_wendells01/` — 3 extra themes ("Orange - Akkok", "Orange - Tsoucky", "Flipper inspired black theme") + boot animations for T-Embed and M5Stick ([wendells01/Bruce-Themes](https://github.com/wendells01/Bruce-Themes))
- `Pwnagotchi_theme_pfefferle/` — theme with a Pwnagotchi-inspired look, with its own icon set for Bruce's modules (wifi, ble, rf, ir, nfc, gps, etc.); confirmed compatible with Cardputer, M5StickC Plus2 and CYD ([pfefferle/bruce-pwnagotchi-theme](https://github.com/pfefferle/bruce-pwnagotchi-theme))
- `koua29_community/` — 2 theme sets made specifically for the T-Embed CC1101's 320×170 screen: "HUD" (3 colorways) and "Wheel" (radial wheel, light/dark) ([koua29](https://github.com/koua29))

Total: 410 files. **This is one of the only folders that can depend on the
specific board** (screen resolution) — check compatibility before applying
a theme made for other hardware.

## wifi_portals/

**Credential-harvesting simulation** templates (the technique is commonly
nicknamed "Evil Portal", but that name undersells what the template
actually does: imitate a real service's login screen to capture whatever
gets typed into it). Official Bruce templates, in two languages:

- `en/` — facebook, google, instagram, microsoft, router_update (5 pages)
- `pt-br/` — the same 5 pages in Portuguese
- `router_login_batcherss/` — 22 router-brand login-screen templates (TP-LINK, Xiaomi, Asus, Mercusys, Keenetic, Huawei, Tenda, Mikrotik, Netis), in Bruce and Marauder variants ([Batcherss/evil-portal-html](https://github.com/Batcherss/evil-portal-html))
- `fake_login_borys/` — 7 fake login templates for well-known services (Apple ID, Facebook, Google, T-Mobile, etc.) ([Borys-esp/EvilPortal_DB](https://github.com/Borys-esp/EvilPortal_DB))

Total: 42 files.

> **Warning**: these templates simulate login pages of real services. Use
> only in authorized security testing or controlled environments — never
> against third parties without consent. Copying the whole card without
> reviewing its content can load these pages without you realizing it.

### Setting the AP name from the HTML itself

Bruce's captive-portal system supports setting the Access Point name
directly from a comment on the **first line** of the template's HTML file,
instead of typing the name every time:

```html
<!-- AP="YourAPName" -->
<!DOCTYPE html>
...
```

If the tag isn't present, Bruce asks for the AP name as usual (default
behavior — no template requires it). Works for any template in this
folder, not just one specific one.

## interpreter_js_apps/

Scripts/apps for Bruce's built-in JavaScript interpreter:

- Games: `Snake_Cardputer.js`, `Snake_Stick_CoreS3.js`, `dino_game.js`,
  `pingpong.js`, `space_shooter.js`, `highway_racer.js`, `tamagochi.js`
- Utilities: `calculator_t-embed.js`, `crypto-prices.js`, `dtmf.js`,
  `ir2keys.js`, `spectrum_t-embed.js`, `timer_background.js`
- Brute-forcers: `ir_brute.js`, `rf_brute.js`, `wifi_brute.js`
- `gifs/` + `gifs.js` — GIF support in the UI
- `BruceScripts_community/` — community extras ([badgib/BruceScripts](https://github.com/badgib/BruceScripts))
- `js-apps-bruce/` — community extras ([michauMiau/js-apps-bruce](https://github.com/michauMiau/js-apps-bruce))
- `ProtoPirate.js` — multi-protocol car key fob decoder ([Senape3000/ProtoPirate-Bruce](https://github.com/Senape3000/ProtoPirate-Bruce))
- `App_Store.js` — an app-store/launcher built inside the JS interpreter itself ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `rename-catch.js` — file rename/organize utility ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `rf_433_replay.js` — 433MHz Sub-GHz signal replay ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `ir_brute_force.js`, `rf_brute_nmrf.js` — alternative IR/Sub-GHz bruteforce implementations, same function as `ir_brute.js`/`rf_brute.js` (official) but their own code ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `browser_OnChainTemplars.js`, `cryptocurrencies_OnChainTemplars.js` — alternative web-browser and crypto-price apps, same function as the already-included `crypto-prices.js` (there's no official browser equivalent) ([OnChainTemplars/bruce-apps](https://github.com/OnChainTemplars/bruce-apps), GPL-3.0)
- `rf_jammer.js` — active RF jamming tool ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store)); added directly by the repository maintainer, outside the hash-based curation process above
- `BruceSafe.js` — game made specifically for the T-Embed ([ssstee/BruceSafe](https://github.com/ssstee/BruceSafe))
- `BruteRF.js` — Sub-GHz bruteforce tool with 34 protocols, De Bruijn attack, RAW mode ([Senape3000/Bruce-JS-Apps](https://github.com/Senape3000/Bruce-JS-Apps))
- `koua29_community/` — 7 apps made specifically for the T-Embed CC1101: surveillance-camera detector (Flock Detector), Wi-Fi QR code, Snake, SSID "safari", Breakout, TV-B-Gone, script launcher ([koua29](https://github.com/koua29))

Total: 73 files.

> **⚠️ Warning about `rf_jammer.js`**: unlike the rest of this folder
> (which reads, probes, or replays signals), this script actively
> transmits RF noise to interfere with other signals — the code itself
> warns it's illegal to operate in most jurisdictions, and the
> interference affects any receiver on that frequency, not just an
> intended target. Use is solely the responsibility of whoever operates
> the device.

## subghz_extra_dbs/

Sub-GHz databases **beyond** the official `UniversalRF/`, reorganized by
**category** (device/use case), merging every source into a single tree
and deduplicating by content hash. Per-file provenance is lost in the
merge — the aggregated sources are listed below.

Sources aggregated into this folder:

| Source | Repository |
|---|---|
| Flipper Zero community "flagship" collection (Sub-GHz + BadUSB + NFC + Music) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| General signal collection | [Zero-Sploit/FlipperZero-Subghz-DB](https://github.com/Zero-Sploit/FlipperZero-Subghz-DB) |
| Bruce community RF signals | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| Commercial doorbell/customer-service buttons | [DRA6N/SubGhz_Cust_Serv](https://github.com/DRA6N/SubGhz_Cust_Serv) |
| Tesla charge-port release signal | [Robbbbbbbbb/tesla-chargeport](https://github.com/Robbbbbbbbb/tesla-chargeport) |
| Event LED wristbands (CrowdLED protocol, EN+ES) | [niltefa/Flipper-CrowdLED-Wristbands](https://github.com/niltefa/Flipper-CrowdLED-Wristbands) |

Notable categories: `Garages`, `Gates`, `Vehicles`, `Doorbells`,
`Ceiling_Fans`, `Concert bracelet` (with a `CrowdLED_Wristbands/`
subfolder), `Smart_Home_Remotes`, `Retekess pager system t119`,
`Jamming`, `Car Key Jammer` and `OOK_bruteforce` (the last 3 carry their
own usage warning below — not ordinary replay signals), among ~65 others. Categories that came from different sources under different
spellings for the same name (e.g. `Ceiling Fans` vs `Ceiling_Fans`) were
merged into a single folder, with content-hash dedup applied at merge time
(identical file in both → kept once; same name but different content →
both kept, the incoming one gets a short suffix).

> **⚠️ Warning — `Jamming/` and `Car Key Jammer/`**: unlike the rest of
> this folder (which reads, tests, or replays individual signals), these
> two categories contain pure-noise `RAW_Data` files, ready to transmit
> via the Bruce's TX with no script needed — systematically covering
> almost the entire 300–928 MHz range the CC1101 transmits. This is the
> same risk already documented for [`rf_jammer.js`](#interpreter_js_apps)
> (active RF interference, illegal in most jurisdictions, affects any
> receiver on the frequency, not just an intended target) — except easier
> to trigger by accident, since it doesn't go through the JS interpreter.
> **In Brazil specifically**: much of the US-style car/gate content in
> this suite operates at 315 MHz, which is **not** among the restricted-
> radiation bands ANATEL permits (Resolução 680/2017, Annex I — permitted:
> 335.4–399.9 MHz, 410–608 MHz, and 915–948 MHz). Transmitting outside
> those bands may constitute unauthorized telecom activity (Lei
> 9.472/1997, art. 183). This isn't legal advice — check your own
> country's regulations before transmitting anything.

> **Note — `Rg/`, `Am_far/`, `Fm_far/`, `Fm_close/`**: 4 folders with 1
> `RAW_Data` file each (467.75 MHz and 433.92 MHz OOK/2FSK). By content
> they look like range-test recordings (far/close) — the aggregated
> source doesn't document the exact purpose or target device. Kept since
> there's no indication they're useless or duplicate, but they don't fit
> a clear category.

Total: 14,086 unique files (after deduplication — see
[Deduplication](#deduplication-applied)).

## ir_extra_dbs/

IR databases **beyond** the official `UniversalIR/`, reorganized by
**category** (device/use case) the same way as Sub-GHz.

Sources aggregated into this folder:

| Source | Repository |
|---|---|
| Main Flipper Zero community IR database (TVs, ACs, consoles, etc.) | [Lucaslhm/Flipper-IRDB](https://github.com/Lucaslhm/Flipper-IRDB) |
| Extra IR from the Bruce community | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| **Official** Flipper Zero team IR database (merged inside the existing categories, under `<Category>/flipperdevices_IRDB/`) | [flipperdevices/IRDB](https://github.com/flipperdevices/IRDB) |
| Independent extra IR (`_sasiplavnik_extra/` folder) | [sasiplavnik/Flipper-IRDB](https://github.com/sasiplavnik/Flipper-IRDB) |
| Arizer XQ2 vaporizer remote (`_magikh0e_extra/` folder) | [magikh0e/FlipperZero_Stuff](https://github.com/magikh0e/FlipperZero_Stuff) |
| 3 extra collections attributed to contributor "sark" — universal remotes, `IrBegone @sark/` (per-room TV signal blocking) and `irtobefree @sark/` (misc electronics) | original source not identified; folder names standardized in this curation (consistent `@sark` spelling) |

Notable categories: `TVs`, `ACs`, `Consoles`, `Projectors`, `Cable_Boxes`,
`Box_SetTopBoxes` (new — set-top boxes, mostly Chinese/Asian brands:
Xiaomi, ZTE, XGIMI, EVPAD, etc., brought in by flipperdevices/IRDB),
`Brand_(sorted)` (the same collection organized by brand instead of
device type), among ~50 others.

Total: 16,825 unique files (after deduplication). Only the `.ir` files
from flipperdevices/IRDB were brought in — the `.json`/`.png` metadata
that accompanies each device is specific to the official Flipper app's UI
and isn't read by Bruce.

## badusb_extra_payloads/

BadUSB payloads **beyond** the official `BadUSB_BlueDucky/`:

| Subfolder | Contents | Source |
|---|---|---|
| `I-Am-Jakoby_BadUSB/` | 24 payloads (prank/visual, recon, and 2 flagged for capturing credentials — see warning and the folder's README) | [I-Am-Jakoby/Flipper-Zero-BadUSB](https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB) |
| `BadUsb-Library/` | Library organized by technique (MITRE ATT&CK) | [Starvinci/BadUsb-Library](https://github.com/Starvinci/BadUsb-Library) |
| `Bruce-Scripts-Heaven_BAD/` | Ducky Script payloads (Windows/macOS/Linux/Android/iOS) | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| `UberGuidoZ_BadUSB/` | Additional payloads (bombs, pranks, recon, exfiltration) not duplicated in the sources above | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `magikh0e_BadUSB/` | 2 "post-exploitation" payloads (system-information gathering; hidden admin account creation + firewall disable) | [magikh0e/FlipperZero_Stuff](https://github.com/magikh0e/FlipperZero_Stuff) |

Total: 3,316 unique files (after deduplication and removal of 3 "prank"
files of ~15MB each, which were image hexdumps with no real function).

> **Correction**: the previous `Flipper-Zero-BadUSB/` folder (same
> source, `I-Am-Jakoby/Flipper-Zero-BadUSB`) only had the
> `README.md`/`.txt` description for each payload — the functional
> `.ps1` scripts had never actually been included. It was replaced by
> `I-Am-Jakoby_BadUSB/`, which brings the complete content (the same
> already-documented payloads, now with the real script, plus 3 payloads
> that weren't even documented: `Debug`, `Flip-Rage-PopUps`,
> `Payloads/Scripts/WifiPasswords.ps1`).

> `magikh0e_BadUSB/` was added directly by the repository maintainer,
> outside the hash-based curation process above. These are BadUSB (HID)
> payloads that run with administrator privilege on the connected machine
> — same risk category as the rest of this folder, but more invasive than
> the recon/replay ones. Use only in an authorized test or on your own
> equipment.

> Bruteforce wordlists (rockyou.txt, openwall.txt, etc.) are **not
> included** in this repository — they are security-industry standard and
> easy to obtain separately if you need Bruce's WiFi bruteforce module.

## music_rtttl/

A collection of songs in **RTTTL** format (Ring Tone Text Transfer
Language), saved as `.txt` text files — yes, plain text, that's the
format Bruce's audio/buzzer player reads and plays directly on the
T-Embed (or any board with a supported buzzer/speaker).

Organized into alphabetical subfolders (`A/` through `Z/`, plus `0/` and
`#/` for names starting with a number/symbol) and two extra categories:
`Arcade/` (NES/PC/arcade game themes) with `NES/`, `PC/` inside it.

- Source: [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) (folders `Music_Player/RTTTL_DUMP`, `Original_Files`, `Arcade_Tones`, `Theme_Songs`, `flipnoise`)
- License: GPL-3.0

Total: 11,195 unique files (after internal deduplication across the
source subfolders — 264 duplicates removed).

---

## Deduplication applied

The extra databases (Sub-GHz, IR, BadUSB, NFC) had overlap between
sources (several projects redistributing the same content). Deduplication
by **content hash** (not just filename) was applied at each merge:

| Category | Note |
|---|---|
| Sub-GHz | Heavy dedup already applied at the source level (33,723 → ~14,071), plus incremental dedup when merging CrowdLED (22 duplicates avoided) |
| IR | Heavy dedup already applied at the source level (30,139 → ~12,825), plus 2,116 duplicates avoided when merging flipperdevices/IRDB (much of it already covered the same generic/reused codes across brands) and 572 when merging sasiplavnik/Flipper-IRDB |
| BadUSB | 316 duplicates avoided when merging `UberGuidoZ_BadUSB/` against what already existed |
| NFC | 111 duplicates avoided when merging `Tonies_NFC/` against what already existed |
| Music RTTTL | 264 internal duplicates avoided across the 5 source subfolders from UberGuidoZ |
| Themes / Portals / JS apps | Compared by hash against the entire tree — 0 duplicates found in these sources (genuinely new content) |

Two identical forks of the same dataset (`techniixdotcom/Bruce-Scripts`
and `0xN0WHERE/BRUCE-FILES`) were discarded entirely, being exact copies
of `sloth632/Bruce-Scripts-Heaven`.

## What was considered and left out

A few niche items researched during one curation pass were **not
included** because they don't apply to this setup — most because they are
applications compiled specifically for the **real Flipper Zero's**
firmware/hardware (not Bruce/ESP32) and don't run on this device:

| Item | Reason |
|---|---|
| T119 Bruteforcer (Retekess pager, `xb8/t119bruteforcer`) | Already present — the same 3 `.sub` files arrived via another aggregated source |
| XRemote (advanced IR app) | `.fap` app compiled for the Flipper Zero's own firmware/hardware, doesn't run on Bruce/ESP32 |
| Sentry Safe plugin | `.fap` app compiled for the Flipper Zero (uses GPIO specific to its STM32 hardware) |
| GPS reader (`ezod/flipperzero-gps`) | `.fap` app compiled for the Flipper Zero (`application.fam` = their official firmware's app manifest) |
| COM Port Scanner Emulator | Same category — USB-HID emulation functionality specific to Flipper Zero's own firmware |
| Wav_Player (real `.wav` files, ~2.4GB) | Impractical size for a GitHub repository, and much of it is copyrighted music (real artist tracks) — `music_rtttl/` covers the same use case in a lightweight format without those issues |
| `probonopd/irdb` | Large, actively maintained IR database, but in its own `.csv` format, not `.ir` — would need conversion to be usable by Bruce/Flipper; out of scope for now |
| Identical forks of IR databases already included (`sosbgit/Flipper-Zero-IRDB`, `logickworkshop/Flipper-IRDB`, `mahan518/Flipper_IR_Database`, `heytem/Flipper-Zero-IR-DataBase`, `RandomDebugError/irdb`) | Confirmed copies/forks of sources already present, no content of their own — rechecked by hash, zero new files |
| `Jalapenothedragon/evil-portal-html` | Same set of router-brand templates as `Batcherss/evil-portal-html` already included, minus 2 variants — rechecked by hash, zero new files |
| `MuddledBox/FlipperZeroSub-GHz`, `ErikLentz/Flipper-Finds` | Rechecked by hash on request: only repo metadata (LICENSE/README) and one photo (.jpg) came back "new" — no actual content files (`.sub`/`.ir`/`.nfc`) that weren't already here |

`ir_brute_force.js`/`rf_brute_nmrf.js` (Jiggyv3) and `cryptocurrencies.js`/
`browser.js` (OnChainTemplars) were reconsidered and **included** — see
[interpreter_js_apps/](#interpreter_js_apps) above; they're original
reimplementations, not true duplicates, and carry no safety concern.
`magikh0e/FlipperZero_Stuff` also had one legitimate `.ir` file included
(Arizer XQ2 vaporizer remote) — see [ir_extra_dbs/](#ir_extra_dbs).
`rf_jammer.js` and the 2 `magikh0e_BadUSB/` payloads — which this document
recommended leaving out — were added directly by the repository
maintainer; see the warnings in the
[interpreter_js_apps/](#interpreter_js_apps) and
[badusb_extra_payloads/](#badusb_extra_payloads) sections above.

## Usage warning

Several databases here (third-party vehicle/gate Sub-GHz signals, BadUSB
payloads, captive portal templates, RFID bruteforcers) are
offensive-security/RF-research tools. Use is the responsibility of
whoever operates the device — check local regulations before using
outside a controlled or authorized environment.
