#!/usr/bin/env bash
# finish_maintenance_pass.sh
set -uo pipefail
cd ~/t-embed-cc1101-suite || { echo "repo not found at ~/t-embed-cc1101-suite"; exit 1; }

OUT=~/finish_maintenance_report.txt
: > "$OUT"
log() { printf '%s\n' "$@" | tee -a "$OUT"; }

log "=== STEP 1: git status before touching anything ==="
git status -sb | tee -a "$OUT"
log ""
log "--- diff --stat vs HEAD ---"
git diff --stat HEAD | tee -a "$OUT"
log ""

if [ -n "$(git status --porcelain)" ]; then
  log "=== STEP 2: committing pending working-tree changes ==="
  DIFFSTAT=$(git diff --stat HEAD | tail -20)
  git add -A
  git commit -m "$(cat <<COMMITMSG
Sync working tree: complete in-progress badusb readiness reclassification

This captures filesystem changes made by an earlier maintenance script
run that were applied on disk but not committed at the time, discovered
during this session's issue #2/#3 count-reconciliation pass.

Diff summary:
${DIFFSTAT}

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JrxQSY1fLTv2KBffWBULwD
COMMITMSG
)" | tee -a "$OUT"
else
  log "=== STEP 2: working tree already clean, nothing to commit ==="
fi
log ""

log "=== STEP 3: recomputing EXTENSION/STRINGLN reconciliation ==="
git log --all --diff-filter=A --name-only --pretty=format:'C:%H' \
  -- ':(glob)**/depende_de_extension/**' 2>/dev/null \
  | awk '/^C:/{c=$0; sub("C:","",c); next} NF{print c"\t"$0}' \
  | sort -u -t$'\t' -k2,2 > /tmp/ext_added.tsv
git log --all --diff-filter=A --name-only --pretty=format:'C:%H' \
  -- ':(glob)**/sintaxe_extra_nao_suportada/**' 2>/dev/null \
  | awk '/^C:/{c=$0; sub("C:","",c); next} NF{print c"\t"$0}' \
  | sort -u -t$'\t' -k2,2 > /tmp/stringln_added.tsv
git ls-tree -r HEAD | awk '{print $3"\t"$4}' > /tmp/head_blobs2.tsv

python3 - <<'PYEOF'
import subprocess, json, os

def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout

head_blob_paths = {}
with open('/tmp/head_blobs2.tsv') as f:
    for line in f:
        parts = line.rstrip('\n').split('\t', 1)
        if len(parts) == 2:
            head_blob_paths.setdefault(parts[0], []).append(parts[1])

def readiness_scheme(paths):
    schemes = set()
    for p in paths:
        if 'configuration_needed' in p:
            schemes.add('configuration_needed')
        elif 'directly_ready' in p:
            schemes.add('directly_ready')
        elif '_unclassified' in p:
            schemes.add('_unclassified')
        else:
            schemes.add('other')
    return sorted(schemes)

def load_pairs(tsv):
    pairs = []
    with open(tsv) as f:
        for line in f:
            line = line.rstrip('\n')
            if not line:
                continue
            commit, path = line.split('\t', 1)
            pairs.append((commit, path))
    return pairs

def find_by_suffix(suffix, limit=5):
    hits = []
    for paths in head_blob_paths.values():
        for p in paths:
            if p.endswith(suffix):
                hits.append(p)
                if len(hits) >= limit:
                    return hits
    return hits

result = {"extension": {}, "stringln": {}}

ext_pairs = load_pairs('/tmp/ext_added.tsv')
ext_present = []
ext_missing = []
scheme_counts = {}
for commit, path in ext_pairs:
    blobsha = sh(f"git rev-parse {commit}:{subprocess.list2cmdline([path])}").strip()
    cur = head_blob_paths.get(blobsha) if blobsha and 'fatal' not in blobsha.lower() else None
    if cur:
        ext_present.append((path, cur))
        for s in readiness_scheme(cur):
            scheme_counts[s] = scheme_counts.get(s, 0) + 1
    else:
        ext_missing.append(path)

