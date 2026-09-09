# Ferramentas_Flash/

Utilitário de linha de comando da Espressif para gravar firmware em placas
ESP32/ESP32-S3, incluindo o T-Embed CC1101.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| `esptool-5.4.0.tar.gz` | Código-fonte/pacote do `esptool`, versão 5.4.0 (mais recente no PyPI na data da organização). |

## Origem

- Fonte: [espressif/esptool](https://github.com/espressif/esptool)
- Licença: GPL-2.0

## Instalação

```bash
pip install esptool
# ou, a partir deste pacote:
tar -xzf esptool-5.4.0.tar.gz
cd esptool-5.4.0
pip install .
```

## Gravando o Launcher via linha de comando

Neste repositório, o firmware Bruce é instalado **de dentro do Launcher**
(pela galeria OTA embutida) — não é mais gravado diretamente via esptool.
O que você grava manualmente por USB é o **Launcher**, uma única vez. Veja
`../Launcher/README.md` para detalhes do fluxo completo.

1. Identifique a porta serial da placa:
   - Windows: `COMx` (veja no Gerenciador de Dispositivos, após instalar o
     driver em `../Drivers_Windows/`)
   - Linux/macOS: `/dev/ttyUSB0`, `/dev/ttyACM0` ou similar

2. Grave o binário do Launcher (`../Launcher/`):

```bash
esptool.py --chip esp32s3 --port COM5 --baud 921600 write_flash 0x0 \
  Launcher-lilygo-t-embed-all.bin
```

Ajuste `--port` para a porta correta do seu sistema, e o nome do arquivo
para o `.bin` presente em `../Launcher/`. Se a gravação falhar, tente
reduzir `--baud` para `460800` ou segurar o botão BOOT da placa durante a
conexão.

3. Após a gravação, siga o passo a passo em `../Launcher/README.md` para
   instalar o Bruce pela galeria OTA e depois copie o conteúdo de
   `../SD_Card_T-Embed/` para a raiz de um cartão microSD.

## Alternativa sem linha de comando

Para quem prefere não usar terminal, o [ESP Web Tool](https://esptool-js.espressif.com/)
faz a mesma gravação direto do navegador (Chrome/Edge), sem instalar nada.
