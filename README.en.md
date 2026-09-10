# lilygo — T-Embed CC1101 Plus Suite (Bruce via Launcher)

[![Board](https://img.shields.io/badge/board-LilyGO%20T--Embed%20CC1101%20Plus-blue)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main) [![Firmware](https://img.shields.io/badge/firmware-Bruce%20%28via%20bmorcelli%2FLauncher%29-green)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main) [![Mixed license](https://img.shields.io/badge/license-mixed%20%28see%20below%29-yellow)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main)

*[Ler em Português](README.md)*

## 🔗 Useful links

| Tool | Link | What it's for |
|---|---|---|
| Launcher Web Flasher (recommended) | [bmorcelli.github.io/Launcher](https://bmorcelli.github.io/Launcher/) | Flashes the Launcher straight from the browser — the flow used in this repository |
| Bruce Web Flasher | [bruce.computer/flasher](https://bruce.computer/flasher) | Installs Bruce straight from the browser, without going through the Launcher |
| Bruce Theme Builder | [bruce.computer/build_theme.html](https://bruce.computer/build_theme.html) | Builds/customizes UI themes for Bruce |
| CH9102 driver (official WCH) | [wch.cn](https://www.wch.cn/downloads/CH343SER_EXE.html) | USB-serial driver, needed on Windows if the board isn't recognized |
| CH9102 driver (LilyGO mirror) | [Xinyuan-LilyGO/CH9102_Driver](https://github.com/Xinyuan-LilyGO/CH9102_Driver) | Same driver, redistributed by LilyGO |
| esptool | [espressif/esptool](https://github.com/espressif/esptool) | Command-line flashing, an alternative to the web flashers |
| CapibaraZero Web-Flasher | [flash.capibarazero.com](https://flash.capibarazero.com/) | Installer for the alternative CapibaraZero firmware (not Bruce — out of scope for this repository, link for reference only) |

Organized SD card content collection for the **LilyGO T-Embed CC1101 Plus**
board, running official **[Bruce](https://github.com/BruceDevices/firmware)**
firmware installed through **[bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)**.

This repository is a **curation and reorganization** of several public GitHub
sources — not original code. See [Provenance and licenses](#provenance-and-licenses)
before redistributing any part of it.

**~53,560 files, ~1.1 GB** of IR/Sub-GHz/NFC/BadUSB/music databases, deduplicated
by content hash and organized by category — see the full breakdown in
[`SD_Card_T-Embed/README.md`](SD_Card_T-Embed/README.md).

## What this is

- **T-Embed CC1101 Plus**: LilyGO ESP32-S3 board with screen, rotary encoder,
built-in CC1101 Sub-GHz radio, and SD card reader — built for RF/IR/NFC
automation.
- **Bruce**: open-source firmware ([BruceDevices/firmware](https://github.com/BruceDevices/firmware),
formerly `pr3y/Bruce`) with IR, Sub-GHz, NFC, BadUSB, Wi-Fi, and more, running
on a single portable device.
- **Launcher**: instead of flashing Bruce directly via USB every time you want
to switch firmware, this repository documents the flow via
[bmorcelli/Launcher](https://github.com/bmorcelli/Launcher) — a launcher that
stays flashed permanently and installs/updates Bruce (and other firmware)
straight from its built-in OTA gallery, no cable needed after the initial
install.

> **Compatibility note**: despite the repository name, almost all content in
> `SD_Card_T-Embed/` is **generic to Bruce** — it works on any board running
> the firmware (Cardputer, CYD, other LilyGO variants, etc.), not just the
> T-Embed CC1101. The only exceptions are `themes/` and some boot images,
> which may depend on each board's specific screen resolution.

## Quickstart — installing Launcher and Bruce

1. Connect the T-Embed via USB-C. If the board isn't recognized on Windows,
install the CH9102 USB-serial driver from the [official WCH page](https://www.wch.cn/downloads/CH343SER_EXE.html)
or from [LilyGO's repository](https://github.com/Xinyuan-LilyGO/CH9102_Driver).
2. Flash **Launcher** (not Bruce directly) using the [official Launcher Flasher](https://bmorcelli.github.io/Launcher/) —
always serves the latest version, no manual download needed.
3. From Launcher's menu, open the built-in OTA gallery and install **Bruce**
from there (also always the latest version).
4. Copy **all the contents** of [`SD_Card_T-Embed/`](SD_Card_T-Embed/README.md)
(the files, not the folder itself) to the root of a FAT32 microSD card.
5. Insert the card and power on the board — Bruce should boot with access to
the extra databases.

> ⚠️ **If your board is the Plus variant (as documented here)**: there's a
> known, still-unfixed bug where the SD card fails to mount when running via
> Launcher. See the full note in [Launcher issue #411](https://github.com/bmorcelli/Launcher/issues/411)
> before spending time debugging a "defective" card.

> ℹ️ **Command-line flashing**: if you prefer esptool over the web flashers,
> it's documented at [espressif/esptool](https://github.com/espressif/esptool) —
> not vendored here, since the Launcher/Bruce web flashers cover the normal
> flow without needing a local install.

## Repository structure

```
lilygo/
├── SD_Card_T-Embed/             → content to copy to the SD card root
│   ├── UniversalIR/             → curated IR database
│   ├── UniversalRF/             → curated RF database
│   ├── BadUSB_BlueDucky/        → Ducky Script payloads
│   ├── nfc/                     → NFC/RFID tags (Amiibo + community)
│   ├── themes/                  → UI themes
│   ├── interpreter_js_apps/     → apps/scripts for Bruce's JS interpreter
│   ├── subghz_extra_dbs/        → extra Sub-GHz databases, by category
│   ├── ir_extra_dbs/            → extra IR databases, by category
│   ├── badusb_extra_payloads/   → extra BadUSB payloads
│   ├── wifi_portals/            → captive-portal (evil portal) templates for Bruce's Wi-Fi
│   └── music_rtttl/             → RTTTL music files (.txt) for Bruce's audio player
├── Launcher/                    → bmorcelli/Launcher install guide (no vendored binary)
├── CONTRIBUTING.md
├── LICENSE
├── README.md / README.en.md
```

> Firmware (Launcher/Bruce), drivers, esptool, development libraries, and
> hardware documentation are **not vendored** in this repository — they go
> stale fast and the official source already handles that better. See the
> links in the [Quickstart](#quickstart--installing-launcher-and-bruce)
> section above.

Each main folder has its own `README.md` with details, file counts, and
provenance: [`SD_Card_T-Embed/README.md`](SD_Card_T-Embed/README.md).

## Provenance and licenses

This repository **aggregates content from multiple third-party GitHub
repositories**, each under its own license. No single license covers the
whole set. Before redistributing, using commercially, or submitting upstream
PRs, check the original license of each source — the full per-folder
provenance table is in [`CONTRIBUTING.md`](CONTRIBUTING.md#detailed-provenance-by-folder)
and repeated in each subfolder's README.

Main sources summary:

| Component                       | Source                                                                            | Original license                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------| ------------------------------------------------------------------------------------------------ |
| Bruce firmware                   | [BruceDevices/firmware](https://github.com/BruceDevices/firmware)                 | AGPL-3.0                                                                                        |
| Launcher                         | [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)                       | See repository                                                                                   |
| Extra Sub-GHz/IR/NFC/BadUSB banks| Multiple repositories from the Flipper Zero / Bruce community                     | Varies — see [CONTRIBUTING.md](CONTRIBUTING.md)                                                  |
| Board hardware documentation     | [Xinyuan-LilyGO/T-Embed-CC1101](https://github.com/Xinyuan-LilyGO/T-Embed-CC1101) | See original repository                                                                          |

This README and the documentation files (`*.md`) in this repository may be
freely used; aggregated third-party content follows its original licenses.

## Usage notice

Several items here — BadUSB payloads, vehicle/gate Sub-GHz banks, bruteforce
wordlists — are offensive security/RF research tools. Use is the operator's
responsibility: check local legislation on cloning third-party RF/NFC signals
and using BadUSB devices before using any of these banks outside a controlled
or authorized environment.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to propose additions to the
databases, report duplicates that weren't removed, or suggest new sources.

## License

See [`LICENSE`](LICENSE) — covers only this repository's documentation and
organization files. Aggregated third-party content keeps its original
licenses (full table in [CONTRIBUTING.md](CONTRIBUTING.md)).