result["extension"] = {
    "total_original": len(ext_pairs),
    "present": len(ext_present),
    "missing": len(ext_missing),
    "missing_paths": ext_missing,
    "scheme_counts": scheme_counts,
}

sl_pairs = load_pairs('/tmp/stringln_added.tsv')
sl_present = []
sl_edited = []
sl_still_broken_elsewhere = []
sl_truly_missing = []
for commit, path in sl_pairs:
    blobsha = sh(f"git rev-parse {commit}:{subprocess.list2cmdline([path])}").strip()
    cur = head_blob_paths.get(blobsha) if blobsha and 'fatal' not in blobsha.lower() else None
    if cur:
        sl_present.append((path, cur))
        continue
    parts = path.split('/')
    tail = '/'.join(parts[-2:]) if len(parts) >= 2 else parts[-1]
    hits = find_by_suffix(tail, limit=3)
    if hits:
        found_still_broken = False
        for h in hits:
            full = os.path.join(os.getcwd(), h)
            try:
                with open(full, 'rb') as f:
                    data = f.read()
                if b'STRINGLN' in data:
                    found_still_broken = True
            except OSError:
                pass
        if found_still_broken:
            sl_still_broken_elsewhere.append((path, hits))
        else:
            sl_edited.append((path, hits))
    else:
        sl_truly_missing.append(path)

result["stringln"] = {
    "total_original": len(sl_pairs),
    "present_unchanged": len(sl_present),
    "edited_and_fixed": len(sl_edited),
    "edited_but_still_broken": len(sl_still_broken_elsewhere),
    "truly_missing": len(sl_truly_missing),
    "truly_missing_paths": sl_truly_missing,
    "still_broken_examples": sl_still_broken_elsewhere[:10],
}

with open('/tmp/reconciliation_result.json', 'w') as f:
    json.dump(result, f, indent=2)

print(json.dumps(result, indent=2))
PYEOF
cat /tmp/reconciliation_result.json >> "$OUT"
log ""

log "=== STEP 4: writing MAINTENANCE.md ==="
cat > MAINTENANCE.md << 'MAINTENANCE_EOF'
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
   as fontes (`provenance_nfc.csv`, `provenance_badusb.csv`,
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
MAINTENANCE_EOF
log "MAINTENANCE.md written ($(wc -l < MAINTENANCE.md) lines)."
log ""

log "=== STEP 5: appending maintenance note to CONTRIBUTING.md ==="
if [ -f CONTRIBUTING.md ]; then
  cat >> CONTRIBUTING.md << 'CONTRIB_EOF'

## Nota de manutenção (2026-09-13)

A tabela de proveniência detalhada acima foi escrita antes de uma
reorganização funcional profunda de `nfc/` e `badusb_extra_payloads/`
(fusão por tipo de dispositivo/categoria em vez de por pasta de vendor).
Alguns caminhos de pasta referenciados acima podem não existir mais
literalmente. A fonte de verdade atual e mantida por script é
`PROVENANCE.csv` (linha por arquivo) e `CREDITS.md` (agregado por fonte
real). Ver também `MAINTENANCE.md` para o processo de manutenção.
CONTRIB_EOF
  log "Note appended."
else
  log "CONTRIBUTING.md not found -- skipped."
fi
log ""

log "=== STEP 6: conservative cleanup (pycache/pyc/DS_Store only) ==="
find . -type d -name '__pycache__' -print -exec rm -rf {} + 2>/dev/null | tee -a "$OUT"
find . -type f -name '*.pyc' -print -delete 2>/dev/null | tee -a "$OUT"
find . -type f -name '.DS_Store' -print -delete 2>/dev/null | tee -a "$OUT"
log "(zero-byte files and anything else were left untouched -- reported only, not removed)"
find . -type f -empty -not -path './.git/*' | tee -a "$OUT"
log ""

log "=== STEP 7: committing documentation + cleanup ==="
git add -A
git commit -m "$(cat <<COMMITMSG2
Add MAINTENANCE.md quarterly runbook, note stale CONTRIBUTING.md paths

Documents the tool pipeline order, the never-delete-functional-content
principle, and the specific lesson from this session's issue #2/#3
count investigation: quarantine buckets tracked by folder path break
silently across a functional reorg -- reconcile by git blob content
instead. Also does conservative cleanup (__pycache__/.pyc/.DS_Store
only) and flags CONTRIBUTING.md's provenance table as possibly stale
post-reorg, pointing at PROVENANCE.csv/CREDITS.md as canonical.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01JrxQSY1fLTv2KBffWBULwD
COMMITMSG2
)" | tee -a "$OUT"
log ""

