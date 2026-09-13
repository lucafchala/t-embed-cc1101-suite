# I-Am-Jakoby BadUSB Payloads

Coleção de payloads BadUSB (scripts PowerShell disparados via emulação de
teclado) do repositório
[`I-Am-Jakoby/Flipper-Zero-BadUSB`](https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB).
Uso pretendido pelo autor original: testes de segurança/pentest e
demonstrações em **dispositivos próprios**, com consentimento.

**Como em outras coleções BadUSB deste repositório, use apenas em
equipamentos que você possui ou tem autorização explícita para testar.**
Rodar qualquer um destes scripts em um computador de terceiros sem
consentimento é crime na maioria das jurisdições (acesso não autorizado a
sistema de computador).

## Categorias

### Prank / visual (baixo risco, sem exfiltração de dados)
- `Flip-JumpScare/`, `Flip-JumpScare-2.0/` — abre imagem/som de susto.
- `Flip-AcidBurn/` — troca o papel de parede.
- `Flip-Wallpaper-Troll/`, `Flip-WallPaper-URL/` — troca papel de parede
  por imagem/URL.
- `Flip-Rage-PopUps/` — abre múltiplos pop-ups de mensagem.
- `Flip-PS-Draw/` — desenha no PowerShell/console.
- `Flip-Play-WAV/` — toca um arquivo de áudio.
- `Flip-EvilGoose/`, `Flip-YT-Tripwire/`, `Flip-ADV-RickRoll/`,
  `Flip-Subscribe/` — abrem uma página/vídeo específico no navegador.
- `Flip-ShortcutJacker/` — substitui atalhos da área de trabalho.
- `Flip-We-Found-You/` — mostra uma mensagem/imagem na tela.
- `Debug/` — script de teste/depuração do próprio autor (upload de log
  para um webhook Discord).

### Reconhecimento (mesma categoria de risco do conteúdo já incluído em `magikh0e_BadUSB/`)
Coletam informação do sistema e enviam para um destino externo (webhook
Discord configurável pelo autor) ou apenas exibem localmente — não criam
contas, não desativam segurança do sistema:
- `Flip-ADV-Recon/` — coleta informações gerais do sistema.
- `Flip-IP-Grabber/` — coleta IP público.
- `Flip-WifiGrabber/`, `Payloads/Scripts/WifiPasswords.ps1` — extraem
  senhas de redes Wi-Fi salvas no Windows (`netsh wlan show profile ...
  key=clear`, um comando nativo do próprio Windows).
- `Flip-BrowserData/` — coleta dados salvos do navegador.
- `Flip-MustSub/` — variante de recon com pop-up de inscrição.
- `Flip-PineApple/` — variante de recon.
- `VoiceLogger/` — grava áudio do microfone e envia para webhook.

### Risco elevado — sinalizados explicitamente
Estes dois itens vão além de reconhecimento: capturam credenciais ou
pressionamentos de tecla continuamente, não apenas um snapshot do sistema.
Incluídos porque a coleção completa foi solicitada para uso
educacional/teste em equipamento próprio, mas merecem atenção redobrada:

- **`Flip-Keylogger/keylogger.ps1`** — instala um keylogger que registra
  as teclas digitadas e envia o log para um destino externo.
- **`Flip-Credz-Plz/`** — abre uma tela de login falsa (phishing local)
  imitando a tela de autenticação do Windows, para capturar a senha
  digitada pelo usuário.

Ambos exigem que o operador já tenha acesso físico ao equipamento (mesma
pré-condição de qualquer ataque BadUSB) — não são um vetor remoto. Ainda
assim, diferem do resto da coleção por capturarem credenciais
diretamente, então ficam documentados separadamente em vez de agrupados
com o "reconhecimento" genérico.

## Fonte

[`I-Am-Jakoby/Flipper-Zero-BadUSB`](https://github.com/I-Am-Jakoby/Flipper-Zero-BadUSB).
Arquivos de metadados do próprio repositório de origem (`unload.ps1`,
banner, página HTML de apresentação) foram omitidos deste espelho — só os
payloads e seus assets (imagens/áudio necessários para o script
funcionar) foram incluídos.
