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
| [`nfc/`](#nfc) | 5,370 | NFC/RFID tags (Amiibo, Tonies, Mifare dictionaries, novelty tags, community) |
| [`themes/`](#themes) | 37 | UI themes |
| [`wifi_portals/`](#wifi_portals) | 11 | Captive portal (Evil Portal) templates |
| [`interpreter_js_apps/`](#interpreter_js_apps) | 52 | Apps/scripts for Bruce's JS interpreter |
| [`subghz_extra_dbs/`](#subghz_extra_dbs) | 14,115 | Extra Sub-GHz databases, by category |
| [`ir_extra_dbs/`](#ir_extra_dbs) | 12,824 | Extra IR databases, by category |
| [`badusb_extra_payloads/`](#badusb_extra_payloads) | 3,089 | Extra BadUSB payloads |
| [`music_rtttl/`](#music_rtttl) | 11,199 | RTTTL-format songs (text `.txt`) for Bruce's audio player |

Total: **49,583 files**, ~1 GB.

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

Total: 5,370 files.

## themes/

UI themes for Bruce:

- `README.md`, `Theme_Builder.html`, `example/` — official Bruce material
- `Bruce-Themes_community/` — extra community themes ([anonimoKali/Bruce-Themes](https://github.com/anonimoKali/Bruce-Themes))

Total: 37 files. **This is one of the only folders that can depend on the
specific board** (screen resolution) — check compatibility before applying
a theme made for other hardware.

## wifi_portals/

Official Bruce Evil Portal / captive portal templates, in two languages:

- `en/` — facebook, google, instagram, microsoft, router_update (5 pages)
- `pt-br/` — the same 5 pages in Portuguese
- `evil portal/readme.md` — usage instructions

Total: 11 files.

> **Warning**: these templates simulate login pages of real services. Use
> only in authorized security testing or controlled environments — never
> against third parties without consent.

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

Total: 52 files.

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
subfolder), `Smart_Home_Remotes`, `Retekess pager system t119`, among
~65 others. Some categories have duplicate-looking names with different
spelling (`Ceiling Fans` vs `Ceiling_Fans`) because they came from
different sources that named the same thing differently — the merge keeps
both rather than guessing which to rename.

Total: 14,115 unique files (after deduplication — see
[Deduplication](#deduplication-applied)).

## ir_extra_dbs/

IR databases **beyond** the official `UniversalIR/`, reorganized by
**category** (device/use case) the same way as Sub-GHz.

Sources aggregated into this folder:

| Source | Repository |
|---|---|
| Main Flipper Zero community IR database (TVs, ACs, consoles, etc.) | [Lucaslhm/Flipper-IRDB](https://github.com/Lucaslhm/Flipper-IRDB) |
| Extra IR from the Bruce community | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |

Notable categories: `TVs`, `ACs`, `Consoles`, `Projectors`, `Cable_Boxes`,
`Brand_(sorted)` (the same collection organized by brand instead of
device type), among ~50 others.

Total: 12,824 unique files (after deduplication).

## badusb_extra_payloads/

BadUSB payloads **beyond** the official `BadUSB_BlueDucky/`:

| Subfolder | Contents | Source |
|---|---|---|
| `Flipper-Zero-BadUSB/` | Flipper Zero community payloads | [I-Am-Jakoby/Flipper-Zero-BadUSB](https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB) |
| `BadUsb-Library/` | Library organized by technique (MITRE ATT&CK) | [Starvinci/BadUsb-Library](https://github.com/Starvinci/BadUsb-Library) |
| `Bruce-Scripts-Heaven_BAD/` | Ducky Script payloads (Windows/macOS/Linux/Android/iOS) | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| `UberGuidoZ_BadUSB/` | Additional payloads (bombs, pranks, recon, exfiltration) not duplicated in the sources above | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |

Total: 3,089 unique files (after deduplication and removal of 3 "prank"
files of ~15MB each, which were image hexdumps with no real function).

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

Total: 11,199 unique files (after internal deduplication across the
source subfolders — 264 duplicates removed).

---

## Deduplication applied

The extra databases (Sub-GHz, IR, BadUSB, NFC) had overlap between
sources (several projects redistributing the same content). Deduplication
by **content hash** (not just filename) was applied at each merge:

| Category | Note |
|---|---|
| Sub-GHz | Heavy dedup already applied at the source level (33,723 → ~14,071), plus incremental dedup when merging CrowdLED (22 duplicates avoided) |
| IR | Heavy dedup already applied at the source level (30,139 → ~12,825) |
| BadUSB | 316 duplicates avoided when merging `UberGuidoZ_BadUSB/` against what already existed |
| NFC | 111 duplicates avoided when merging `Tonies_NFC/` against what already existed |
| Music RTTTL | 264 internal duplicates avoided across the 5 source subfolders from UberGuidoZ |

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

## Usage warning

Several databases here (third-party vehicle/gate Sub-GHz signals, BadUSB
payloads, captive portal templates, RFID bruteforcers) are
offensive-security/RF-research tools. Use is the responsibility of
whoever operates the device — check local regulations before using
outside a controlled or authorized environment.
