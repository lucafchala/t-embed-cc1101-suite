# lilygo — T-Embed CC1101 Plus Suite (Bruce via Launcher)

[![Board](https://img.shields.io/badge/board-LilyGO%20T--Embed%20CC1101%20Plus-blue)]()
[![Firmware](https://img.shields.io/badge/firmware-Bruce%20(via%20bmorcelli%2FLauncher)-green)]()
[![Mixed license](https://img.shields.io/badge/license-mixed%20(see%20below)-yellow)]()

*[Leia em português](README.md)*

An organized collection of SD card databases, a firmware launcher, drivers,
flash tools, hardware documentation, and development libraries for the
**LilyGO T-Embed CC1101 Plus** board, running the official
**[Bruce](https://github.com/BruceDevices/firmware)** firmware, installed
through **[bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)**.

This repository is a **curation and reorganization** of several public
GitHub sources — it is not original code. See
[Provenance and licenses](#provenance-and-licenses) before redistributing
any part of it.

**~49,600 files, ~1 GB** of IR/Sub-GHz/NFC/BadUSB/music databases,
deduplicated by content hash and organized by category — see the full
breakdown in [`SD_Card_T-Embed/README.en.md`](SD_Card_T-Embed/README.en.md).

## What this is

- **T-Embed CC1101 Plus**: an ESP32-S3 board from LilyGO with a screen,
  rotary keypad, a built-in Sub-GHz CC1101 radio, and an SD card reader —
  designed for RF/IR/NFC automation.
- **Bruce**: open-source firmware ([BruceDevices/firmware](https://github.com/BruceDevices/firmware),
  formerly `pr3y/Bruce`) with IR, Sub-GHz, NFC, BadUSB, Wi-Fi and more
  functionality, running on a single portable device.
- **Launcher**: instead of flashing Bruce directly over USB every time you
  want to switch firmware, this repository documents the flow through
  [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher) — a launcher
  that stays permanently flashed and installs/updates Bruce (and other
  firmwares) directly from its built-in OTA gallery, no cable needed after
  the initial install.

> **Compatibility note**: despite the repository's name, almost everything
> in `SD_Card_T-Embed/` is **Bruce-generic** — it works on any board
> running the firmware (Cardputer, CYD, other LilyGO variants, etc.), not
> just the T-Embed CC1101. The only exceptions are `themes/` and any boot
> images, which can depend on each board's specific screen resolution.
> Only `Launcher/` and the pinout/hardware part of `Documentacao/` are
> actually specific to this board.

## Quickstart — installing the Launcher and Bruce

1. Connect the T-Embed via USB-C. On Windows, install the driver in
   [`Drivers_Windows/`](Drivers_Windows/README.en.md) if the board isn't
   recognized.
2. Flash the **Launcher** (not Bruce directly) following
   [`Launcher/README.en.md`](Launcher/README.en.md).
3. From the Launcher menu, open the built-in OTA gallery and install
   **Bruce** from there.
4. Copy **all contents** of
   [`SD_Card_T-Embed/`](SD_Card_T-Embed/README.en.md) (the files, not the
   folder itself) to the root of a FAT32 microSD card.
5. Insert the card and power on the board — Bruce should boot with access
   to the extra databases.

> ⚠️ **If your board is the Plus variant (as documented here)**: there's a
> known, still-unfixed SD card mounting bug when running through the
> Launcher. See the full warning in
> [`Launcher/README.en.md`](Launcher/README.en.md#-known-issue--t-embed-cc1101-plus)
> before spending time debugging a "faulty" card.

## Repository structure

```
lilygo/
├── Launcher/                    → launcher (bmorcelli/Launcher) — installs Bruce via OTA gallery
├── SD_Card_T-Embed/             → content to copy to the SD card root
│   ├── UniversalIR/             → curated IR database
│   ├── UniversalRF/             → curated RF database
│   ├── BadUSB_BlueDucky/        → Ducky Script payloads
│   ├── nfc/                     → NFC/RFID tags (Amiibo + community)
│   ├── themes/                  → UI themes
│   ├── wifi_portals/            → captive portal templates
│   ├── interpreter_js_apps/     → apps/scripts for Bruce's JS interpreter
│   ├── subghz_extra_dbs/        → extra Sub-GHz databases, by category
│   ├── ir_extra_dbs/            → extra IR databases, by category
│   ├── badusb_extra_payloads/   → extra BadUSB payloads
│   └── music_rtttl/             → RTTTL songs (.txt) for Bruce's audio player
├── Drivers_Windows/             → CH9102 USB-serial driver (Windows)
├── Ferramentas_Flash/           → esptool (Espressif flash CLI)
├── Documentacao/                → official LilyGO datasheets, schematics, pinout
└── Bibliotecas_Dev/             → RadioLib, LVGL, FastLED (source code)
```

Each main folder has its own `README.en.md` / `README.md` with details,
file counts, and provenance. Direct links:

| Folder | Contents | Docs |
|---|---|---|
| `Launcher/` | Launcher that installs Bruce via its OTA gallery | [README](Launcher/README.en.md) |
| `SD_Card_T-Embed/` | Everything that goes on the SD card (IR/RF/NFC databases, themes, portals, BadUSB) | [README](SD_Card_T-Embed/README.en.md) |
| `Drivers_Windows/` | CH9102 USB-serial driver | [README](Drivers_Windows/README.en.md) |
| `Ferramentas_Flash/` | esptool (flash CLI) | [README](Ferramentas_Flash/README.en.md) |
| `Documentacao/` | Official LilyGO datasheets and schematics | [README](Documentacao/README.en.md) |
| `Bibliotecas_Dev/` | RadioLib, LVGL, FastLED (source, to build from) | [README](Bibliotecas_Dev/README.en.md) |

## Provenance and licenses

This repository **aggregates content from multiple third-party GitHub
repositories**, each with its own license. No single license covers the
whole set. Before redistributing, using commercially, or submitting
upstream PRs, check the original license of each source — the full
provenance table by folder is in
[`CONTRIBUTING.md`](CONTRIBUTING.md#detailed-provenance-by-folder) and
repeated in each subfolder's README.

Summary of the main sources:

| Component | Source | Original license |
|---|---|---|
| Bruce firmware | [BruceDevices/firmware](https://github.com/BruceDevices/firmware) | AGPL-3.0 |
| Launcher | [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher) | See repository |
| Extra Sub-GHz/IR/NFC/BadUSB databases | Multiple Flipper Zero / Bruce community repositories | Varied — see [CONTRIBUTING.md](CONTRIBUTING.md) |
| RadioLib | [jgromes/RadioLib](https://github.com/jgromes/RadioLib) | MIT |
| LVGL | [lvgl/lvgl](https://github.com/lvgl/lvgl) | MIT |
| FastLED | [FastLED/FastLED](https://github.com/FastLED/FastLED) | MIT |
| CH9102 driver | [Xinyuan-LilyGO/CH9102_Driver](https://github.com/Xinyuan-LilyGO/CH9102_Driver) | Proprietary (WCH), redistributed by LilyGO |
| esptool | [espressif/esptool](https://github.com/espressif/esptool) | GPL-2.0 |
| Hardware documentation | [Xinyuan-LilyGO/T-Embed-CC1101](https://github.com/Xinyuan-LilyGO/T-Embed-CC1101) | See original repository |

This README and the documentation files (`*.md`) in this repository may be
used freely; the aggregated third-party content follows its source
licenses.

## Usage warning

Several items here — BadUSB payloads, vehicle/gate Sub-GHz databases,
bruteforce wordlists — are offensive-security/RF-research tools. Use is the
responsibility of whoever operates the device: check local regulations on
cloning third-party RF/NFC signals and on using BadUSB devices before using
any of these databases outside a controlled or authorized environment.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to propose additions to
the databases, report duplicates that weren't caught, or suggest new
sources.

## License

See [`LICENSE`](LICENSE) — covers only the documentation and organization
files of this repository. Aggregated third-party content keeps its
original licenses (full table in [CONTRIBUTING.md](CONTRIBUTING.md)).
