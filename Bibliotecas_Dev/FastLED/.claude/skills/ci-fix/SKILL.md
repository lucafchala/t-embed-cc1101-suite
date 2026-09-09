---
name: ci-fix
description: Scan all CI builds and tests, find failures, fetch error logs, and fix the code. Prioritizes unit tests, example tests, then uno, attiny85, esp32s3, esp32c6, teensy41. Use when CI is red and you need to diagnose and repair build/test failures.
argument-hint: [--board <name>] [--all]
context: fork
---

Find and fix CI build and test failures across all platforms.

Arguments: $ARGUMENTS

## Step 1: Scan builds and get error logs

Run the CI build scanner to discover all failing builds and tests with error context:

```bash
uv run ci/tools/gh/ci_builds.py --errors $ARGUMENTS
```

This auto-discovers workflows from `.github/workflows/` matching `build_*.yml`, `unit_test_*.yml`, and `example_test_*.yml`. Adding a new workflow file automatically adds it to this report.

## Step 2: Analyze and prioritize

Review the output. Builds are already sorted by priority:

1. **unit tests** — unit_test_linux, unit_test_macos, unit_test_windows — fix first, these validate core logic
2. **example tests** — example_test_linux, example_test_macos, example_test_windows — validate example compilation
3. **uno** — AVR 8-bit, most constrained, most users
4. **attiny85** — AVR tiny, extreme flash/RAM constraints
5. **esp32s3** — ESP32-S3, primary ESP target
6. **esp32c6** — ESP32-C6, RISC-V ESP target
7. **teensy41** — Teensy 4.1, ARM Cortex-M7
8. **Everything else** — alphabetical within non-priority builds

Fix priority builds first. If `--board <name>` was passed, focus only on those.

## Step 3: For each failing test or build

### For unit test failures:
1. Read the error logs from the scan output
2. Run the failing test(s) locally: `bash test` or `bash test <TestName>`
3. If a test fails, re-run in debug mode: `bash test <TestName> --debug`
4. Identify the root cause and fix the source code or test
5. Verify: `bash test`

### For example test failures:
1. Read the error logs from the scan output
2. Run the failing example(s) locally: `bash compile wasm --examples <ExampleName>`
3. Identify the root cause (missing include, type error, API change, etc.)
4. Fix the source or example code
5. Verify: `bash compile wasm --examples <ExampleName>`

### For board build failures:
1. Read the error logs from the scan output
2. Identify the root cause (missing header, type error, platform ifdef, linker error, etc.)
3. Find the relevant source file(s) and read them
4. Make the fix — prefer the simplest change that fixes the error:
   - Missing platform guard → add `#ifdef` / `#if defined()`
   - Missing include → add the include
   - Type mismatch → fix the type
   - API difference → use conditional compilation
5. After fixing, verify by compiling: `bash compile <board> --examples Blink`
   (use the board arg from the scan output, e.g. `bash compile uno --examples Blink`)

## Step 4: Verify fixes don't break other platforms

After fixing a failing build, consider whether the change could break other platforms. If you changed shared code (not platform-guarded), spot-check by compiling another platform:

```bash
bash compile wasm --examples Blink
```

## Notes

- The scanner discovers workflows dynamically — no hardcoded list to maintain
- Workflow patterns: `build_*.yml`, `unit_test_*.yml`, `example_test_*.yml`
- Use `--board uno,esp32s3` to focus on specific boards
- Use `--all` flag if you want to see passing builds too (default: only failing with --errors)
- Error logs show up to 5 error blocks per build with surrounding context
- The priority list is defined in `ci/tools/gh/ci_builds.py` in the `PRIORITY_BOARDS` constant
