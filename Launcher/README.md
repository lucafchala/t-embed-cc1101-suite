# Launcher/

Guia de instalação do firmware launcher que fica gravado permanentemente na
placa e permite instalar/trocar outros firmwares (Bruce, Marauder, etc.)
direto pela galeria OTA embutida — sem precisar de cabo USB depois da
instalação inicial.

> **Esta pasta contém apenas documentação.** O binário do Launcher não é
> vendorizado aqui — ele é obtido direto do flasher oficial (veja abaixo),
> sempre já na versão mais recente, então não fica desatualizado.

O firmware Bruce em si também **não** é baixado manualmente — ele é
instalado depois, de dentro do próprio Launcher, pela galeria OTA.

## Por que este fluxo (Launcher + galeria) em vez de flash direto do Bruce

- Grava o Launcher **uma única vez** via USB.
- Depois disso, trocar de firmware (Bruce, Marauder, outros suportados) é
  feito direto no dispositivo, pela galeria OTA do Launcher — sem
  reconectar o cabo.
- Facilita atualizar o Bruce para versões novas sem precisar montar de novo
  o `.bin` correto manualmente.

## Como instalar o Launcher

1. Conecte o T-Embed via USB-C. Se a placa não for reconhecida no Windows,
   instale o driver USB-serial CH9102 direto da [página oficial WCH](https://www.wch.cn/downloads/CH343SER_EXE.html)
   ou do [repositório da LilyGO](https://github.com/Xinyuan-LilyGO/CH9102_Driver).
2. Grave o Launcher pelo [Flasher oficial](https://bmorcelli.github.io/Launcher/) —
   sempre serve a build mais recente do perfil `lilygo-t-embed-all`, que
   cobre tanto o T-Embed comum quanto o T-Embed CC1101 (detecta em tempo de
   boot qual é qual, sondando o PMIC BQ25896 por I2C). Se preferir linha de
   comando em vez do flasher web, use `esptool` — veja
   [espressif/esptool](https://github.com/espressif/esptool).
3. Após o boot, o menu do Launcher deve aparecer na tela.
4. No menu do Launcher, abra a **galeria/catálogo online** e selecione
   **Bruce** para instalar o firmware direto na placa.

## ⚠️ Aviso conhecido — T-Embed CC1101 **Plus**

Se sua placa é a variante **Plus**, há um problema reportado e **ainda sem
correção** ([Launcher issue #411](https://github.com/bmorcelli/Launcher/issues/411)):
o cartão SD pode falhar ao montar quando rodando através deste Launcher,
por um conflito de barramento SPI compartilhado — os pinos CS do CC1101/
NRF24 ficam flutuando ou em LOW e travam o barramento que o SD também usa.
O mesmo cartão SD funciona normalmente quando o Bruce é flashado
diretamente (sem Launcher), o que confirma que é um problema específico do
perfil de hardware "T-Embed" padrão usado pelo Launcher, que não tem um
perfil dedicado para a variante Plus.

Não há solução oficial no momento. Se o SD não montar depois de instalar o
Bruce pela galeria do Launcher, isso é a causa provável — não é o cartão
SD, nem a formatação, nem os arquivos copiados. Acompanhe o issue linkado
para novidades.

## Depois de instalar o Bruce

Copie o conteúdo de [`../SD_Card_T-Embed/`](../SD_Card_T-Embed/README.md)
para a raiz de um cartão microSD FAT32 e insira na placa — os bancos de
dados IR/RF/NFC e demais extras funcionam da mesma forma independente de
o Bruce ter sido instalado via Launcher ou flashado diretamente.
