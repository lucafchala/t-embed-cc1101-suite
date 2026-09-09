# Documentacao/ (Documentation)

Official LilyGO datasheets, schematics, and reference material for the
T-Embed CC1101 board and its components.

## Contents

| File | Description |
|---|---|
| `README-LilyGO-T-Embed-CC1101-oficial.md` | Official README from LilyGO's hardware repository for this board. |
| `hardware-LilyGO-oficial/T-Embed-CC1101 V1.0 24-07-29.pdf` | Full board schematic, revision V1.0. |
| `hardware-LilyGO-oficial/CC1101 20250206 TO XY.pdf` | CC1101 transceiver module datasheet/schematic (Sub-GHz). |
| `hardware-LilyGO-oficial/cc1101.pdf` | CC1101 chip datasheet (Texas Instruments). |
| `hardware-LilyGO-oficial/cc1101-shield.pdf` | CC1101 shield/module reference. |
| `hardware-LilyGO-oficial/PN532_C1.pdf` | PN532 NFC module datasheet. |
| `hardware-LilyGO-oficial/bq25896.pdf` | BQ25896 PMIC/charger datasheet. |
| `hardware-LilyGO-oficial/bq27220_datasheet.pdf`, `bq27220_technical.pdf` | BQ27220 fuel gauge datasheet and technical manual. |
| `hardware-LilyGO-oficial/CC1101_pin.png` | CC1101 module pinout. |
| `hardware-LilyGO-oficial/SI446X/` | Datasheets and schematics for the alternative SI4463 transceiver (board variant using SI446X instead of CC1101), including associated RF components (SKY13416, SKY13575). |
| `hardware-LilyGO-oficial/image/` | Badges and images used in the official documentation (Arduino, PlatformIO, VS Code). |
| `hardware-LilyGO-oficial/tool/nfc-tools-8-12.apk` | Android app for reading/writing NFC tags, useful for testing Bruce's NFC databases. |

## Source

- Source: [Xinyuan-LilyGO/T-Embed-CC1101](https://github.com/Xinyuan-LilyGO/T-Embed-CC1101)
- License: as per LilyGO's official repository (check upstream before redistributing).

## Usage

This folder is reference material for anyone developing custom firmware or
needing to understand the hardware (pinout, RF components, power). It is not
required for normal use of the device with the pre-built Bruce firmware installed via the Launcher.
