# Launcher/

A firmware launcher that stays permanently flashed on the board and lets
you install/switch other firmwares (Bruce, Marauder, etc.) directly from
its built-in OTA gallery — no USB cable needed after the initial install.

## What goes here

| File | Description |
|---|---|
| `Launcher-lilygo-t-embed-all.bin` | [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher) binary, built from the `lilygo-t-embed-all` profile — covers both the plain T-Embed and the T-Embed CC1101 (it detects which one at boot by probing the BQ25896 PMIC over I2C). This is the binary that needs to be flashed to the board over USB. |

The Bruce firmware itself is **not** downloaded manually — it gets
installed afterward, from inside the Launcher itself, via its OTA gallery.

## Why this flow (Launcher + gallery) instead of flashing Bruce directly

- Flash the Launcher **once** over USB.
- After that, switching firmware (Bruce, Marauder, other supported ones)
  happens right on the device, through the Launcher's OTA gallery — no
  need to reconnect the cable.
- Makes it easier to update Bruce to newer versions without manually
  tracking down the correct `.bin` each time.

## How to install the Launcher

1. Connect the T-Embed via USB-C (install the CH9102 driver first if
   needed — `../Drivers_Windows/`).
2. Flash the Launcher through one of these:
   - Official flasher: [bmorcelli.github.io/Launcher](https://bmorcelli.github.io/Launcher/)
   - M5Burner
   - ESP Web Tools / `esptool` with `Launcher-lilygo-t-embed-all.bin` from
     this folder (address `0x0`)
3. After booting, the Launcher menu should appear on screen.
4. From the Launcher menu, open the **online gallery/catalog** and select
   **Bruce** to install the firmware directly onto the board.

## ⚠️ Known issue — T-Embed CC1101 **Plus**

If your board is the **Plus** variant, there's a reported and **still
unfixed** issue ([Launcher issue #411](https://github.com/bmorcelli/Launcher/issues/411)):
the SD card can fail to mount when running through this Launcher, due to a
shared SPI bus conflict — the CC1101/NRF24 CS pins are left floating or
pulled LOW and lock up the bus the SD card also uses. The same SD card
works fine when Bruce is flashed directly (without the Launcher), which
confirms this is specific to the standard "T-Embed" hardware profile the
Launcher uses, since there's no dedicated profile for the Plus variant.

There's no official fix at this time. If the SD card doesn't mount after
installing Bruce through the Launcher's gallery, this is the likely cause
— not the SD card itself, its formatting, or the copied files. Watch the
linked issue for updates.

## After installing Bruce

Copy the contents of [`../SD_Card_T-Embed/`](../SD_Card_T-Embed/README.en.md)
to the root of a FAT32 microSD card and insert it into the board — the
IR/RF/NFC databases and other extras work the same way regardless of
whether Bruce was installed via the Launcher or flashed directly.
