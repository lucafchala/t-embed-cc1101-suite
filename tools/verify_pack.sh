#!/usr/bin/env bash
# verify_pack.sh — checador de completude do pack SD do T-Embed CC1101 Plus
#
# Uso:  ./tools/verify_pack.sh [caminho-para-sd_card_content]
#
# Checa:
#   1. Arquivos obrigatórios presentes (oficiais do Bruce + os que o próprio
#      repositório adicionou fora da curadoria por hash).
#   2. Cada pasta documentada existe e imprime a contagem real de arquivos
#      (pra manter as tabelas do README sincronizadas).
#   3. Totais (contagem + tamanho) do pack inteiro.
#   4. Cruza contra as contagens esperadas abaixo (atualize sempre que os
#      números do README mudarem — ou depois de qualquer merge/rename).
#
# Código de saída: 0 se tudo bate, 1 se algo precisa de atenção.
#
# NOTA (2026-09, v3): atualizado depois do merge universal_ir -> ir_extra_dbs
# e universal_rf -> subghz_extra_dbs. `universal_rf` saiu da lista (deixou de
# existir, 100% absorvido). `universal_ir` caiu pra ~8 arquivos: layouts.ini
# + os 6 arquivos soltos companheiros dele (audio/ac/tv/projectors/leds/fans.ir,
# dados do recurso "Universal Remote" do Bruce, ainda não implementado -- não
# são remotos de vendor, por isso não entraram no merge) + 1 ReadMe.md ainda
# em revisão manual (conflito não-.ir). Quando isso for resolvido e os
# containers finais forem renomeados (ir_extra_dbs -> ir/, subghz_extra_dbs
# -> rf/), este script precisa de outra atualização -- esperado, é o preço de
# manter isso sincronizado, não um bug.
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SD_DIR="${1:-$REPO_DIR/sd_card_content}"

CHECK=0

MANDATORY_FILES=(
  "README.md"
  "README.en.md"
  "esp32_serial_navigator.html"
  "interpreter_js_apps/xFlipper.js"
  "pwnagotchi/pwngridspam.txt"
  "reverseshell/README.md"
  "ssid_list/ssid_list.txt"
  "ssid_list/readme.txt"
)

FOLDER_NAMES=(
  "universal_ir"
  "badusb_ducky_scripts"
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
EXPECTED_COUNTS=(8 3 8007 410 42 74 15893 16883 3317 11195 1 1 2)

echo "== Arquivos obrigatorios =="
for f in "${MANDATORY_FILES[@]}"; do
  if [[ -f "$SD_DIR/$f" ]]; then
    printf "   OK   %s\n" "$f"
  else
    printf "  FALTA %s\n" "$f"
    CHECK=1
  fi
done

echo
echo "== Contagem de arquivos por pasta ($SD_DIR) =="
total=0
for i in "${!FOLDER_NAMES[@]}"; do
  d="${FOLDER_NAMES[$i]}"
  if [[ -d "$SD_DIR/$d" ]]; then
    c=$(find "$SD_DIR/$d" -type f | wc -l)
    total=$((total + c))
    exp="${EXPECTED_COUNTS[$i]:-?}"
    note=""
    if [[ "$exp" != "?" && "$c" -ne "$exp" ]]; then
      note="  (esperado $exp -- FORA DE SINCRONIA, atualize README ou este script)"
      CHECK=1
    fi
    printf "  %-24s %6d arquivos%s\n" "$d" "$c" "$note"
  else
    printf "  %-24s  PASTA AUSENTE\n" "$d"
    CHECK=1
  fi
done

echo
printf "== Totais: %d arquivos em %d pastas ==\n" "$total" "${#FOLDER_NAMES[@]}"
echo
du -sh "$SD_DIR"
echo

empty=$(find "$SD_DIR" -type f -size 0 | wc -l)
if [[ "$empty" -gt 0 ]]; then
  echo "AVISO: $empty arquivo(s) de 0 bytes encontrados:"
  find "$SD_DIR" -type f -size 0 -printf "  %p\n"
  CHECK=1
fi

echo
if [[ "$CHECK" -eq 0 ]]; then
  echo "PASS: pack parece completo e consistente."
else
  echo "FAIL: ver itens acima."
fi
exit "$CHECK"
