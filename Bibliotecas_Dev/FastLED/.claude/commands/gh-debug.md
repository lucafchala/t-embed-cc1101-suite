---
description: Debug GitHub Actions build failures
argument-hint: [run-id or workflow-url]
---

Pull GitHub Actions logs for a workflow run, parse them to identify errors, fix the code, then reproduce the failure locally to verify the fix.

Arguments: ${1:-}

## Phase 1: Diagnose

**Primary Method (Recommended)**: Use the Python script for efficient log analysis:
```bash
uv run ci/tools/gh_debug.py ${1:-}
```

This script:
- **Tries build-summary artifacts first** (small, focused files uploaded by CI — much faster)
- Falls back to streaming full logs if no summary artifact is available
- Filters for errors in real-time
- Stops after finding 10 errors (configurable with --max-errors)
- Shows context around each error (5 lines before/after, configurable with --context)
- Handles timeouts gracefully

**Fallback Method**: If the Python script fails, use the 'gh-debug-agent' sub-agent with:

### Smart Log Fetching Strategy (AVOID downloading full 55MB+ logs)

1. **First, identify failed jobs/steps** using `gh run view <run-id> --log-failed`
   - This shows only logs from failed steps (much smaller)
   - Parse output to identify which jobs and steps failed

2. **Try downloading build-summary artifacts first**:
   - Use `gh api repos/{owner}/{repo}/actions/runs/{run_id}/artifacts --jq '.artifacts[] | select(.name | startswith("build-summary")) | .name'`
   - If found, download with `gh run download {run_id} -n {artifact_name}` — these are small, focused files
   - Only fall back to full logs if no summary artifact exists

3. **For each failed step, use targeted log extraction** (fallback):
   - **IMPORTANT**: Filter BEFORE limiting to avoid processing huge logs
   - Use `gh api /repos/FastLED/FastLED/actions/jobs/{job_id}/logs | grep -E "(error:|FAILED|Assertion|undefined reference|Error compiling|Test.*failed)" -A 10 -B 5 | tail -n 500`
   - This filters first (fast), then limits output (avoids timeout)
   - Use timeout of 3 minutes for log fetching commands

4. **Parse logs to identify**:
   - Compilation errors (look for "error:", "undefined reference", "no such file")
   - Test failures (look for "FAILED", "Assertion failed", exit codes)
   - Runtime issues (segfaults, exceptions, timeouts)

5. **Extract error context**:
   - Get ~10 lines before and after each error
   - Capture file paths, line numbers, and error messages
   - Identify patterns (multiple similar errors = systematic issue)

### Input Handling

The agent should handle:
- Run IDs (e.g., "18391541037")
- Workflow URLs (e.g., "https://github.com/FastLED/FastLED/actions/runs/18391541037")
- Most recent failed run if no argument provided (use `gh run list --status failure --limit 1`)

### Output Format

Provide:
- Workflow name and run number
- Job(s) that failed with step names
- Specific error messages with surrounding context (max ~50 lines per error)
- File paths and line numbers where applicable
- Suggested next steps or potential fixes

## Phase 2: Fix

After diagnosing, read the relevant source files and fix the code. Follow all standard CLAUDE.md rules for code changes.

## Phase 3: Verify Fix Locally

**CRITICAL**: After applying a fix, you MUST reproduce the CI failure locally to verify it's resolved. Do NOT consider the task complete until local verification passes.

### Determine the Reproduction Command

Based on the CI job name and failure type, pick the right local command:

| CI Job Pattern | Failure Type | Local Reproduction Command |
|---|---|---|
| `unit_test_*` or contains "unit" | Unit test failure | `bash test <TestName> --debug` |
| `example_test_*` or contains "example" | Example compilation | `bash test --examples --debug` (or `bash test --examples <Name> --debug` if specific) |
| Board name (uno, esp32dev, teensy41, etc.) | Platform compilation | `bash compile <board>` (15 min timeout) |
| `arduino_library_lint` | Library lint | N/A — usually metadata, not code |
| `iwyu` or contains "lint" | Lint/formatting | `bash lint` |
| `check_*_size` | Binary size | `bash compile <board>` then check size |
| `qemu_*` | QEMU emulation | `bash test --run <platform> <Example>` |
| `avr8js_*` | AVR emulator | `bash test --run uno` |
| `wasm` or contains "wasm" | WASM build | `bash compile wasm --examples <Name>` |

### Verification Steps

1. **Run the reproduction command** with appropriate timeout (15 min for platform builds).
2. **If verification passes**: Report success — the fix is confirmed.
3. **If verification fails with the SAME error**: The fix didn't work. Analyze the new output, revise the fix, and re-run verification. Repeat up to 3 times.
4. **If verification fails with a DIFFERENT error**: Report both the fix for the original error and the new error. The new error may be pre-existing or a side effect.
5. **If no local reproduction is possible** (e.g., platform-specific hardware issue, Docker not available, board not locally supported): State clearly that local verification was not possible and explain why.

### Multiple Failing Jobs

If multiple CI jobs failed:
- Group failures by root cause (often one source change breaks multiple platforms)
- Fix the root cause first, then verify with the most representative local command
- If different jobs have different root causes, verify each fix independently
- Prioritize: unit tests > example compilation > platform compilation > lint

### Test Failure Debug Rule

When verifying a unit test fix, ALWAYS use `--debug` mode. This enables ASAN/LSAN/UBSAN sanitizers. Quick-mode-only verification is INCOMPLETE — sanitizers often reveal the real root cause.