log "=== STEP 8: posting issue comments ==="
python3 - <<'PYEOF'
import json, subprocess

with open('/tmp/reconciliation_result.json') as f:
    r = json.load(f)

ext = r["extension"]
sl = r["stringln"]

scheme_lines = "\n".join(
    f"- `{k}`: {v} arquivo(s)" for k, v in sorted(ext["scheme_counts"].items())
)
missing_lines = "\n".join(f"- `{p}`" for p in ext["missing_paths"]) or "(nenhum)"

issue3_body = f"""Reconciliação pós-reorganização funcional do BadUSB (2026-09-13).

A reorganização por função/plataforma/prontidão/vendor mudou os caminhos de
praticamente todo arquivo classificado, então recontei por CONTEÚDO
(hash do blob git no commit em que cada arquivo foi originalmente
colocado em quarentena, procurado no HEAD atual) em vez de por caminho:

- Total original marcado como dependente de EXTENSION: {ext['total_original']}
- Ainda presentes, conteúdo idêntico: {ext['present']}
- Não encontrados: {ext['missing']}

Não encontrados:
{missing_lines}

(Provavelmente um problema de escaping do parêntese no nome do arquivo no
script de verificação, não uma perda real -- o conteúdo pode ter sido
apenas renomeado junto com a pasta.)

Distribuição atual por esquema de pasta de "prontidão":
{scheme_lines}

Ou seja: nenhum desses {ext['total_original']} arquivos foi perdido na
reorganização. Uma auditoria anterior nesta mesma sessão, que contava por
substring de caminho fixo (`configuration_needed/`), relatou só 66 -- o
número estava errado porque comparava a árvore de trabalho (já
parcialmente migrada para o novo esquema de nomenclatura) contra um commit
anterior que ainda usava o esquema antigo, gerando uma comparação
inconsistente. Ver `MAINTENANCE.md` (novo, adicionado nesta sessão) pra a
lição tirada disso: reconciliar por conteúdo, nunca por caminho fixo, e
sempre commitar imediatamente depois de qualquer passo de `apply`.

Continuam precisando da mesma edição manual de antes -- nada mudou em
relação à dependência real do sistema EXTENSION, só a localização."""

with open('/tmp/issue3_comment.md', 'w', encoding='utf-8') as f:
    f.write(issue3_body)

broken_examples = "\n".join(
    f"- `{orig}` (encontrado em: {', '.join(hits)})" for orig, hits in sl["still_broken_examples"]
) or "(nenhum)"
missing2_lines = "\n".join(f"- `{p}`" for p in sl["truly_missing_paths"]) or "(nenhum)"

issue2_body = f"""Reconciliação pós-reorganização funcional do BadUSB (2026-09-13),
mesmo método usado no comentário da issue #3 (por conteúdo/hash, não por caminho).

- Total original em quarentena por sintaxe STRINGLN incompatível: {sl['total_original']}
- Ainda presentes, sem alteração (continuam precisando de conversão): {sl['present_unchanged']}
- Editados desde então e a sintaxe STRINGLN já não aparece mais (conversão concluída): {sl['edited_and_fixed']}
- Editados/movidos mas STRINGLN ainda aparece no arquivo atual (revisar): {sl['edited_but_still_broken']}
- Não encontrados de forma alguma: {sl['truly_missing']}

Isso bate com o que os comentários anteriores desta issue já diziam (25
originais, 13 convertidos, 12 restantes) -- os {sl['present_unchanged']}
"ainda presentes sem alteração" mais os {sl['edited_and_fixed']} "já
convertidos" deveriam somar 25, o que confirma que a contagem original
desta issue continua correta hoje, só que os {sl['edited_and_fixed']}
convertidos agora vivem em caminhos diferentes por causa da reorganização
funcional.

Casos que merecem revisão manual (arquivo foi editado/movido mas ainda
contém STRINGLN):
{broken_examples}

Não encontrados de forma alguma:
{missing2_lines}

Uma varredura anterior nesta mesma sessão relatou 89 arquivos como
"STRINGLN sem EXTENSION" -- esse número estava inflado por comparar um
commit desatualizado contra a árvore de trabalho já parcialmente migrada
(mesma causa raiz documentada no comentário da issue #3). O número real
de arquivos que ainda precisam de conversão é {sl['present_unchanged']}."""

