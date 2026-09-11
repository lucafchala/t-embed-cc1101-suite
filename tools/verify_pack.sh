#!/usr/bin/env bash
# verify_pack.sh — Completeness checker for the T-Embed CC1101 Plus SD-card pack
#
# Usage:  ./tools/verify_pack.sh [path-to-SD_Card_T-Embed]
#
# Checks:
#   1. Mandatory official Bruce files are present (the ones shipped by
#      BruceDevices/firmware sd_files and required by the docs).
#   2. Every documented folder exists and prints its actual file count
#      (so README tables can be kept in sync).
#   3. Prints totals (file count + size) for the whole pack.
#   4. Cross-checks against expected counts from the README table if present
#      (values set below — update them whenever README.md counts change).
#
# Exit code: 0 if all mandatory files exist, 1 otherwise.

set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SD_DIR="${1:-$REPO_DIR/SD_Card_T-Embed}"

# ---- 1. Official files that MUST ship with the pack (relative to SD_DIR) ----
MANDATORY_FILES=(
  "README.md"
  "README.en.md"
  "esp32_serial_navigator.html"                     # PC-side WebSerial tool (root)
  "interpreter_js_apps/xFlipper.js"                 # JS interpreter app (→ /BruceJS)
  "pwnagotchi/pwngridspam.txt"                         # Pwnagotchi ambient spam faces
  "reverseshell/README.md"                             # Reverse-shell (BruceC2) usage
  "ssid_list/ssid_list.txt"                            # Karma SSID list → SD root
  "ssid_list/readme.txt"                               # official usage note
)

# ---- Expected counts per folder (mirror the table in SD_Card_T-Embed/README.md) --
# FOLDER_NAMES and EXPECTED_COUNTS must stay in sync and be updated together.
FOLDER_NAMES=(
  "UniversalIR"
  "UniversalRF"
  "BadUSB_BlueDucky"
  "nfc"
  "themes"
  "wifi_portals"
  "interpreter_js_apps"
  "subghz_extra_dbs"
  "ir_extra_dbs"
  "badusb_extra_payloads"
  "music_rtttl"
  "pwnagotchi"
  "reverseshell"
  "ssid_list"
)
EXPECTED_COUNTS=(829)   # values refreshed below after each recheck
# Real values are computed; expected table lives in README.md only.
# If you want a hard cross-check, add counts here, e.g.:
EXPECTED_COUNTS=(829 2052 3 5344 96 43 62 14088 16813 3033 11196 1 1 2)

missing=0
echo "== Mandatory files =="
for f in "${MANDATORY_FILES[@]}"; do
  if [[ -f "$SD_DIR/$f" ]]; then
    printf "   OK   %s\n" "$f"
  else
    printf "  MISS  %s\n" "$f"
    CHECK=1
  fi
done
echo

echo "== Per-folder file counts ($SD_DIR) =="
total=0
for i in "${!FOLDER_NAMES[@]}"; do
  d="${FOLDER_NAMES[$i]}"
  if [[ -d "$SD_DIR/$d" ]]; then
    c=$(find "$SD_DIR/$d" -type f | wc -l)
    total=$((total + c))
    exp="${EXPECTED_COUNTS[$i]:-?}"
    note=""
    if [[ "$exp" != "?" && "$c" -ne "$exp" ]]; then
      note="  (README says $exp — out of sync!)"
      CHECK=1
    fi
    printf "  %-24s %6d files%s\n" "$d" "$c" "$note"
  else
    printf "  %-24s  MISSING directory\n" "$d"
    CHECK=1
  fi
done

echo
printf "== Totals: %d files across %d folders ==\n" "$total" "${#FOLDER_NAMES[@]}"
echo
du -sh "$SD_DIR"
echo

# Zero-byte files are suspicious (corrupted download / bad extraction)
empty=$(find "$SD_DIR" -type f -size 0 | wc -l)
if [[ "$empty" -gt 0 ]]; then
  echo "WARNING: $empty zero-byte file(s) present:"
  find "$SD_DIR" -type f -size 0 -printf "  %p\n"
  CHECK=1
fi

echo
if [[ "${CHECK:-0}" -eq 0 ]]; then
  echo "PASS: pack looks complete and consistent."
else
  echo "FAIL: see issues above."
fi
exit "${CHECK:-0}"
