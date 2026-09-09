# lilygo — Suíte T-Embed CC1101 Plus (Bruce via Launcher)

[

![Placa](https://img.shields.io/badge/placa-LilyGO%20T--Embed%20CC1101%20Plus-blue)

](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main)
[

![Firmware](https://img.shields.io/badge/firmware-Bruce%20(via%20bmorcelli%2FLauncher)

-green)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main)
[

![Licença mista](https://img.shields.io/badge/license%C3%A7a-mista%20(ver%20abaixo)

-yellow)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main)

*[Read in English](README.en.md)*

Coleção organizada de banco de dados de SD card para a placa **LilyGO T-Embed
CC1101 Plus**, rodando o firmware **[Bruce](https://github.com/BruceDevices/firmware)**
oficial instalado através do **[bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)**.

Este repositório é uma **curadoria e reorganização** de várias fontes públicas do
GitHub — não é código original. Veja [Proveniência e licenças](#proveniência-e-licenças) antes de redistribuir qualquer parte dele.

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
> LilyGO, etc.), não só no T-Embed CC1101. As únicas exceções são `themes/`
> e eventuais imagens de boot, que podem depender da resolução de tela
> específica de cada placa.

## Quickstart — instalando o Launcher e o Bruce

1. Conecte o T-Embed via USB-C. Se a placa não for reconhecida no Windows,
instale o driver USB-serial CH9102 direto da [página oficial WCH](https://www.wch.cn/downloads/CH343SER_EXE.html)
ou do [repositório da LilyGO](https://github.com/Xinyuan-LilyGO/CH9102_Driver).
2. Grave o **Launcher** (não o Bruce diretamente) usando o
[Launcher Flasher oficial](https://bmorcelli.github.io/Launcher/) — sempre
serve a versão mais recente, sem precisar baixar nada manualmente.
3. No menu do Launcher, abra a galeria OTA embutida e instale o **Bruce** a
partir dela (também sempre a versão mais recente).
4. Copie **todo o conteúdo** de [`SD_Card_T-Embed/`](SD_Card_T-Embed/README.md)
(os arquivos, não a pasta em si) para a raiz de um cartão microSD FAT32.
5. Insira o cartão e ligue a placa — o Bruce deve bootar com acesso aos
bancos de dados extras.

> ⚠️ **Se sua placa é a variante Plus (como a documentada aqui)**: há um bug
> conhecido e ainda sem correção de SD card não montando ao rodar via
> Launcher. Veja o aviso completo no [issue #411 do Launcher](https://github.com/bmorcelli/Launcher/issues/411)
> antes de gastar tempo debugando um cartão "com defeito".

> ℹ️ **Flash via linha de comando**: se preferir esptool em vez dos web
> flashers, ele está documentado em [espressif/esptool](https://github.com/espressif/esptool) —
> não é vendorizado aqui, já que os web flashers do Launcher/Bruce cobrem o
> fluxo normal sem precisar de instalação local.

## Estrutura do repositório

```
lilygo/
├── SD_Card_T-Embed/             → conteúdo a copiar para a raiz do cartão SD
│   ├── UniversalIR/             → banco IR (curado)
│   ├── UniversalRF/             → banco RF (curado)
│   ├── BadUSB_BlueDucky/        → payloads Ducky Script
│   ├── nfc/                     → tags NFC/RFID (Amiibo + comunidade)
│   ├── themes/                  → temas de interface
│   ├── interpreter_js_apps/     → apps/scripts para o interpretador JS do Bruce
│   ├── subghz_extra_dbs/        → bancos Sub-GHz extras, por categoria
│   ├── ir_extra_dbs/            → bancos IR extras, por categoria
│   ├── badusb_extra_payloads/   → payloads BadUSB extras
│   └── music_rtttl/             → músicas RTTTL (.txt) pro player de áudio do Bruce
├── CONTRIBUTING.md
├── LICENSE
├── README.md / README.en.md
```

> Firmware (Launcher/Bruce), drivers, esptool, bibliotecas de desenvolvimento
> e documentação de hardware **não são vendorizados** neste repositório —
> ficam desatualizados rápido e a fonte oficial já resolve isso melhor. Veja
> os links na seção [Quickstart](#quickstart--instalando-o-launcher-e-o-bruce) acima.

Cada pasta principal tem seu próprio `README.md` com detalhes, contagem de
arquivos e origem: [`SD_Card_T-Embed/README.md`](SD_Card_T-Embed/README.md).

## Proveniência e licenças

Este repositório **agrega conteúdo de múltiplos repositórios GitHub de terceiros**,
cada um com sua própria licença. Nenhuma licença única cobre o conjunto todo.
Antes de redistribuir, usar comercialmente, ou enviar PRs upstream, confira a
licença original de cada fonte — a tabela completa de origem por pasta está em
[`CONTRIBUTING.md`](CONTRIBUTING.md#proveniência-detalhada-por-pasta) e
repetida no README de cada subpasta.

Resumo das fontes principais:

| Componente                          | Fonte                                                                             | Licença original                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Firmware Bruce                      | [BruceDevices/firmware](https://github.com/BruceDevices/firmware)                 | AGPL-3.0                                                                                     |
| Launcher                            | [bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)                       | Ver repositório                                                                              |
| Bancos Sub-GHz/IR/NFC/BadUSB extras | Múltiplos repositórios da comunidade Flipper Zero / Bruce                         | Variadas — ver [CONTRIBUTING.md](CONTRIBUTING.md) |
| Documentação de hardware da placa   | [Xinyuan-LilyGO/T-Embed-CC1101](https://github.com/Xinyuan-LilyGO/T-Embed-CC1101) | Ver repositório original                                                                     |

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
