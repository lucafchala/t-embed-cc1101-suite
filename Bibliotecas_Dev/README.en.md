# Bibliotecas_Dev/ (Dev Libraries)

Source code for libraries used to build custom firmware for the T-Embed
CC1101. Only needed if you plan to modify/recompile the firmware — not
required for normal use with Bruce installed via `../Launcher/`.

## Contents

| Folder | Library | Use on the board |
|---|---|---|
| `RadioLib/` | [RadioLib](https://github.com/jgromes/RadioLib) | Communication with the CC1101 transceiver module (Sub-GHz radio) |
| `LVGL/` | [LVGL](https://github.com/lvgl/lvgl) | Graphics library that renders the UI on the device's screen |
| `FastLED/` | [FastLED](https://github.com/FastLED/FastLED) | Addressable LED control (if your hardware variant has them) |

## Source and licenses

| Library | Repository | License |
|---|---|---|
| RadioLib | [jgromes/RadioLib](https://github.com/jgromes/RadioLib) | MIT |
| LVGL | [lvgl/lvgl](https://github.com/lvgl/lvgl) | MIT |
| FastLED | [FastLED/FastLED](https://github.com/FastLED/FastLED) | MIT |

All three are MIT-licensed — free to use, modify, and redistribute as long
as the original license and copyright notice are kept with the source code.

## Note

These libraries were downloaded at the latest repository version as of the
date this suite was organized. If you're building firmware from scratch,
check for a newer release before starting — or use PlatformIO's/Arduino
IDE's library manager instead of this static copy.
