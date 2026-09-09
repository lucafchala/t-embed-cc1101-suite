# Drivers_Windows/

USB-serial driver required on Windows for the PC to recognize the board when
connected via USB-C.

## Contents

| File | Description |
|---|---|
| `CH9102_WIN.EXE` | Driver installer for the CH9102 chip (USB-serial converter used on the T-Embed's USB-C port). |

## Source

- Official source: [Xinyuan-LilyGO/CH9102_Driver](https://github.com/Xinyuan-LilyGO/CH9102_Driver)
- License: proprietary (chip manufacturer, WCH), redistributed by LilyGO.

## When you need it

Only required on Windows, and only if Device Manager doesn't show a COM port
when the board is connected. macOS and Linux generally don't need an
additional driver for the CH9102.

## Installation

1. Run `CH9102_WIN.EXE` as administrator.
2. Reconnect the board via USB-C.
3. Check Device Manager for a new COM port (e.g. `COM5`).
