# Bibliotecas_Dev/

Código-fonte de bibliotecas usadas para compilar firmware customizado para o
T-Embed CC1101. Necessário apenas se você for modificar/recompilar o firmware
— não é necessário para uso comum com o Bruce instalado via `../Launcher/`.

## Conteúdo

| Pasta | Biblioteca | Uso na placa |
|---|---|---|
| `RadioLib/` | [RadioLib](https://github.com/jgromes/RadioLib) | Comunicação com o módulo transceptor CC1101 (rádio Sub-GHz) |
| `LVGL/` | [LVGL](https://github.com/lvgl/lvgl) | Biblioteca gráfica que renderiza a interface na tela do dispositivo |
| `FastLED/` | [FastLED](https://github.com/FastLED/FastLED) | Controle de LEDs endereçáveis (se sua variante de hardware tiver) |

## Origem e licenças

| Biblioteca | Repositório | Licença |
|---|---|---|
| RadioLib | [jgromes/RadioLib](https://github.com/jgromes/RadioLib) | MIT |
| LVGL | [lvgl/lvgl](https://github.com/lvgl/lvgl) | MIT |
| FastLED | [FastLED/FastLED](https://github.com/FastLED/FastLED) | MIT |

Todas as três são MIT — livres para uso, modificação e redistribuição desde
que a licença e o aviso de copyright originais sejam mantidos junto ao
código-fonte.

## Nota

Estas bibliotecas foram baixadas na versão mais recente do repositório na
data em que esta suíte foi organizada. Se for compilar o firmware do zero,
recomenda-se verificar se há uma versão mais nova antes de começar — ou usar
o gerenciador de bibliotecas do PlatformIO/Arduino IDE em vez desta cópia
estática.
