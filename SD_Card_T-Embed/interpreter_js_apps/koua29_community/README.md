# koua29 — apps JS para Bruce (LilyGO T-Embed CC1101)

Coleção de apps JavaScript do desenvolvedor `koua29`, feitos e testados
especificamente no **LilyGO T-Embed CC1101** — não são ports genéricos de
outro dispositivo.

- **`Flock Detector.js`** (+ `Flock_Detector_sigs.json`) — detector de
  contra-vigilância completo: varre Wi-Fi 2.4 GHz e sinaliza câmeras ALPR
  tipo Flock Safety e câmeras "espiãs" Wi-Fi baratas (AliExpress/Amazon,
  ~119 assinaturas de SSID/OUI — V380, Yoosee, A9, CamHi, EZVIZ, Hikvision,
  Dahua, Reolink, Wyze, Foscam, entre outras), com modelo de confiança em 4
  níveis (CONFIRMED/LIKELY/POSSIBLE/WEAK), modo "LAN scan" pra achar
  câmeras já pareadas na rede (RTSP/ONVIF/portas Dahua/Hikvision), catálogo
  "Cam list" na tela, beep tipo contador Geiger e log em CSV no SD. Passivo
  (só recebe, não faz deauth nem se conecta em nada). Assinaturas extras
  podem ser adicionadas sem reflash, via `flock_sigs.json` na raiz do SD.
- **`WiFi QR.js`** — conecta a uma rede Wi-Fi e mostra um QR code
  escaneável na tela para convidados entrarem sem digitar senha; QR
  gerado localmente no dispositivo (sem PC/internet).
- **`koua29_Snake.js`** — Snake em arcade usando o encoder rotativo,
  níveis com cor/velocidade variável, obstáculos, ranking top-5 salvo no
  cartão SD.
- **`SSID Safari.js`** — "captura" as redes Wi-Fi reais ao redor como
  criaturas determinísticas (cada AP vira um monstro único); estilo
  wardriving + colecionador, 100% procedural, sem imagens.
- **`Breakout.js`** — quebra-bloco colorido com encoder rotativo, layouts
  variáveis, power-ups, blocos reforçados, ranking top-5.
- **`TV-B-Gone.js`** (+ `tvbgone.ir`) — dispara uma base de códigos IR de
  "power off" de várias marcas de TV, com anel de progresso; pode mirar
  todas as marcas ou uma específica.
- **`koua29_Launcher.js`** — launcher/menu de favoritos: varre
  recursivamente `/BruceJS`, `/scripts`, `/BruceScripts` e subpastas,
  agrupa por categoria e roda o script escolhido via `load()`. Útil para
  scripts da App Store que ficam em subpastas e não aparecem no menu
  *Interpreter* padrão. Pode ser configurado como Startup App.

## Fonte

Todos os arquivos vêm de repositórios individuais do
[`koua29`](https://github.com/koua29) no GitHub (um repo por app):
`bruce-flock-detector`, `bruce-wifi-qr`, `bruce-snake`, `bruce-ssid-safari`,
`bruce-breakout`, `bruce-tv-b-gone`, `bruce-launcher`. Nenhum destes está
cadastrado na Bruce App Store (`BruceDevices/App-Store-Data`) — os únicos
repositórios `koua29` lá são 3 *temas* diferentes
(`bruce-grille-theme`, `bruce-spiderman-theme`, `bruce-fallout-theme`, não
inclusos aqui), então estes apps são vendorizados diretamente, sem
duplicação com o mecanismo de auto-atualização da App Store.

Apenas os arquivos funcionais (`.js`, `.ir`, `.json` de dados) foram
copiados — imagens de divulgação (`docs/`), `README.md` e `LICENSE`
individuais de cada repositório de origem foram omitidos deste espelho.
