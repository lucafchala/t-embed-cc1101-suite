#!/usr/bin/env python3
"""Checker for backslash-containing paths in meson.build files.

On Windows, meson.project_source_root() and meson.current_source_dir() return
native backslash paths (e.g. C:\\Users\\...), but the '/' operator normalizes
to forward slashes (e.g. C:/Users/.../src). Mixing the two in -I flags breaks
#pragma once across PCH boundaries because clang treats them as different files.

Rule: String concatenation with meson path functions must route through the
'/' operator to normalize separators. Direct concatenation like
  '-I' + meson.project_source_root()
is flagged — use
  '-I' + meson.project_source_root() / '.'
instead.
"""

import re

from ci.util.check_files import FileContent, FileContentChecker


# Pattern: string literal ending with + path_func WITHOUT a trailing / operator
# Matches:  '-I' + meson.project_source_root()
#           '-I' + meson.project_source_root(),
# Skips:    '-I' + meson.project_source_root() / 'src'
#           '-I' + meson.project_source_root() / '.'
#           '-I' + _var_already_normalized
_CONCAT_PATTERN = re.compile(
    r"""['"].*?['"]     # String literal (non-greedy, single or double quotes)
    \s*\+\s*            # Plus operator with optional whitespace
    (meson\.(?:project_source_root|project_build_root|current_source_dir|current_build_dir|global_source_root|global_build_root)\(\))
    \s*                 # Optional trailing whitespace
    (?!\s*/)            # NOT followed by optional whitespace then '/' operator
    """,
    re.VERBOSE,
)


class BackslashPathChecker(FileContentChecker):
    """Detects meson path expressions that produce backslash-separated paths."""

    def __init__(self) -> None:
        self.violations: dict[str, list[tuple[int, str]]] = {}

    def should_process_file(self, file_path: str) -> bool:
        normalized = file_path.replace("\\", "/")
        return normalized.endswith("meson.build")

    def check_file_content(self, file_content: FileContent) -> list[str]:
        for line_number, line in enumerate(file_content.lines, 1):
            stripped = line.strip()
            # Skip comments
            if stripped.startswith("#"):
                continue

            match = _CONCAT_PATTERN.search(stripped)
            if match:
                func_name = match.group(1)
                self.violations.setdefault(file_content.path, []).append(
                    (
                        line_number,
                        f"Direct string concatenation with {func_name} produces "
                        f"native backslash paths on Windows, which breaks #pragma once "
                        f"across PCH boundaries. Use the '/' operator to normalize: "
                        f"{func_name} / '.'",
                    )
                )
        return []
