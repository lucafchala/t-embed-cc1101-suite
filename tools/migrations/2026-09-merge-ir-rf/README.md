# Merge universal_ir/ + universal_rf/ -> ir_extra_dbs/ + subghz_extra_dbs/ (2026-09)

Scripts usados uma unica vez pra eliminar a duplicacao "duas pastas de
IR/RF" da curadoria original. Arquivados aqui como registro/auditoria,
nao sao pra rodar de novo (os caminhos que eles esperam -- `universal_ir/`,
`universal_rf/` -- deixaram de existir depois deste merge).

- `merge_ir_rf.py` -- classificou e moveu/descartou por arquivo (3 classes:
  novo/duplicado-exato/conflito). Resultado: 1860 movidos, 975 duplicatas
  exatas descartadas, 39 conflitos reais isolados em `merge_conflicts.tsv`.
- `inspect_conflicts.py` -- comparou os 39 conflitos botao-por-botao
  dentro do formato .ir, classificou em `conflict_analysis.tsv`.
- `resolve_conflicts.py` -- aplicou a decisao final sobre os 39: 33
  descartados (cobertura ja equivalente ou so rotulo de botao diferente),
  5 mantidos dos dois lados com sufixo `_alt` (dado genuinamente
  diferente), 1 (`Projectors/Minolta/ReadMe.md`) resolvido manualmente.
- `provenance_ir_rf_merge.csv` -- log de origem->destino de cada arquivo
  tocado. Vai alimentar o `PROVENANCE.csv`/`CREDITS.md` oficiais quando
  essa infra for construida.

Commit do resultado: dbee7672a
