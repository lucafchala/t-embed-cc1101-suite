#!/usr/bin/env python3
"""
Unified Test Caching

Provides unified safe fingerprint caching for test.py to replace the multiple
custom fingerprint implementations with the single safe approach.

Uses zccache-fingerprint (Rust/blake3) for fast change detection.
"""

from pathlib import Path
from typing import Optional

from ci.fingerprint import HashFingerprintCache


# Glob patterns for each cache type
SRC_CODE_INCLUDE = [
    "src/**/*.h",
    "src/**/*.hpp",
    "src/**/*.cpp",
    "src/**/*.c",
]

CPP_TEST_INCLUDE = [
    "src/**/*.h",
    "src/**/*.hpp",
    "src/**/*.cpp",
    "src/**/*.c",
    "tests/**/*.h",
    "tests/**/*.hpp",
    "tests/**/*.cpp",
    "tests/**/*.c",
]

EXAMPLES_INCLUDE = [
    "src/**/*.h",
    "src/**/*.hpp",
    "src/**/*.cpp",
    "src/**/*.c",
    "examples/**/*.ino",
    "examples/**/*.h",
    "examples/**/*.hpp",
    "examples/**/*.cpp",
    "examples/**/*.c",
]

PYTHON_TEST_INCLUDE = [
    "test*.py",
    "ci/**/*.py",
    "**/test_*.py",
    "pyproject.toml",
]


class UnifiedTestCache:
    """Unified safe cache for test.py operations."""

    def __init__(
        self,
        cache_name: str,
        cache_dir: Optional[Path] = None,
        timestamp_file: Optional[Path] = None,
    ):
        if cache_dir is None:
            cache_dir = Path(".cache")
        cache_dir.mkdir(parents=True, exist_ok=True)
        self.cache = HashFingerprintCache(
            cache_dir, cache_name, timestamp_file=timestamp_file
        )
        self.cache_name = cache_name

    def check_needs_update(
        self,
        include: list[str],
        exclude: list[str] | None = None,
    ) -> bool:
        """
        Check if files have changed and need processing.

        Args:
            include: Glob patterns for files to monitor.
            exclude: Optional glob patterns to exclude.

        Returns:
            True if processing is needed, False if cache is valid.
        """
        return self.cache.check_needs_update(include=include, exclude=exclude)

    def mark_success(self) -> None:
        """Mark the test/process as successful."""
        self.cache.mark_success()

    def invalidate(self) -> None:
        """Invalidate cache on failure."""
        self.cache.invalidate()


def create_src_code_cache() -> UnifiedTestCache:
    """
    Create cache for source code fingerprinting.

    Writes timestamp file (.build/src_code.timestamp) when src/** changes.
    This allows other tools to quickly check if rebuild is needed.
    """
    timestamp_file = Path(".build") / "src_code.timestamp"
    return UnifiedTestCache("src_code", timestamp_file=timestamp_file)


def create_cpp_test_cache() -> UnifiedTestCache:
    """Create cache for C++ test fingerprinting."""
    return UnifiedTestCache("cpp_test")


def create_examples_cache() -> UnifiedTestCache:
    """Create cache for examples fingerprinting."""
    return UnifiedTestCache("examples")


def create_python_test_cache() -> UnifiedTestCache:
    """Create cache for Python test fingerprinting."""
    return UnifiedTestCache("python_test")
