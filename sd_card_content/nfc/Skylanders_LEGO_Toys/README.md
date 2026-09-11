# Skylanders / LEGO Dimensions — dumps NFC e scripts de chave

Coleção de dumps `.nfc` que emulam figuras Skylanders (protocolo NFC
Mifare Classic, o mesmo lido/escrito pelo T-Embed via Bruce), mais dois
scripts Python auxiliares para gerar a chave criptográfica de uma tag
Skylanders/Disney Infinity **física que você já possui**, a partir da UID
lida dela.

## Conteúdo

- `Skylanders 1 Spyro's Adventure/` até `Skylanders 6 Imaginators/` —
  dumps `.nfc` por jogo/expansão, organizados por categoria (figuras,
  itens mágicos, baús, cristais etc.), conforme a estrutura original do
  repositório de origem.
- `key_generator_scripts/tnp3xxx.py` e `infsha.py` — calculam a Key A de
  um setor Mifare Classic a partir da UID de uma tag Skylanders ou Disney
  Infinity real. **Não geram dumps genéricos**: cada tag física tem uma
  chave derivada da própria UID, então não existe "banco de chaves"
  fixo para pré-computar — o script roda uma vez por tag que você tiver
  em mãos.

## Uso

1. Emulação direta: aponte o Bruce para o arquivo `.nfc` da figura
   desejada (equivalente a colocar a figura no portal do jogo).
2. Clonar/regravar uma tag em branco: leia a UID da tag física com o
   Bruce, rode `python3 tnp3xxx.py <UID>` (Skylanders) ou
   `python3 infsha.py <UID>` (Disney Infinity) na sua máquina, e use as
   chaves resultantes no dicionário de chaves Mifare do Bruce
   (`nfc/assets/mf_classic_dict_user.nfc` no Flipper original — no Bruce,
   verifique o caminho equivalente do dicionário de usuário) para ler o
   conteúdo completo da tag.

## Fontes

- Dumps NFC: [`sealldeveloper/FlipperSkylanders`](https://github.com/sealldeveloper/FlipperSkylanders)
  (784 arquivos).
- Scripts de chave: [`LNRC/Flipper-Infinity-Skylanders`](https://github.com/LNRC/Flipper-Infinity-Skylanders)
  (idênticos, por conteúdo/hash, aos publicados em
  [`V0lk3n/Flipper-Skylanders`](https://github.com/V0lk3n/Flipper-Skylanders) —
  apenas uma cópia foi incluída aqui).
