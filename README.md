# lilygo — Suíte T-Embed CC1101 Plus (Bruce via Launcher)

[![Placa](https://img.shields.io/badge/placa-LilyGO%20T--Embed%20CC1101%20Plus-blue)]()
[![Firmware](https://img.shields.io/badge/firmware-Bruce%20(via%20bmorcelli%2FLauncher)-green)]()
[![Licença mista](https://img.shields.io/badge/licença-mista%20(ver%20abaixo)-yellow)]()

*[Read in English](README.en.md)*

Coleção organizada de banco de dados de SD card, launcher de firmware,
drivers, ferramentas de flash, documentação de hardware e bibliotecas de
desenvolvimento para a placa **LilyGO T-Embed CC1101 Plus**, rodando o
firmware **[Bruce](https://github.com/BruceDevices/firmware)** oficial
instalado através do **[bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)**.

Este repositório é uma **curadoria e reorganização** de várias fontes públicas do
GitHub — não é código original. Veja [Proveniência e licenças](#proveniência-e-licenças)
antes de redistribuir qualquer parte dele.

**~49.600 arquivos, ~1 GB** de bancos de dados IR/Sub-GHz/NFC/BadUSB/música,
deduplicados por hash de conteúdo e organizados por categoria — veja o
detalhamento completo em [`SD_Card_T-Embed/README.md`](SD_Card_T-Embed/README.md).

## O que é isto

- **T-Embed CC1101 Plus**: placa ESP32-S3 da LilyGO com tela, teclado
  giratório, rádio Sub-GHz CC1101 embutido e leitor de cartão SD — pensada
  para automação de RF/IR/NFC.
- **Bruce**: firmware open-source ([BruceDevices/firmware](https://github.com/BruceDevices/firmware),
  antigo `pr3y/Bruce`) com funcionalidades de IR, Sub-GHz, NFC, BadUSB,
  Wi-Fi e mais, rodando num único dispositivo portátil.
- **Launcher**: em vez de flashar o Bruce diretamente via USB toda vez que
  quiser trocar de firmware, este repositório documenta o fluxo via
  [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher) — um launcher
  que fica gravado permanentemente e instala/atualiza o Bruce (e outros
  firmwares) direto pela galeria OTA embutida, sem precisar de cabo depois
  da instalação inicial.

> **Nota sobre compatibilidade**: apesar do nome do repositório, quase todo
> o conteúdo de `SD_Card_T-Embed/` é **genérico do Bruce** — funciona em
> qualquer placa rodando o firmware (Cardputer, CYD, outras variantes
> LilyGO, etc.), não só no T-Embed CC1101. As únicas exceções são
> `themes/` e eventuais imagens de boot, que podem depender da resolução
> de tela específica de cada placa. Só o `Launcher/` e a parte de
> pinout/hardware em `Documentacao/` são de fato específicos desta placa.

## Quickstart — instalando o Launcher e o Bruce

1. Conecte o T-Embed via USB-C. No Windows, instale o driver em
   [`Drivers_Windows/`](Drivers_Windows/README.md) se a placa não for reconhecida.
2. Grave o **Launcher** (não o Bruce diretamente) seguindo
   [`Launcher/README.md`](Launcher/README.md).
3. No menu do Launcher, abra a galeria OTA embutida e instale o **Bruce**
   a partir dela.
4. Copie **todo o conteúdo** de [`SD_Card_T-Embed/`](SD_Card_T-Embed/README.md)
   (os arquivos, não a pasta em si) para a raiz de um cartão microSD FAT32.
5. Insira o cartão e ligue a placa — o Bruce deve bootar com acesso aos
   bancos de dados extras.

> ⚠️ **Se sua placa é a variante Plus (como a documentada aqui)**: há um bug
> conhecido e ainda sem correção de SD card não montando ao rodar via
> Launcher. Veja o aviso completo em
> [`Launcher/README.md`](Launcher/README.md#-aviso-conhecido--t-embed-cc1101-plus)
> antes de gastar tempo debugando um cartão "com defeito".

## Estrutura do repositório

```
lilygo/
├── Launcher/                    → launcher (bmorcelli/Launcher) — instala o Bruce via galeria OTA
├── SD_Card_T-Embed/             → conteúdo a copiar para a raiz do cartão SD
│   ├── UniversalIR/             → banco IR (curado)
│   ├── UniversalRF/             → banco RF (curado)
│   ├── BadUSB_BlueDucky/        → payloads Ducky Script
│   ├── nfc/                     → tags NFC/RFID (Amiibo + comunidade)
│   ├── themes/                  → temas de interface
│   ├── wifi_portals/            → templates de captive portal
│   ├── interpreter_js_apps/     → apps/scripts para o interpretador JS do Bruce
│   ├── subghz_extra_dbs/        → bancos Sub-GHz extras, por categoria
│   ├── ir_extra_dbs/            → bancos IR extras, por categoria
│   ├── badusb_extra_payloads/   → payloads BadUSB extras
│   └── music_rtttl/             → músicas RTTTL (.txt) pro player de áudio do Bruce
├── Drivers_Windows/             → driver USB-serial CH9102 (Windows)
├── Ferramentas_Flash/           → esptool (CLI de flash Espressif)
├── Documentacao/                → datasheets, esquemáticos, pinout oficiais LilyGO
└── Bibliotecas_Dev/             → RadioLib, LVGL, FastLED (código-fonte)
```

Cada pasta principal tem seu próprio `README.md` com detalhes, contagem de
arquivos e origem. Links diretos:

| Pasta | Conteúdo | Documentação |
|---|---|---|
| `Launcher/` | Launcher que instala o Bruce via galeria OTA | [README](Launcher/README.md) |
| `SD_Card_T-Embed/` | Tudo que vai no cartão SD (bancos IR/RF/NFC, temas, portais, BadUSB) | [README](SD_Card_T-Embed/README.md) |
| `Drivers_Windows/` | Driver USB-serial CH9102 | [README](Drivers_Windows/README.md) |
| `Ferramentas_Flash/` | esptool (CLI de flash) | [README](Ferramentas_Flash/README.md) |
| `Documentacao/` | Datasheets e esquemáticos oficiais LilyGO | [README](Documentacao/README.md) |
| `Bibliotecas_Dev/` | RadioLib, LVGL, FastLED (fonte, para compilar) | [README](Bibliotecas_Dev/README.md) |

## Proveniência e licenças

Este repositório **agrega conteúdo de múltiplos repositórios GitHub de terceiros**,
cada um com sua própria licença. Nenhuma licença única cobre o conjunto todo.
Antes de redistribuir, usar comercialmente, ou enviar PRs upstream, confira a
licença original de cada fonte — a tabela completa de origem por pasta está em
[`CONTRIBUTING.md`](CONTRIBUTING.md#proveniência-detalhada-por-pasta) e repetida
no README de cada subpasta.

Resumo das fontes principais:

| Componente | Fonte | Licença original |
|---|---|---|
| Firmware Bruce | [BruceDevices/firmware](https://github.com/BruceDevices/firmware) | AGPL-3.0 |
| Launcher | [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher) | Ver repositório |
| Bancos Sub-GHz/IR/NFC/BadUSB extras | Múltiplos repositórios da comunidade Flipper Zero / Bruce | Variadas — ver [CONTRIBUTING.md](CONTRIBUTING.md) |
| RadioLib | [jgromes/RadioLib](https://github.com/jgromes/RadioLib) | MIT |
| LVGL | [lvgl/lvgl](https://github.com/lvgl/lvgl) | MIT |
| FastLED | [FastLED/FastLED](https://github.com/FastLED/FastLED) | MIT |
| Driver CH9102 | [Xinyuan-LilyGO/CH9102_Driver](https://github.com/Xinyuan-LilyGO/CH9102_Driver) | Proprietário (WCH), redistribuído pela LilyGO |
| esptool | [espressif/esptool](https://github.com/espressif/esptool) | GPL-2.0 |
| Documentação de hardware | [Xinyuan-LilyGO/T-Embed-CC1101](https://github.com/Xinyuan-LilyGO/T-Embed-CC1101) | Ver repositório original |

Este README e os arquivos de documentação (`*.md`) neste repositório podem ser
usados livremente; o conteúdo agregado de terceiros segue suas licenças de origem.

## Aviso de uso

Vários itens aqui — payloads BadUSB, bancos Sub-GHz de veículos e portões,
wordlists de bruteforce — são ferramentas de segurança ofensiva/pesquisa em RF.
O uso é de responsabilidade de quem opera o dispositivo: verifique a legislação
local sobre clonagem de sinais RF/NFC de terceiros e uso de dispositivos BadUSB
antes de utilizar qualquer um desses bancos fora de um ambiente controlado ou
autorizado.

## Contribuindo

Veja [`CONTRIBUTING.md`](CONTRIBUTING.md) para como propor adições aos bancos de
dados, reportar duplicatas não removidas, ou sugerir novas fontes.

## Licença

Ver [`LICENSE`](LICENSE) — cobre apenas os arquivos de documentação e organização
deste repositório. O conteúdo agregado de terceiros mantém suas licenças originais
(tabela completa em [CONTRIBUTING.md](CONTRIBUTING.md)).
