# lilygo — Suíte T-Embed CC1101 Plus (Bruce via Launcher)

[![Placa](https://img.shields.io/badge/placa-LilyGO%20T--Embed%20CC1101%20Plus-blue)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main) [![Firmware](https://img.shields.io/badge/firmware-Bruce%20%28via%20bmorcelli%2FLauncher%29-green)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main) [![Licença mista](https://img.shields.io/badge/licen%C3%A7a-mista%20%28ver%20abaixo%29-yellow)](https://github.com/lucafchala/t-embed-cc1101-suite/blob/main)

*[Read in English](README.en.md)*

## 🔗 Links úteis

| Ferramenta | Link | Pra quê serve |
|---|---|---|
| Launcher Web Flasher (recomendado) | [bmorcelli.github.io/Launcher](https://bmorcelli.github.io/Launcher/) | Grava o Launcher direto pelo navegador — fluxo usado neste repositório |
| Bruce Web Flasher | [bruce.computer/flasher](https://bruce.computer/flasher) | Instala o Bruce direto pelo navegador, sem passar pelo Launcher |
| Bruce Theme Builder | [bruce.computer/build_theme.html](https://bruce.computer/build_theme.html) | Cria/customiza temas de interface pro Bruce |
| Driver CH9102 (WCH oficial) | [wch.cn](https://www.wch.cn/downloads/CH343SER_EXE.html) | Driver USB-serial, necessário no Windows se a placa não for reconhecida |
| Driver CH9102 (mirror LilyGO) | [Xinyuan-LilyGO/CH9102_Driver](https://github.com/Xinyuan-LilyGO/CH9102_Driver) | Mesmo driver, redistribuído pela LilyGO |
| esptool | [espressif/esptool](https://github.com/espressif/esptool) | Flash via linha de comando, alternativa aos flashers web |
| CapibaraZero Web-Flasher | [flash.capibarazero.com](https://flash.capibarazero.com/) | Instalador do firmware alternativo CapibaraZero (não é o Bruce — fora do escopo deste repositório, link só de referência) |

Coleção organizada de banco de dados de SD card para a placa **LilyGO T-Embed
CC1101 Plus**, rodando o firmware **[Bruce](https://github.com/BruceDevices/firmware)**
oficial instalado através do **[bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)**.

Este repositório é uma **curadoria e reorganização** de várias fontes públicas do
GitHub — não é código original. Veja [Proveniência e licenças](#proveniência-e-licenças) antes de redistribuir qualquer parte dele.

**~56.841 arquivos, ~1,1 GB** de bancos de dados IR/Sub-GHz/NFC/BadUSB/música,
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

> ⚠️ **FAT32 vs exFAT**: o Bruce/ESP32 só lê cartões formatados em FAT32.
> Cartões acima de 32GB costumam vir formatados de fábrica em exFAT, o que
> causa falha de montagem silenciosa (a placa liga, mas não enxerga o
> cartão). Se o seu SD tiver mais de 32GB, reformate-o em FAT32 (no
> Windows, o formatador padrão recusa FAT32 acima de 32GB — use uma
> ferramenta como o [guiformat](http://ridgecrop.co.uk/index.htm?guiformat.htm)
> ou `mkfs.vfat -F 32` no Linux/macOS) antes de copiar o conteúdo.

> ⚠️ **Se sua placa é a variante Plus (como a documentada aqui)**: pode
> ocorrer um bug de SD card não montando ao rodar via Launcher. Veja o
> aviso completo no [issue #411 do Launcher](https://github.com/bmorcelli/Launcher/issues/411)
> (**fechada** — confira o motivo do fechamento antes de assumir que sua
> versão já tem a correção) antes de gastar tempo debugando um cartão "com
> defeito".

> ℹ️ **Flash via linha de comando**: se preferir esptool em vez dos web
> flashers, ele está documentado em [espressif/esptool](https://github.com/espressif/esptool) —
> não é vendorizado aqui, já que os web flashers do Launcher/Bruce cobrem o
> fluxo normal sem precisar de instalação local.

## Estrutura do repositório

```
lilygo/
├── SD_Card_T-Embed/             → conteúdo a copiar para a raiz do cartão SD
│   ├── esp32_serial_navigator.html → ferramenta PC-side (Web Serial) p/ navegar o Bruce por USB
│   ├── UniversalIR/             → banco IR (curado)
│   ├── UniversalRF/             → banco RF (curado)
│   ├── BadUSB_BlueDucky/        → payloads Ducky Script
│   ├── nfc/                     → tags NFC/RFID (Amiibo + comunidade)
│   ├── themes/                  → temas de interface
│   ├── interpreter_js_apps/     → apps/scripts para o interpretador JS do Bruce
│   ├── subghz_extra_dbs/        → bancos Sub-GHz extras, por categoria
│   ├── ir_extra_dbs/            → bancos IR extras, por categoria
│   ├── badusb_extra_payloads/   → payloads BadUSB extras
│   ├── wifi_portals/            → templates de portal cativo (evil portal) para o Wi-Fi do Bruce
│   ├── music_rtttl/             → músicas RTTTL (.txt) pro player de áudio do Bruce
│   ├── pwnagotchi/              → rostos/nomes de spam pro PwnGrid do modo Pwnagotchi
│   ├── reverseshell/            → doc de uso do Reverse Shell / BruceC2 embutido no Bruce
│   └── ssid_list/               → lista de SSIDs pro Enhanced Karma
├── Launcher/                    → guia de instalação do bmorcelli/Launcher (sem binário vendorizado)
├── tools/                       → scripts de manutenção do repositório (ex.: verify_pack.sh)
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
wordlists de bruteforce, o Reverse Shell/BruceC2 (`reverseshell/`) e a
lista de SSID do Enhanced Karma (`ssid_list/`) — são ferramentas de
segurança ofensiva/pesquisa em RF. O uso é de responsabilidade de quem
opera o dispositivo: verifique a legislação local sobre clonagem de
sinais RF/NFC de terceiros, uso de dispositivos BadUSB e execução remota
de comando antes de utilizar qualquer um desses bancos fora de um
ambiente controlado ou autorizado. Detalhes de cada um em
[`SD_Card_T-Embed/README.md`](SD_Card_T-Embed/README.md#aviso-de-uso).

## Créditos

Este repositório não existiria sem o trabalho de dezenas de
desenvolvedores e comunidades open-source. A tabela completa de
proveniência pasta-por-pasta (com licença de cada fonte) está em
[CONTRIBUTING.md](CONTRIBUTING.md#proveniência-detalhada-por-pasta) —
esta seção é o resumo com nome/crédito de cada autor.

**Firmware e ferramentas de base**

- **[BruceDevices/firmware](https://github.com/BruceDevices/firmware)**
  (antigo `pr3y/Bruce`) — o firmware em si, sobre o qual todo o resto
  deste repositório é construído.
- **[bmorcelli/Launcher](https://github.com/bmorcelli/Launcher)** —
  launcher OTA usado no fluxo de instalação recomendado aqui.
- **[LilyGO](https://github.com/Xinyuan-LilyGO)** — fabricante da placa
  T-Embed CC1101 Plus; documentação de hardware e driver USB-serial
  redistribuído.
- **[espressif/esptool](https://github.com/espressif/esptool)** —
  ferramenta de flash via linha de comando.
- **WCH** — driver USB-serial CH9102, oficial do fabricante do chip.

**Bancos de dados e conteúdo curado** (por usuário/organização de
origem, ordem alfabética — ver CONTRIBUTING.md para a atribuição
completa por pasta e a licença de cada uma):

[AmiiboDB](https://github.com/AmiiboDB) ·
[anonimoKali](https://github.com/anonimoKali) ·
[badgib](https://github.com/badgib) ·
[Batcherss](https://github.com/Batcherss) ·
[Borys-esp](https://github.com/Borys-esp) ·
[DRA6N](https://github.com/DRA6N) ·
[flipperdevices](https://github.com/flipperdevices) ·
[I-Am-Jakoby](https://github.com/I-Am-Jakoby) ·
[Jiggyv3](https://github.com/Jiggyv3) ·
[koua29](https://github.com/koua29) ·
[LNRC](https://github.com/LNRC) ·
[Lucaslhm](https://github.com/Lucaslhm) ·
[magikh0e](https://github.com/magikh0e) ·
[michauMiau](https://github.com/michauMiau) ·
[niltefa](https://github.com/niltefa) ·
[nortakales](https://github.com/nortakales) ·
[OnChainTemplars](https://github.com/OnChainTemplars) ·
[pfefferle](https://github.com/pfefferle) ·
[Robbbbbbbbb](https://github.com/Robbbbbbbbb) ·
[sasiplavnik](https://github.com/sasiplavnik) ·
[sealldeveloper](https://github.com/sealldeveloper) ·
[Senape3000](https://github.com/Senape3000) ·
[sloth632](https://github.com/sloth632) ·
[Starvinci](https://github.com/Starvinci) ·
[ssstee](https://github.com/ssstee) ·
[UberGuidoZ](https://github.com/UberGuidoZ) ·
[V0lk3n](https://github.com/V0lk3n) ·
[wendells01](https://github.com/wendells01) ·
[Zero-Sploit](https://github.com/Zero-Sploit)

Além destes: colaborador **"sark"**, autor de três coleções de
controles IR universais — fonte original não identificada apesar de
pesquisa dedicada (nomes de pasta só foram padronizados nesta
curadoria; ver nota em CONTRIBUTING.md).

**Curadoria, documentação e verificação técnica**

A organização, deduplicação por hash, documentação (avisos de
segurança/legal, correção de links, contagens de arquivo) e
verificação técnica deste repositório (leitura direta do código-fonte
do Bruce para mapear compatibilidade de BadUSB, checagem de alegações
contra fontes primárias, auditoria de colisão de nomes FAT32) foram
feitas com assistência de IA (Claude, da Anthropic), sob supervisão e
decisão final do mantenedor humano ([lucafchala](https://github.com/lucafchala))
em cada etapa — nenhuma inclusão, remoção ou classificação de conteúdo
sensível foi automática ou não revisada.

## Contribuindo

Veja [`CONTRIBUTING.md`](CONTRIBUTING.md) para como propor adições aos bancos de
dados, reportar duplicatas não removidas, ou sugerir novas fontes.

## Licença

Ver [`LICENSE`](LICENSE) — cobre apenas os arquivos de documentação e organização
deste repositório. O conteúdo agregado de terceiros mantém suas licenças originais
(tabela completa em [CONTRIBUTING.md](CONTRIBUTING.md)).
