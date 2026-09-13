# _precisa_edicao_manual/

*[English below](#english)*

Esta pasta reúne os arquivos de `Bruce-Scripts-Heaven_BAD/` (fonte:
[sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven))
que **não rodam como estão** no interpretador BadUSB do Bruce, separados
dos ~1.211 arquivos que já funcionam (1.187 nativamente + 24 convertidos
mecanicamente de `STRINGLN`) para que não fiquem misturados com payloads
prontos pra uso. **Nada foi excluído** — cada arquivo aqui está intacto,
só teve o caminho movido.

Classificação feita por análise estática de sintaxe (regex sobre
comandos, não execução) contra o que
[`ducky_typer.cpp`](https://github.com/BruceDevices/firmware) do Bruce
realmente interpreta (Ducky clássico + atalhos de modificador de 1
linha — não DuckyScript 3.0).

## `sintaxe_extra_nao_suportada/` (25 arquivos)

Tinham `STRINGLN`/`STRINGLN...END_STRINGLN` (conversível mecanicamente,
como os outros 24 já convertidos) **e também** outra sintaxe que o Bruce
não suporta: `ATTACKMODE`, `LED_ON`/`LED_OFF`, `SAVE_HOST_KEYBOARD_LOCK_STATE`/
`RESTORE_HOST_KEYBOARD_LOCK_STATE`, `GET SWITCH_POSITION`, `WAIT_FOR_*`,
controle de fluxo (`IF`/`ELSE`/`WHILE`/`FUNCTION`), seletores `VID_`/`PID_`,
`HOLD`/`RELEASE`/`MOUSE`, ou variáveis `$_VAR = ...`. Precisam de reescrita
manual (não é reformatação pura) pra virar Ducky Script compatível — quem
fizer isso pode usar o arquivo original aqui como base.

## `depende_de_extension/` (275 arquivos)

Dependem do sistema `EXTENSION`/`REM_BLOCK`/`DEFINE` (biblioteca de
funções reutilizáveis do DuckyScript 3.0) que o interpretador do Bruce
não implementa. "Converter" estes na prática significa **reimplementar
do zero** a lógica que hoje depende da extensão que falta — ou seja,
escrever código funcional novo que hoje não roda em lugar nenhum do
repositório, não apenas reformatar sintaxe. Isso inclui payloads como
`BitLockerKeyDump`, criação de conta admin oculta, e exfiltração via
Discord C2/keylogger.

**Este repositório não escreve essa lógica** — foge de curadoria/
organização para desenvolvimento de exploit novo, independente do device
ser de uso pessoal/pentest autorizado. Os arquivos ficam aqui,
preservados e documentados como "depende de reimplementação manual", à
disposição de quem quiser completar a conversão.

## Nota sobre `BadUSB-FalsePhilosopher/`

Essa pasta (cópia de [FalsePhilosopher/badusb](https://github.com/FalsePhilosopher/badusb))
**não foi tocada nesta reorganização** — fica exatamente como o autor
original organizou, por decisão do mantenedor deste repositório. Isso
inclui 1 arquivo (`Ducky/USBRubberducky/credentials/Win/SamDumpDucky/payload.txt`)
que tecnicamente se encaixaria em `sintaxe_extra_nao_suportada/` acima
(tem `STRINGLN` + outra sintaxe incompatível) mas foi deixado no lugar
original em vez de movido pra cá, pela mesma razão. As ~1.000 subpastas
genuinamente incompatíveis dessa pasta (`BashBunny/`, `WHID/`,
`Malduino/`, `OMG/`, `Misc/Cheat_Sheets/PayloadsAllTheThings/`,
`Misc/Web/` — sintaxe/hardware completamente diferentes do Bruce)
continuam documentadas como incompatibilidade técnica no README principal,
sem remoção nem reorganização.

---

## English

This folder collects the files from `Bruce-Scripts-Heaven_BAD/` (source:
[sloth632/Bruce-Scripts-Heaven](https://github.com/sloth632/Bruce-Scripts-Heaven))
that **do not run as-is** on Bruce's BadUSB interpreter, separated from
the ~1,211 files that already work (1,187 natively + 24 mechanically
converted from `STRINGLN`) so they don't sit mixed in with ready-to-use
payloads. **Nothing was deleted** — every file here is intact, only its
path moved.

Classification was done via static syntax analysis (regex over
commands, not execution) against what Bruce's
[`ducky_typer.cpp`](https://github.com/BruceDevices/firmware) actually
interprets (classic Ducky + single-line modifier shortcuts — not
DuckyScript 3.0).

## `sintaxe_extra_nao_suportada/` (25 files, "unsupported extra syntax")

Had `STRINGLN`/`STRINGLN...END_STRINGLN` (mechanically convertible, like
the other 24 already converted) **and also** other syntax Bruce doesn't
support: `ATTACKMODE`, `LED_ON`/`LED_OFF`,
`SAVE_HOST_KEYBOARD_LOCK_STATE`/`RESTORE_HOST_KEYBOARD_LOCK_STATE`,
`GET SWITCH_POSITION`, `WAIT_FOR_*`, control flow
(`IF`/`ELSE`/`WHILE`/`FUNCTION`), `VID_`/`PID_` selectors,
`HOLD`/`RELEASE`/`MOUSE`, or `$_VAR = ...` variables. These need manual
rewriting (not pure reformatting) to become compatible Ducky Script —
whoever does that can use the original file here as a base.

## `depende_de_extension/` (275 files, "depends on EXTENSION")

Depend on the `EXTENSION`/`REM_BLOCK`/`DEFINE` system (DuckyScript 3.0's
reusable-function library) that Bruce's interpreter doesn't implement.
"Converting" these in practice means **reimplementing from scratch** the
logic that currently depends on the missing extension — i.e. writing new
functional code that doesn't run anywhere in the repository today, not
just reformatting syntax. This includes payloads like `BitLockerKeyDump`,
hidden admin account creation, and Discord C2/keylogger exfiltration.

**This repository does not write that logic** — that goes beyond
curation/organization into developing a new exploit, regardless of the
device being for personal/authorized-pentest use. The files stay here,
preserved and documented as "needs manual reimplementation," available
to whoever wants to complete the conversion.

## Note on `BadUSB-FalsePhilosopher/`

That folder (a copy of [FalsePhilosopher/badusb](https://github.com/FalsePhilosopher/badusb))
**was not touched by this reorganization** — it stays exactly as the
original author organized it, by this repository's maintainer's
decision. That includes 1 file
(`Ducky/USBRubberducky/credentials/Win/SamDumpDucky/payload.txt`) that
would technically fit `sintaxe_extra_nao_suportada/` above (has
`STRINGLN` plus other incompatible syntax) but was left in its original
location instead of moved here, for the same reason. That folder's
~1,000 genuinely incompatible subfolders (`BashBunny/`, `WHID/`,
`Malduino/`, `OMG/`, `Misc/Cheat_Sheets/PayloadsAllTheThings/`,
`Misc/Web/` — syntax/hardware entirely different from Bruce) remain
documented as a technical incompatibility in the main README, without
removal or reorganization.
