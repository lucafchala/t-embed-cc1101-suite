# MAINTENANCE.md

Runbook para manutenção trimestral deste repositório por um agente sem
contexto prévio da conversa que o construiu. Leia isto inteiro antes de
mexer em qualquer coisa.

## Princípio número um

**Nada que funcione, ou que possa vir a funcionar, sai do repositório.**
Conteúdo ofensivo, perigoso ou de baixa qualidade recebe um aviso de risco
no README correspondente — nunca é excluído. A única coisa que pode ser
removida é artefato genuinamente morto: scripts de migração já aplicados
e que não são mais lidos por nenhum outro script, caches (`__pycache__`,
`.pyc`, `.DS_Store`), diretórios vazios. Na dúvida, não apague — documente
a dúvida num comentário de issue e siga em frente.

## Antes de qualquer coisa: `git status`

Se a árvore de trabalho estiver suja (`git status` mostra mudanças não
commitadas), **pare e resolva isso primeiro**. Nunca rode um script de
classificação/dedup/merge sobre uma árvore já suja — isso foi exatamente o
que causou a divergência de contagens investigada em 2026-09 (ver comentário
nas issues #2/#3): um passo de `apply` alterou arquivos no disco mas o
commit correspondente nunca foi feito, e uma auditoria posterior comparou
o HEAD commitado (desatualizado) com o disco (já migrado), gerando números
sem sentido. **Sempre commite imediatamente depois de qualquer modo
`apply`, antes de rodar o próximo script.**

## Ordem das ferramentas (`tools/`)

Quando chegar conteúdo novo (uma pasta de vendor nova, uma doação de
arquivos), a ordem correta é:

1. `classify_nfc.py` -- só se o conteúdo novo for NFC.
2. `classify_badusb.py` -- classifica por `tools/taxonomy.yaml`
   (`badusb_categories`, `badusb_platforms`, `badusb_readiness_markers`).
   Rode primeiro em dry-run (sem argumento `apply`), revise a saída, só
   depois rode com `apply`.
3. `dedup_badusb.py` -- roda DEPOIS do apply do passo 2. Remove
   duplicatas exatas por hash de conteúdo (regra de desempate documentada
   no cabeçalho do próprio script: BadUsb-Library sempre vence, fontes
   marcadas como scrape-redundante sempre perdem, `_unclassified` perde
   pra categoria real). Também em dry-run primeiro.
4. `reclassify_unclassified.py` -- roda depois de estender
   `taxonomy.yaml` com palavras-chave novas, pra tentar resgatar arquivos
   que ficaram em `_unclassified/`.
5. `merge_provenance.py` -- regenera `PROVENANCE.csv` a partir de todas
   as fontes (`tools/provenance_sources/provenance_nfc.csv`, `tools/provenance_sources/provenance_badusb.csv`,
   `tools/migrations/2026-09-merge-ir-rf/provenance_ir_rf_merge.csv`, e
   os logs de dedup). Depois de rodar, confira que a saída bate: 0 linhas
   órfãs (todo `new_path` listado existe de fato na árvore).
6. `gen_credits.py` -- regenera `CREDITS.md` a partir do `PROVENANCE.csv`.
   Nunca edite `CREDITS.md` à mão. A agregação é por tupla real
   `(name, url, license)`, não por nome de pasta de vendor -- várias
   pastas podem apontar pro mesmo repositório upstream.
7. `git add -A && git commit` -- **imediatamente**, antes de fazer
   qualquer outra coisa. Não deixe a árvore suja entre passos.

## Lição aprendida (2026-09-13): buckets de quarentena por nome de pasta são frágeis

As issues #2 e #3 rastreavam arquivos BadUSB dependentes de sintaxe
`STRINGLN`/`EXTENSION` incompatível pelo CAMINHO da pasta de quarentena
(`_precisa_edicao_manual/depende_de_extension/`,
`_precisa_edicao_manual/sintaxe_extra_nao_suportada/`). Quando a
reorganização funcional (função → plataforma → prontidão → vendor) moveu
esses arquivos pra dentro da árvore nova, o rastreamento por nome de pasta
quebrou silenciosamente -- o conteúdo continuou lá, só que sob um caminho
diferente, e uma auditoria ingênua por substring/pasta relatou números
completamente errados.

**Recomendação pra manutenção futura**: nunca rastreie um bucket de
triagem só pelo caminho. Se for preciso reconciliar contagens depois de
uma reorganização, faça por CONTEÚDO (hash do blob git, que sobrevive a
qualquer `git mv`), não por substring de caminho. O padrão usado nesta
sessão (script que resolve `git rev-parse <commit>:<path>` no commit
original e procura esse mesmo blob em `git ls-tree -r HEAD`) é reutilizável
e está preservado no histórico de commits desta data, caso precise de novo.

## Checklist trimestral

1. `git status` -- árvore limpa? Se não, resolva antes de tudo.
2. Existe conteúdo novo pra classificar (issues abertas pedindo adição,
   PRs)? Rode o pipeline da seção acima.
3. `PROVENANCE.csv` ainda bate (0 órfãos)? Rode a verificação de
   `merge_provenance.py`.
4. `CREDITS.md` foi regenerado depois de qualquer mudança de proveniência?
5. Alguém converteu manualmente algum arquivo das issues #2/#3 (sintaxe
   `STRINGLN`/dependência de `EXTENSION`)? Atualize a contagem no
   comentário da issue correspondente -- por conteúdo, não por pasta (ver
   lição acima).
6. Alguma issue nova foi aberta pela comunidade (o repo é público)?
   Triar e comentar.
7. Cleanup conservador: `__pycache__`, `.pyc`, `.DS_Store` podem ser
   removidos sem dó. Qualquer outra coisa que pareça "morta" -- documente
   a dúvida numa issue em vez de apagar.
8. Commit e push no final -- nunca deixe trabalho aplicado sem commit.

## Se travar

Se alguma contagem não bater, ou você não tiver certeza se algo é seguro
remover, **não adivinhe**. Comente na issue #1 (issue guarda-chuva de
manutenção) explicando o que foi encontrado e o que ficou em dúvida, e
pare por aí. Preservar o conteúdo é sempre a opção mais segura.
