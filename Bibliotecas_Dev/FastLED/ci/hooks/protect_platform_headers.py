#!/usr/bin/env python3
"""
PreToolUse hook for Edit|Write: protect platform headers and third-party code.

Blocks writes to files that should rarely be modified directly:
1. Third-party vendored code (src/fl/third_party/)
2. Platform LED system definition headers (led_sysdefs_*.h)
3. Arduino.h compatibility shims

These files are either vendored (changes get overwritten on update) or
platform-critical (changes can silently break specific MCU targets).

Exit codes:
- 0: Allow the write
- 2: Block the write (error message sent to agent)

Override: Set FL_AGENT_ALLOW_PROTECTED_WRITE=1 in the environment to bypass.
"""

import json
import os
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent

OVERRIDE_ENV_VAR = "FL_AGENT_ALLOW_PROTECTED_WRITE"

# Protected path prefixes (relative to project root)
# These are vendored third-party code — changes get lost on update
PROTECTED_PREFIXES = [
    (
        "src/fl/third_party/",
        "third-party vendored code (changes will be lost on update)",
    ),
]

# Protected filename patterns (anywhere under src/platforms/)
PROTECTED_PATTERNS = [
    (
        "led_sysdefs_",
        "platform LED system definitions (platform-critical, rarely needs changes)",
    ),
]


def normalize_path(file_path: str) -> str | None:
    """Get path relative to project root, normalized with forward slashes."""
    file_path = file_path.replace("\\", "/")
    project_root = str(PROJECT_ROOT).replace("\\", "/")

    if file_path.startswith(project_root):
        return file_path[len(project_root) :].lstrip("/")

    norm_file = os.path.normpath(file_path).replace("\\", "/")
    norm_root = os.path.normpath(project_root).replace("\\", "/")
    if norm_file.startswith(norm_root):
        return norm_file[len(norm_root) :].lstrip("/")

    return None


def main() -> int:
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    tool_name = input_data.get("tool_name", "")
    if tool_name not in ("Write", "Edit"):
        return 0

    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "")
    if not file_path:
        return 0

    # Check override
    if os.environ.get(OVERRIDE_ENV_VAR) in ("1", "true", "True", "TRUE"):
        return 0

    rel_path = normalize_path(file_path)
    if not rel_path:
        return 0

    # Check protected prefixes
    for prefix, reason in PROTECTED_PREFIXES:
        if rel_path.startswith(prefix):
            print(
                f"BLOCKED: Cannot modify '{rel_path}' — {reason}.\n"
                f"If you must edit this file, set {OVERRIDE_ENV_VAR}=1 in the environment.",
                file=sys.stderr,
            )
            return 2

    # Check protected filename patterns (only under src/platforms/)
    if rel_path.startswith("src/platforms/"):
        filename = os.path.basename(rel_path)
        for pattern, reason in PROTECTED_PATTERNS:
            if pattern in filename:
                print(
                    f"BLOCKED: Cannot modify '{rel_path}' — {reason}.\n"
                    f"If you must edit this file, set {OVERRIDE_ENV_VAR}=1 in the environment.",
                    file=sys.stderr,
                )
                return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
