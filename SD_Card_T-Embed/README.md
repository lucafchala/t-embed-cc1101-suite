# SD_Card_T-Embed/

**Copie o conteúdo desta pasta (os arquivos e subpastas, não a pasta em si)
para a raiz de um cartão microSD FAT32** e insira na placa antes de ligá-la
com o Bruce já instalado (via Launcher).

> Apesar do nome da pasta (herdado da placa alvo deste repositório), quase
> todo o conteúdo aqui é **genérico do Bruce** — funciona em qualquer placa
> rodando o firmware, não só no T-Embed CC1101. As únicas exceções são
> `themes/` e eventuais imagens de boot, que podem depender da resolução de
> tela específica de cada placa.

## Visão geral

| Subpasta | Arquivos | Conteúdo |
|---|---|---|
| [`UniversalIR/`](#universalir-e-universalrf) | 829 | Banco IR oficial do Bruce |
| [`UniversalRF/`](#universalir-e-universalrf) | 2.052 | Banco Sub-GHz oficial do Bruce (Garages/Gates/Vehicles) |
| [`BadUSB_BlueDucky/`](#badusb_blueducky) | 3 | Payloads Ducky Script oficiais |
| [`nfc/`](#nfc) | 5.370 | Tags NFC/RFID (Amiibo, Tonies, dicionários Mifare, tags de brincadeira, comunidade) |
| [`themes/`](#themes) | 37 | Temas de interface |
| [`wifi_portals/`](#wifi_portals) | 11 | Templates de captive portal (Evil Portal) |
| [`interpreter_js_apps/`](#interpreter_js_apps) | 52 | Apps/scripts para o interpretador JS do Bruce |
| [`subghz_extra_dbs/`](#subghz_extra_dbs) | 14.115 | Bancos Sub-GHz extras, por categoria |
| [`ir_extra_dbs/`](#ir_extra_dbs) | 12.824 | Bancos IR extras, por categoria |
| [`badusb_extra_payloads/`](#badusb_extra_payloads) | 3.089 | Payloads BadUSB extras |
| [`music_rtttl/`](#music_rtttl) | 11.199 | Músicas em formato RTTTL (texto `.txt`) para o player de áudio do Bruce |

Total: **49.583 arquivos**, ~1 GB.

---

## UniversalIR/ e UniversalRF/

Bancos de dados oficiais que acompanham a release do Bruce — 829 arquivos
IR e 2.052 arquivos RF (organizados em categorias como Garages, Gates,
Vehicles), curados e validados pelos mantenedores do projeto.

- Fonte: [BruceDevices/firmware](https://github.com/BruceDevices/firmware) (release oficial)
- Licença: AGPL-3.0

## BadUSB_BlueDucky/

Payloads Ducky Script oficiais que acompanham o Bruce (3 arquivos,
PT-BR e EN).

- Fonte: [BruceDevices/firmware](https://github.com/BruceDevices/firmware) (release oficial)
- Licença: AGPL-3.0

## nfc/

Tags NFC/RFID de múltiplas fontes, mescladas e deduplicadas por hash de
conteúdo:

| Subpasta | Conteúdo | Fonte |
|---|---|---|
| `AmiiboDB/` | Dump completo de Amiibo (`.bin`/`.nfc`) | [AmiiboDB/Amiibo](https://github.com/AmiiboDB/Amiibo) |
| `Bruce-Scripts-Heaven_RFID/` | Tags RFID da comunidade | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| `Tonies_NFC/` | 738 tags Toniebox (Paw Patrol, Pokémon, DC, National Geographic Kids, etc.), organizadas por idioma/coleção | [nortakales/flipper-zero-tonies](https://github.com/nortakales/flipper-zero-tonies) |
| `UberGuidoZ_Fun_Files/` | Tags NFC de brincadeira (RickRoll, links, easter eggs) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `UberGuidoZ_Mifare_Classic_Dict/` | Dicionários de chaves para cartões Mifare Classic | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `UberGuidoZ_Amiibo_Tools/` | Conversores/ferramentas Amiibo (complementar ao AmiiboDB, não duplicado) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `UberGuidoZ_H10301_RFID_Bruteforce/` | Bruteforcer pro formato de cartão de acesso HID H10301 (Wiegand 26-bit) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |

Total: 5.370 arquivos.

## themes/

Temas de interface para o Bruce:

- `README.md`, `Theme_Builder.html`, `example/` — material oficial do Bruce
- `Bruce-Themes_community/` — temas extras da comunidade ([anonimoKali/Bruce-Themes](https://github.com/anonimoKali/Bruce-Themes))

Total: 37 arquivos. **Esta é uma das únicas pastas que pode depender da
placa específica** (resolução de tela) — confira compatibilidade antes de
aplicar um tema feito para outro hardware.

## wifi_portals/

Templates de Evil Portal / captive portal, oficiais do Bruce, em duas
línguas:

- `en/` — facebook, google, instagram, microsoft, router_update (5 páginas)
- `pt-br/` — as mesmas 5 páginas em português
- `evil portal/readme.md` — instruções de uso

Total: 11 arquivos.

> **Aviso**: estes templates simulam páginas de login de serviços reais.
> Use apenas em testes de segurança autorizados ou ambientes controlados —
> nunca contra terceiros sem consentimento.

## interpreter_js_apps/

Scripts/apps para o interpretador JavaScript embutido do Bruce:

- Jogos: `Snake_Cardputer.js`, `Snake_Stick_CoreS3.js`, `dino_game.js`,
  `pingpong.js`, `space_shooter.js`, `highway_racer.js`, `tamagochi.js`
- Utilitários: `calculator_t-embed.js`, `crypto-prices.js`, `dtmf.js`,
  `ir2keys.js`, `spectrum_t-embed.js`, `timer_background.js`
- Brute-forcers: `ir_brute.js`, `rf_brute.js`, `wifi_brute.js`
- `gifs/` + `gifs.js` — suporte a GIFs na interface
- `BruceScripts_community/` — extras da comunidade ([badgib/BruceScripts](https://github.com/badgib/BruceScripts))
- `js-apps-bruce/` — extras da comunidade ([michauMiau/js-apps-bruce](https://github.com/michauMiau/js-apps-bruce))

Total: 52 arquivos.

## subghz_extra_dbs/

Bancos Sub-GHz **além** do `UniversalRF/` oficial, reorganizados por
**categoria** (device/uso), mesclando todas as fontes numa única árvore e
deduplicando por hash de conteúdo. A proveniência por arquivo individual se
perde na fusão — as fontes agregadas estão listadas abaixo.

Fontes agregadas nesta pasta:

| Fonte | Repositório |
|---|---|
| Coleção "flagship" da comunidade Flipper Zero (Sub-GHz + BadUSB + NFC + Music) | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| Coleção geral de sinais | [Zero-Sploit/FlipperZero-Subghz-DB](https://github.com/Zero-Sploit/FlipperZero-Subghz-DB) |
| Sinais RF da comunidade Bruce | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| Botões de campainha/customer service comercial | [DRA6N/SubGhz_Cust_Serv](https://github.com/DRA6N/SubGhz_Cust_Serv) |
| Sinal de abertura da tampa de carregamento Tesla | [Robbbbbbbbb/tesla-chargeport](https://github.com/Robbbbbbbbb/tesla-chargeport) |
| Pulseiras de LED de evento (protocolo CrowdLED, EN+ES) | [niltefa/Flipper-CrowdLED-Wristbands](https://github.com/niltefa/Flipper-CrowdLED-Wristbands) |

Categorias notáveis: `Garages`, `Gates`, `Vehicles`, `Doorbells`,
`Ceiling_Fans`, `Concert bracelet` (com subpasta `CrowdLED_Wristbands/`),
`Smart_Home_Remotes`, `Retekess pager system t119`, entre ~65 outras.
Algumas categorias têm nomes duplicados com grafias diferentes
(`Ceiling Fans` vs `Ceiling_Fans`) porque vieram de fontes distintas que
nomeavam a mesma coisa de forma diferente — a fusão preserva ambas em vez
de adivinhar qual renomear.

Total: 14.115 arquivos únicos (após deduplicação — ver
[Deduplicação](#deduplicação-aplicada)).

## ir_extra_dbs/

Bancos IR **além** do `UniversalIR/` oficial, reorganizados por
**categoria** (device/uso) da mesma forma que o Sub-GHz.

Fontes agregadas nesta pasta:

| Fonte | Repositório |
|---|---|
| Principal banco IR da comunidade Flipper Zero (TVs, ACs, consoles etc.) | [Lucaslhm/Flipper-IRDB](https://github.com/Lucaslhm/Flipper-IRDB) |
| IR extra da comunidade Bruce | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |

Categorias notáveis: `TVs`, `ACs`, `Consoles`, `Projectors`, `Cable_Boxes`,
`Brand_(sorted)` (a mesma coleção organizada por marca em vez de tipo de
dispositivo), entre ~50 outras.

Total: 12.824 arquivos únicos (após deduplicação).

## badusb_extra_payloads/

Payloads BadUSB **além** do `BadUSB_BlueDucky/` oficial:

| Subpasta | Conteúdo | Fonte |
|---|---|---|
| `Flipper-Zero-BadUSB/` | Payloads da comunidade Flipper Zero | [I-Am-Jakoby/Flipper-Zero-BadUSB](https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB) |
| `BadUsb-Library/` | Biblioteca organizada por técnica (MITRE ATT&CK) | [Starvinci/BadUsb-Library](https://github.com/Starvinci/BadUsb-Library) |
| `Bruce-Scripts-Heaven_BAD/` | Payloads Ducky Script (Windows/macOS/Linux/Android/iOS) | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| `UberGuidoZ_BadUSB/` | Payloads adicionais (bombs, pranks, recon, exfiltração) não duplicados nas fontes acima | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |

Total: 3.089 arquivos únicos (após deduplicação e remoção de 3 arquivos
"prank" de ~15MB cada, que eram hexdumps de imagem sem função real).

> Wordlists de bruteforce (rockyou.txt, openwall.txt etc.) **não estão
> incluídas** neste repositório — são padrão da indústria de segurança e
> fáceis de obter separadamente se você precisar do módulo de bruteforce
> WiFi do Bruce.

## music_rtttl/

Coleção de músicas em formato **RTTTL** (Ring Tone Text Transfer
Language), salvas como arquivos de texto `.txt` — sim, texto mesmo, é o
formato que o player de áudio/buzzer do Bruce lê e toca diretamente no
T-Embed (ou qualquer placa com buzzer/speaker suportado).

Organizada em subpastas alfabéticas (`A/` a `Z/`, mais `0/` e `#/` para
nomes que começam com número/símbolo) e duas categorias extras:
`Arcade/` (temas de jogos NES/PC/arcade) e `NES/`, `PC/` dentro dela.

- Fonte: [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) (pastas `Music_Player/RTTTL_DUMP`, `Original_Files`, `Arcade_Tones`, `Theme_Songs`, `flipnoise`)
- Licença: GPL-3.0

Total: 11.199 arquivos únicos (após deduplicação interna entre as
subpastas de origem — 264 duplicatas removidas).

---

## Deduplicação aplicada

Os bancos extras (Sub-GHz, IR, BadUSB, NFC) vinham com sobreposição entre
fontes (vários projetos redistribuindo o mesmo conteúdo). Foi feita
deduplicação por **hash de conteúdo** (não apenas nome de arquivo) em cada
merge:

| Categoria | Observação |
|---|---|
| Sub-GHz | Dedup pesado nas fontes originais (33.723 → ~14.071), mais dedup incremental ao mesclar CrowdLED (22 duplicatas evitadas) |
| IR | Dedup pesado nas fontes originais (30.139 → ~12.825) |
| BadUSB | 316 duplicatas evitadas ao mesclar `UberGuidoZ_BadUSB/` contra o que já existia |
| NFC | 111 duplicatas evitadas ao mesclar `Tonies_NFC/` contra o que já existia |
| Music RTTTL | 264 duplicatas internas evitadas entre as 5 subpastas de origem do UberGuidoZ |

Dois forks idênticos do mesmo dataset (`techniixdotcom/Bruce-Scripts` e
`0xN0WHERE/BRUCE-FILES`) foram descartados inteiramente por serem cópias
exatas de `sloth632/Bruce-Scripts-Heaven`.

## O que foi considerado e descartado

Alguns itens de nicho pesquisados numa rodada de curadoria **não foram
incluídos** por não se aplicarem a este setup — a maioria porque são
aplicativos compilados especificamente para o firmware/hardware do
**Flipper Zero real** (não o Bruce/ESP32) e não rodam neste dispositivo:

| Item | Motivo |
|---|---|
| T119 Bruteforcer (Retekess pager, `xb8/t119bruteforcer`) | Já estava presente — os mesmos 3 arquivos `.sub` já vieram por outra fonte agregada aqui |
| XRemote (app avançado de IR) | App `.fap` compilado pro firmware/hardware do Flipper Zero, não roda no Bruce/ESP32 |
| Sentry Safe plugin | App `.fap` compilado pro Flipper Zero (usa GPIO específico do hardware STM32 dele) |
| GPS reader (`ezod/flipperzero-gps`) | App `.fap` compilado pro Flipper Zero (`application.fam` = manifesto de app do firmware oficial deles) |
| COM Port Scanner Emulator | Mesma categoria — funcionalidade de emulação USB-HID específica do firmware Flipper Zero |
| Wav_Player (arquivos `.wav` reais, ~2.4GB) | Peso inviável para um repositório GitHub, e boa parte é música com copyright (trilhas reais de artistas) — o `music_rtttl/` cobre o mesmo caso de uso em formato leve e sem essas questões |

## Aviso de uso

Vários bancos aqui (Sub-GHz de veículos/portões de terceiros, payloads
BadUSB, templates de captive portal, bruteforcers de RFID) são ferramentas
de segurança ofensiva/pesquisa em RF. O uso é de responsabilidade de quem
opera o dispositivo — verifique a legislação local antes de usar fora de
um ambiente controlado ou autorizado.
