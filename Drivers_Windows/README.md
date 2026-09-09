# Drivers_Windows/

Driver USB-serial necessário no Windows para o PC reconhecer a placa ao
conectar via USB-C.

## Conteúdo

| Arquivo | Descrição |
|---|---|
| `CH9102_WIN.EXE` | Instalador do driver para o chip CH9102 (conversor USB-serial usado na porta USB-C do T-Embed). |

## Origem

- Fonte oficial: [Xinyuan-LilyGO/CH9102_Driver](https://github.com/Xinyuan-LilyGO/CH9102_Driver)
- Licença: proprietária (fabricante do chip, WCH), redistribuída pela LilyGO.

## Quando instalar

Só é necessário no Windows, e só se o Gerenciador de Dispositivos não mostrar
uma porta COM ao conectar a placa. macOS e Linux geralmente não precisam de
driver adicional para o CH9102.

## Instalação

1. Execute `CH9102_WIN.EXE` como administrador.
2. Reconecte a placa via USB-C.
3. Confira no Gerenciador de Dispositivos se uma porta COM apareceu
   (ex: `COM5`).
