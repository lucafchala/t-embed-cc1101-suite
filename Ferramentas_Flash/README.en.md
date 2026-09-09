# Ferramentas_Flash/ (Flash Tools)

Espressif's command-line utility for flashing firmware onto ESP32/ESP32-S3
boards, including the T-Embed CC1101.

## Contents

| File | Description |
|---|---|
| `esptool-5.4.0.tar.gz` | Source/package of `esptool`, version 5.4.0 (latest on PyPI at the time this repo was organized). |

## Source

- Source: [espressif/esptool](https://github.com/espressif/esptool)
- License: GPL-2.0

## Installation

```bash
pip install esptool
# or, from this package:
tar -xzf esptool-5.4.0.tar.gz
cd esptool-5.4.0
pip install .
```

## Flashing the Launcher via command line

In this repository, Bruce is installed **from inside the Launcher** (via
its built-in OTA gallery) — it's no longer flashed directly with esptool.
What you flash manually over USB is the **Launcher**, once. See
`../Launcher/README.en.md` for the full flow.

1. Identify the board's serial port:
   - Windows: `COMx` (check Device Manager, after installing the driver in
     `../Drivers_Windows/`)
   - Linux/macOS: `/dev/ttyUSB0`, `/dev/ttyACM0` or similar

2. Flash the Launcher binary (`../Launcher/`):

```bash
esptool.py --chip esp32s3 --port COM5 --baud 921600 write_flash 0x0 \
  Launcher-lilygo-t-embed-all.bin
```

Adjust `--port` to match your system, and the filename to the `.bin`
present in `../Launcher/`. If flashing fails, try lowering `--baud` to
`460800` or hold the board's BOOT button while connecting.

3. After flashing, follow `../Launcher/README.en.md` to install Bruce
   through the OTA gallery, then copy the contents of
   `../SD_Card_T-Embed/` to the root of a microSD card.

## No-command-line alternative

If you'd rather not use a terminal, the [ESP Web Tool](https://esptool-js.espressif.com/)
performs the same flash directly from the browser (Chrome/Edge), no install
needed.
