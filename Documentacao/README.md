# Documentacao/

Datasheets, esquemáticos e material de referência oficial da LilyGO para a
placa T-Embed CC1101 e seus componentes.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| `README-LilyGO-T-Embed-CC1101-oficial.md` | README oficial do repositório de hardware da LilyGO para esta placa. |
| `hardware-LilyGO-oficial/T-Embed-CC1101 V1.0 24-07-29.pdf` | Esquemático completo da placa, revisão V1.0. |
| `hardware-LilyGO-oficial/CC1101 20250206 TO XY.pdf` | Datasheet/esquemático do módulo transceptor CC1101 (Sub-GHz). |
| `hardware-LilyGO-oficial/cc1101.pdf` | Datasheet do chip CC1101 (Texas Instruments). |
| `hardware-LilyGO-oficial/cc1101-shield.pdf` | Referência do shield/módulo CC1101. |
| `hardware-LilyGO-oficial/PN532_C1.pdf` | Datasheet do módulo NFC PN532. |
| `hardware-LilyGO-oficial/bq25896.pdf` | Datasheet do PMIC/carregador BQ25896. |
| `hardware-LilyGO-oficial/bq27220_datasheet.pdf`, `bq27220_technical.pdf` | Datasheet e manual técnico do fuel gauge BQ27220. |
| `hardware-LilyGO-oficial/CC1101_pin.png` | Pinout do módulo CC1101. |
| `hardware-LilyGO-oficial/SI446X/` | Datasheets e esquemáticos do transceptor alternativo SI4463 (variante da placa que usa SI446X em vez de CC1101), incluindo componentes RF associados (SKY13416, SKY13575). |
| `hardware-LilyGO-oficial/image/` | Badges e imagens usadas na documentação oficial (Arduino, PlatformIO, VS Code). |
| `hardware-LilyGO-oficial/tool/nfc-tools-8-12.apk` | App Android para leitura/gravação de tags NFC, útil para testar os bancos NFC do Bruce. |

## Origem

- Fonte: [Xinyuan-LilyGO/T-Embed-CC1101](https://github.com/Xinyuan-LilyGO/T-Embed-CC1101)
- Licença: conforme o repositório oficial da LilyGO (verificar upstream antes de redistribuir).

## Uso

Esta pasta é referência para quem for desenvolver firmware customizado ou
precisar entender o hardware (pinout, componentes RF, alimentação). Não é
necessária para o uso comum do dispositivo com o Bruce já instalado via Launcher.