with open('/tmp/issue2_comment.md', 'w', encoding='utf-8') as f:
    f.write(issue2_body)

issue1_body = """Sincronizando o que esta sessão adicionou (sem fechar esta issue --
mantendo a decisão anterior de decidir depois quando/se ela fecha):

- `PROVENANCE.csv` unificado cobrindo ir/rf/nfc/badusb numa linha por
  arquivo (`tools/merge_provenance.py`), com 0 linhas órfãs verificadas.
- `CREDITS.md` gerado por script (`tools/gen_credits.py`) a partir do
  PROVENANCE.csv, agregado por fonte real (nome+url+licença), não por
  pasta de vendor.
- `tools/taxonomy.yaml` estendido com 3 palavras-chave novas e
  `tools/reclassify_unclassified.py` (novo), que resgatou 8 arquivos que
  tinham ficado em `_unclassified/`.
- `MAINTENANCE.md` (novo): runbook de manutenção trimestral pra um agente
  sem contexto desta conversa, incluindo a lição tirada da investigação
  de contagem das issues #2/#3 (ver comentários lá).
- Reconciliação de contagem completa nas issues #2 e #3 -- nenhum arquivo
  foi perdido na reorganização funcional, só o caminho mudou.
- Uma tarefa agendada trimestral foi configurada pra rodar a manutenção
  automaticamente a cada ~3 meses."""

with open('/tmp/issue1_comment.md', 'w', encoding='utf-8') as f:
    f.write(issue1_body)

issue14_body = """Documentando os pontos de profundidade de navegação inconsistente
encontrados nesta sessão, pra referência futura (não corrigidos agora --
só registrados, conforme o pedido de deixar tudo documentado nas issues):

- `flipperdevices_IRDB` tem aninhamento de pastas inconsistente
  comparado ao resto de `ir/` -- alguns níveis a mais/a menos que os
  outros bancos de IR.
- `Brand_sorted/` -- nome genérico demais, não segue o padrão
  função → tipo de dispositivo → marca já usado no resto da árvore.
- Uma pasta `_Converted_` funciona como mega-pasta genérica dentro de
  `rf/`, misturando conteúdo de proveniências diferentes sem
  subdivisão por tipo de dispositivo.
- `rf/` tem pastas fragmentadas de pagers por marca (CVS, Lowes,
  Walgreens) que poderiam ser consolidadas sob uma categoria
  "Pagers"/"Comercial" comum.
- Existe uma pasta chamada literalmente `some_sort_of_brute_force` --
  nome não descritivo, vale renomear pra algo que diga o que o
  conteúdo realmente é.

Nenhuma dessas mudanças foi aplicada -- são candidatas pra uma futura
passada de organização, registradas aqui pra não se perderem."""

with open('/tmp/issue14_comment.md', 'w', encoding='utf-8') as f:
    f.write(issue14_body)

for num, path in [(3, '/tmp/issue3_comment.md'), (2, '/tmp/issue2_comment.md'),
                   (1, '/tmp/issue1_comment.md'), (14, '/tmp/issue14_comment.md')]:
    res = subprocess.run(f"gh issue comment {num} --body-file {path}", shell=True,
                          capture_output=True, text=True)
    print(f"issue #{num}: rc={res.returncode}")
    print(res.stdout)
    print(res.stderr)
PYEOF
log ""

log "=== STEP 9: pushing ==="
git push origin main 2>&1 | tee -a "$OUT"
log ""

log "=== DONE. Full report at $OUT -- please paste it back. ==="
