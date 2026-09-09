from ci.util.global_interrupt_handler import handle_keyboard_interrupt


#!/usr/bin/env python3
"""
Python Linting Cache Integration

Monitors Python source files and configuration to determine if
pyright type checking needs to be re-run.

Uses zccache-fingerprint (Rust/blake3) for fast change detection.
"""

import sys
from pathlib import Path

from ci.fingerprint import TwoLayerFingerprintCache
from ci.util.color_output import print_cache_hit, print_cache_miss


# Glob patterns for Python lint monitoring
_PYTHON_LINT_INCLUDE = [
    "test.py",
    "ci/**/*.py",
    "pyproject.toml",
]

_PYTHON_LINT_EXCLUDE = [
    "ci/tmp/**",
    "ci/wasm/**",
]


def _get_python_lint_cache() -> TwoLayerFingerprintCache:
    """Get the two-layer fingerprint cache for Python linting."""
    cache_dir = Path(".cache")
    return TwoLayerFingerprintCache(cache_dir, "python_lint")


def check_python_files_changed() -> bool:
    """
    Check if Python files have changed since the last successful lint run.

    Uses zccache-fingerprint for blake3-based change detection.

    Returns:
        True if files changed and pyright should run
        False if no changes detected and pyright can be skipped
    """
    cache = _get_python_lint_cache()
    needs_update = cache.check_needs_update(
        include=_PYTHON_LINT_INCLUDE,
        exclude=_PYTHON_LINT_EXCLUDE,
    )

    if needs_update:
        print_cache_miss("Python files changed - running pyright")
        return True
    else:
        print_cache_hit("No Python changes detected - skipping pyright")
        return False


def mark_python_lint_success() -> None:
    """
    Mark the current Python lint run as successful.

    Uses the safe pre-computed fingerprint pattern - saves the fingerprint
    that was computed before linting started.
    """
    cache = _get_python_lint_cache()

    try:
        cache.mark_success()
        print("📝 Python lint success fingerprint updated")
    except RuntimeError as e:
        print(f"⚠️  Python fingerprint update failed: {e}")
        print(
            "    This indicates check_python_files_changed() was not called before linting"
        )


def invalidate_python_cache() -> None:
    """Invalidate the cache when lint/test fails, forcing a re-run next time."""
    cache = _get_python_lint_cache()

    try:
        cache.invalidate()
        print_cache_miss(
            "Python lint cache invalidated - will re-run pyright next time"
        )
    except KeyboardInterrupt as ki:
        handle_keyboard_interrupt(ki)
        raise
    except Exception as e:
        print_cache_miss(f"Failed to invalidate Python cache: {e}")


def main() -> int:
    """Main entry point for Python lint cache checking."""
    if len(sys.argv) < 2:
        print("Usage: python ci/python_lint_cache.py [check|success|failure]")
        return 1

    command = sys.argv[1]

    if command == "check":
        # Check if pyright is needed
        needs_lint = check_python_files_changed()
        return 0 if needs_lint else 1  # Exit 1 means skip pyright

    elif command == "success":
        # Mark lint as successful
        mark_python_lint_success()
        return 0

    elif command == "failure":
        # Invalidate cache on failure
        invalidate_python_cache()
        return 0

    else:
        print(f"Unknown command: {command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
