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
| [`nfc/`](#nfc) | 8.007 | Tags NFC/RFID (Amiibo, Tonies, dicionários Mifare, tags de brincadeira, comunidade, Skylanders/LEGO) |
| [`themes/`](#themes) | 410 | Temas de interface |
| [`wifi_portals/`](#wifi_portals) | 42 | Templates de simulação de captura de credencial (captive portal) |
| [`interpreter_js_apps/`](#interpreter_js_apps) | 73 | Apps/scripts para o interpretador JS do Bruce |
| [`subghz_extra_dbs/`](#subghz_extra_dbs) | 14.086 | Bancos Sub-GHz extras, por categoria |
| [`ir_extra_dbs/`](#ir_extra_dbs) | 16.825 | Bancos IR extras, por categoria |
| [`badusb_extra_payloads/`](#badusb_extra_payloads) | 3.316 | Payloads BadUSB extras |
| [`music_rtttl/`](#music_rtttl) | 11.195 | Músicas em formato RTTTL (texto `.txt`) para o player de áudio do Bruce |

Total: **56.841 arquivos**, ~1,1 GB.

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
| `Skylanders_LEGO_Toys/` | 784 dumps NFC de figuras Skylanders + 2 scripts geradores de chave criptográfica por UID (Skylanders/Disney Infinity) | [sealldeveloper/FlipperSkylanders](https://github.com/sealldeveloper/FlipperSkylanders), [LNRC/Flipper-Infinity-Skylanders](https://github.com/LNRC/Flipper-Infinity-Skylanders) |

Total: 8.007 arquivos.

> **Aviso — `UberGuidoZ_H10301_RFID_Bruteforce/`**: diferente do resto
> desta pasta (dumps/replay de tags específicas), este é um bruteforcer
> de **controle de acesso físico** (cartões HID H10301, Wiegand 26-bit) —
> testa sistematicamente combinações de credencial contra uma leitora
> real. Categoria: **controle de acesso físico, fuzzing/brute force
> ativo, uso somente em teste autorizado**. Não é equivalente aos dumps
> NFC normais desta pasta.
>
> **A wordlist `H10301_BF.txt` (112MB) não está incluída** — excede o
> limite de 100MB por arquivo do GitHub e, mais importante, se encaixa
> na mesma política já aplicada a rockyou.txt/openwall.txt neste
> repositório: wordlists grandes de bruteforce não são vendorizadas por
> tamanho e por serem fáceis de obter separadamente. Só o `ReadMe.md`
> da pasta original foi mantido, documentando o que ela continha.

## themes/

Temas de interface para o Bruce:

- `README.md`, `Theme_Builder.html`, `example/` — material oficial do Bruce
- `Bruce-Themes_community/` — temas extras da comunidade ([anonimoKali/Bruce-Themes](https://github.com/anonimoKali/Bruce-Themes))
- `Bruce-Themes_wendells01/` — 3 temas extras ("Orange - Akkok", "Orange - Tsoucky", "Flipper inspired black theme") + animações de boot pro T-Embed e M5Stick ([wendells01/Bruce-Themes](https://github.com/wendells01/Bruce-Themes))
- `Pwnagotchi_theme_pfefferle/` — tema com estética inspirada no Pwnagotchi, com ícones próprios pros módulos do Bruce (wifi, ble, rf, ir, nfc, gps etc.); confirma compatibilidade com Cardputer, M5StickC Plus2 e CYD ([pfefferle/bruce-pwnagotchi-theme](https://github.com/pfefferle/bruce-pwnagotchi-theme))
- `koua29_community/` — 2 conjuntos de temas feitos especificamente para a tela 320×170 do T-Embed CC1101: "HUD" (3 variações de cor) e "Wheel" (roda radial, claro/escuro) ([koua29](https://github.com/koua29))

Total: 410 arquivos. **Esta é uma das únicas pastas que pode depender da
placa específica** (resolução de tela) — confira compatibilidade antes de
aplicar um tema feito para outro hardware.

## wifi_portals/

Templates de **simulação de captura de credencial** (a técnica é comumente
apelidada de "Evil Portal", mas o nome descreve melhor o que o template
realmente faz: imitar a tela de login de um serviço real pra capturar o
que for digitado nela). Oficiais do Bruce, em duas línguas:

- `en/` — facebook, google, instagram, microsoft, router_update (5 páginas)
- `pt-br/` — as mesmas 5 páginas em português
- `router_login_batcherss/` — 22 templates de tela de login de roteador por marca (TP-LINK, Xiaomi, Asus, Mercusys, Keenetic, Huawei, Tenda, Mikrotik, Netis), em variantes Bruce e Marauder ([Batcherss/evil-portal-html](https://github.com/Batcherss/evil-portal-html))
- `fake_login_borys/` — 7 templates de login falso de serviços conhecidos (Apple ID, Facebook, Google, T-Mobile, etc.) ([Borys-esp/EvilPortal_DB](https://github.com/Borys-esp/EvilPortal_DB))

Total: 42 arquivos.

> **Aviso**: estes templates simulam páginas de login de serviços reais.
> Use apenas em testes de segurança autorizados ou ambientes controlados —
> nunca contra terceiros sem consentimento. Copiar o cartão inteiro sem
> revisar o conteúdo pode carregar essas páginas sem perceber.

### Definindo o nome do AP a partir do próprio HTML

O sistema de captive portal do Bruce suporta definir o nome do Access
Point direto num comentário na **primeira linha** do arquivo HTML do
template, em vez de digitar o nome toda vez que for usar:

```html
<!-- AP="NomeDoSeuAP" -->
<!DOCTYPE html>
...
```

Se a tag não estiver presente, o Bruce pergunta o nome do AP normalmente
(comportamento padrão, nenhum template precisa dela). Vale pra qualquer
template desta pasta, não só um em específico.

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
- `ProtoPirate.js` — decodificador multi-protocolo de chaveiro/controle de carro ([Senape3000/ProtoPirate-Bruce](https://github.com/Senape3000/ProtoPirate-Bruce))
- `App_Store.js` — launcher/loja de apps dentro do próprio interpretador JS ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `rename-catch.js` — utilitário de renomear/organizar arquivos ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `rf_433_replay.js` — replay de sinais Sub-GHz 433MHz ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `ir_brute_force.js`, `rf_brute_nmrf.js` — implementações alternativas de bruteforce IR/Sub-GHz, mesma função de `ir_brute.js`/`rf_brute.js` (oficiais) mas código próprio ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store))
- `browser_OnChainTemplars.js`, `cryptocurrencies_OnChainTemplars.js` — implementações alternativas de navegador web e cotação de criptomoedas, mesma função de `crypto-prices.js` já incluído (não há navegador oficial equivalente) ([OnChainTemplars/bruce-apps](https://github.com/OnChainTemplars/bruce-apps), GPL-3.0)
- `rf_jammer.js` — ferramenta de jamming ativo de RF ([Jiggyv3/Bruce-App-Store](https://github.com/Jiggyv3/Bruce-App-Store)); adicionado diretamente pelo mantenedor do repositório, fora do processo de curadoria por hash acima
- `BruceSafe.js` — jogo feito especificamente para o T-Embed ([ssstee/BruceSafe](https://github.com/ssstee/BruceSafe))
- `BruteRF.js` — ferramenta de bruteforce Sub-GHz com 34 protocolos, ataque De Bruijn, modo RAW ([Senape3000/Bruce-JS-Apps](https://github.com/Senape3000/Bruce-JS-Apps))
- `koua29_community/` — 7 apps feitos especificamente para o T-Embed CC1101: detector de câmeras de vigilância (Flock Detector), QR de Wi-Fi, Snake, "safari" de SSID, Breakout, TV-B-Gone, launcher de scripts ([koua29](https://github.com/koua29))

Total: 73 arquivos.

> **⚠️ Aviso sobre `rf_jammer.js`**: diferente do resto do conteúdo desta
> pasta (que lê, testa ou faz replay de sinais), este script transmite
> ativamente ruído de RF pra interferir em outros sinais — o próprio código
> traz aviso de que operar isso é ilegal na maioria das jurisdições, e a
> interferência afeta qualquer receptor na frequência, não só um alvo
> específico. Uso por conta e risco exclusivos de quem opera o dispositivo.

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
`Smart_Home_Remotes`, `Retekess pager system t119`, `Jamming`,
`Car Key Jammer` e `OOK_bruteforce` (as 3 últimas com aviso próprio de uso
abaixo — não são sinais de replay comuns), entre ~65 outras.
Categorias que vieram de fontes distintas com grafias diferentes pro mesmo
nome (ex.: `Ceiling Fans` vs `Ceiling_Fans`) foram mescladas numa pasta só,
com dedup por hash de conteúdo aplicado na própria fusão (arquivo idêntico
em ambas → mantido uma vez; nome igual mas conteúdo diferente → ambos
mantidos, o recém-chegado com um sufixo curto).

Total: 14.086 arquivos únicos (após deduplicação — ver
[Deduplicação](#deduplicação-aplicada)).

> **⚠️ Aviso — `Jamming/` e `Car Key Jammer/`**: diferente do resto desta
> pasta (que lê, testa ou faz replay de sinais individuais), essas duas
> categorias contêm arquivos `RAW_Data` de ruído puro, prontos pra
> transmitir via TX do Bruce sem precisar de nenhum script — cobrindo
> sistematicamente praticamente toda a faixa 300–928 MHz que o CC1101
> transmite. É o mesmo risco já documentado pro [`rf_jammer.js`](#interpreter_js_apps)
> (interferência ativa de RF, ilegal na maioria das jurisdições, afeta
> qualquer receptor na frequência, não só um alvo específico) — só que mais
> fácil de disparar por engano, já que não passa pelo interpretador JS.
> **No Brasil especificamente**: boa parte do conteúdo de portão/carro
> norte-americano nesta suíte opera em 315 MHz, que **não está** entre as
> faixas de radiação restrita permitidas pela Anatel (Resolução 680/2017,
> Anexo I — permitidas 335,4–399,9 MHz, 410–608 MHz e 915–948 MHz).
> Transmitir fora dessas faixas pode configurar atividade clandestina de
> telecomunicação (Lei 9.472/1997, art. 183). Isto não é aconselhamento
> jurídico — confirme a legislação do seu país antes de transmitir
> qualquer coisa.

> **Nota — `Rg/`, `Am_far/`, `Fm_far/`, `Fm_close/`**: 4 pastas com 1
> arquivo `RAW_Data` cada (467,75 MHz e 433,92 MHz OOK/2FSK). Pelo
> conteúdo, parecem gravações de teste de alcance (far/close) — a fonte
> agregada não documenta o propósito exato nem o dispositivo-alvo.
> Mantidas por não haver indicação de que sejam inúteis ou duplicadas,
> mas sem uma categoria clara pra encaixar.

## ir_extra_dbs/

Bancos IR **além** do `UniversalIR/` oficial, reorganizados por
**categoria** (device/uso) da mesma forma que o Sub-GHz.

Fontes agregadas nesta pasta:

| Fonte | Repositório |
|---|---|
| Principal banco IR da comunidade Flipper Zero (TVs, ACs, consoles etc.) | [Lucaslhm/Flipper-IRDB](https://github.com/Lucaslhm/Flipper-IRDB) |
| IR extra da comunidade Bruce | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| Banco IR **oficial** do time do Flipper Zero (mesclado dentro das categorias já existentes, em `<Categoria>/flipperdevices_IRDB/`) | [flipperdevices/IRDB](https://github.com/flipperdevices/IRDB) |
| IR extra independente (pasta `_sasiplavnik_extra/`) | [sasiplavnik/Flipper-IRDB](https://github.com/sasiplavnik/Flipper-IRDB) |
| Controle de vaporizador Arizer XQ2 (pasta `_magikh0e_extra/`) | [magikh0e/FlipperZero_Stuff](https://github.com/magikh0e/FlipperZero_Stuff) |
| 3 coleções extras atribuídas ao colaborador "sark" — controles universais, `IrBegone @sark/` (bloqueio de sinal de TV por ambiente) e `irtobefree @sark/` (eletrônicos diversos) | fonte original não identificada; nomes de pasta padronizados nesta curadoria (grafia `@sark` consistente) |

Categorias notáveis: `TVs`, `ACs`, `Consoles`, `Projectors`, `Cable_Boxes`,
`Box_SetTopBoxes` (nova — set-top boxes majoritariamente de marcas
chinesas/asiáticas: Xiaomi, ZTE, XGIMI, EVPAD, etc., trazida pelo
flipperdevices/IRDB), `Brand_(sorted)` (a mesma coleção organizada por
marca em vez de tipo de dispositivo), entre ~50 outras.

Total: 16.825 arquivos únicos (após deduplicação). Só os arquivos `.ir` do
flipperdevices/IRDB foram trazidos — os `.json`/`.png` de metadado que
acompanham cada dispositivo são específicos da UI do app oficial do
Flipper e não são lidos pelo Bruce.

## badusb_extra_payloads/

Payloads BadUSB **além** do `BadUSB_BlueDucky/` oficial:

| Subpasta | Conteúdo | Fonte |
|---|---|---|
| `I-Am-Jakoby_BadUSB/` | 24 payloads (prank/visual, reconhecimento, e 2 sinalizados por capturarem credenciais — ver aviso e README da pasta) | [I-Am-Jakoby/Flipper-Zero-BadUSB](https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB) |
| `BadUsb-Library/` | Biblioteca organizada por técnica (MITRE ATT&CK) | [Starvinci/BadUsb-Library](https://github.com/Starvinci/BadUsb-Library) |
| `Bruce-Scripts-Heaven_BAD/` | Payloads Ducky Script (Windows/macOS/Linux/Android/iOS) | [sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven) |
| `UberGuidoZ_BadUSB/` | Payloads adicionais (bombs, pranks, recon, exfiltração) não duplicados nas fontes acima | [UberGuidoZ/Flipper](https://github.com/UberGuidoZ/Flipper) |
| `magikh0e_BadUSB/` | 2 payloads de "post-exploitation" (coleta de informações do sistema; criação de conta admin oculta + desativação de firewall) | [magikh0e/FlipperZero_Stuff](https://github.com/magikh0e/FlipperZero_Stuff) |

Total: 3.316 arquivos únicos (após deduplicação e remoção de 3 arquivos
"prank" de ~15MB cada, que eram hexdumps de imagem sem função real).

> **Compatibilidade com o interpretador BadUSB do Bruce**: nem todo
> Ducky Script funciona como está — o Bruce (via `ducky_typer.cpp`)
> suporta Ducky clássico + atalhos de modificador de 1 linha, mas não
> `STRINGLN`/`EXTENSION`/`REM_BLOCK`/`DEFINE` (sintaxe do DuckyScript
> 3.0/Bash Bunny). Em `Bruce-Scripts-Heaven_BAD/`, ~1.211 arquivos já
> funcionam direto (1.187 nativamente + 24 convertidos de `STRINGLN` pra
> `STRING`+`ENTER`, reformatação pura). Os 300 que não funcionam como
> estão foram separados em
> [`Bruce-Scripts-Heaven_BAD/_precisa_edicao_manual/`](badusb_extra_payloads/Bruce-Scripts-Heaven_BAD/_precisa_edicao_manual/README.md)
> pra não ficarem misturados com os prontos pra uso — nada foi excluído,
> só reorganizado e documentado (25 precisam de ajuste manual de sintaxe,
> 275 dependem da `EXTENSION` que o Bruce não implementa). A pasta
> `BadUSB-FalsePhilosopher/` (que tem ~1.000 arquivos incompatíveis por
> motivo diferente — sintaxe/hardware do Bash Bunny/WHID/Malduino/OMG,
> não DuckyScript 3.0) foi mantida exatamente como o autor original
> organizou, sem reestruturação.

> **Correção**: a pasta anterior `Flipper-Zero-BadUSB/` (mesma fonte,
> `I-Am-Jakoby/Flipper-Zero-BadUSB`) só tinha os `README.md`/`.txt` de
> descrição de cada payload — os scripts `.ps1` funcionais nunca haviam
> sido incluídos. Foi substituída por `I-Am-Jakoby_BadUSB/`, que traz o
> conteúdo completo (os mesmos payloads já documentados, agora com o
> script real, mais 3 payloads que não estavam nem documentados:
> `Debug`, `Flip-Rage-PopUps`, `Payloads/Scripts/WifiPasswords.ps1`).

> `magikh0e_BadUSB/` foi adicionado diretamente pelo mantenedor do
> repositório, fora do processo de curadoria por hash acima. São payloads
> BadUSB (HID) que rodam com privilégio de administrador na máquina
> conectada — mesma categoria de risco do resto desta pasta, mas mais
> invasivos que os de recon/replay. Uso só em teste autorizado ou no seu
> próprio equipamento.

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

Total: 11.195 arquivos únicos (após deduplicação interna entre as
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
| IR | Dedup pesado nas fontes originais (30.139 → ~12.825), mais 2.116 duplicatas evitadas ao mesclar o flipperdevices/IRDB (muito dele já cobria os mesmos códigos genéricos/reaproveitados entre marcas) e 572 ao mesclar o sasiplavnik/Flipper-IRDB |
| BadUSB | 316 duplicatas evitadas ao mesclar `UberGuidoZ_BadUSB/` contra o que já existia |
| NFC | 111 duplicatas evitadas ao mesclar `Tonies_NFC/` contra o que já existia |
| Music RTTTL | 264 duplicatas internas evitadas entre as 5 subpastas de origem do UberGuidoZ |
| Temas / Portais / Apps JS | Comparados por hash contra a árvore inteira — 0 duplicatas encontradas nessas fontes (conteúdo genuinamente novo) |

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
| `probonopd/irdb` | Banco de IR grande e ativo, mas em formato `.csv` próprio, não `.ir` — precisaria de conversão pra ser utilizável pelo Bruce/Flipper; fora de escopo por ora |
| Forks idênticos de bancos de IR já incluídos (`sosbgit/Flipper-Zero-IRDB`, `logickworkshop/Flipper-IRDB`, `mahan518/Flipper_IR_Database`, `heytem/Flipper-Zero-IR-DataBase`, `RandomDebugError/irdb`) | Cópias/forks confirmados de fontes já presentes, sem conteúdo próprio — reconferido por hash, zero arquivos novos |
| `Jalapenothedragon/evil-portal-html` | Mesmo conjunto de templates (por marca de roteador) que `Batcherss/evil-portal-html` já incluído, com 2 variantes a menos — reconferido por hash, zero arquivos novos |
| `MuddledBox/FlipperZeroSub-GHz`, `ErikLentz/Flipper-Finds` | Reconferidos por hash a pedido: só metadado de repositório (LICENSE/README) e uma foto (.jpg) eram "novos" — nenhum arquivo de conteúdo real (`.sub`/`.ir`/`.nfc`) que já não estivesse aqui |

`ir_brute_force.js`/`rf_brute_nmrf.js` (Jiggyv3) e `cryptocurrencies.js`/
`browser.js` (OnChainTemplars) foram reconsiderados e **incluídos** — ver
[interpreter_js_apps/](#interpreter_js_apps) acima; são reimplementações
próprias, não duplicatas de fato, e não têm problema de segurança.
`magikh0e/FlipperZero_Stuff` também teve um arquivo `.ir` legítimo
incluído (controle de vaporizador Arizer XQ2) — ver
[ir_extra_dbs/](#ir_extra_dbs). O `rf_jammer.js` e os 2 payloads BadUSB
`magikh0e_BadUSB/` — que este documento recomendava deixar de fora — foram
adicionados diretamente pelo mantenedor do repositório; ver os avisos nas
seções [interpreter_js_apps/](#interpreter_js_apps) e
[badusb_extra_payloads/](#badusb_extra_payloads) acima.

## Aviso de uso

Vários bancos aqui (Sub-GHz de veículos/portões de terceiros, payloads
BadUSB, templates de captive portal, bruteforcers de RFID) são ferramentas
de segurança ofensiva/pesquisa em RF. O uso é de responsabilidade de quem
opera o dispositivo — verifique a legislação local antes de usar fora de
um ambiente controlado ou autorizado.
