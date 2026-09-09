"""
IWYU Per-File Result Cache

Caches IWYU analysis results per source file, keyed by content hash
plus a source-tree hash that captures the state of all scanned headers.

Cache is stored in .cache/iwyu/results.json.

Design:
- Cache key: SHA256(file_content + compiler_args + source_tree_hash)
- source_tree_hash: SHA256 of sorted (path, mtime) pairs for all headers
  → any header change invalidates the entire cache (correct for transitive deps)
- Cache value: list of removal strings (empty list = no violations)
- Cache is checked/updated in the main process before/after worker dispatch
- Workers only run for cache misses

Invalidation:
- File content change → automatic miss (hash changes)
- ANY header in src/fl/ changes → all entries miss (source tree hash changes)
- --no-cache flag → bypass cache entirely
- --fix flag → cache is cleared after fixes (files change)
- Manual: delete .cache/iwyu/ directory
"""

import hashlib
import json
import os
import time
from pathlib import Path


_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_CACHE_DIR = _PROJECT_ROOT / ".cache" / "iwyu"
_CACHE_FILE = _CACHE_DIR / "results.json"


def compute_source_tree_hash(header_files: list[Path]) -> str:
    """Compute a hash over all header files' paths and mtimes.

    This acts as a "generation" marker: when any header changes,
    the hash changes, invalidating all cached IWYU results.
    Correctly handles transitive dependency changes.

    Args:
        header_files: All headers that IWYU will scan.

    Returns:
        Hex digest string.
    """
    hasher = hashlib.sha256()
    for f in sorted(header_files, key=str):
        hasher.update(str(f).encode("utf-8"))
        try:
            hasher.update(str(os.path.getmtime(str(f))).encode("utf-8"))
        except OSError:
            hasher.update(b"MISSING")
    return hasher.hexdigest()


def _compute_file_hash(
    file_path: Path, compiler_args_key: str, source_tree_hash: str
) -> str:
    """Compute SHA256 hash of file content + compiler args + source tree state.

    Args:
        file_path: Path to source file.
        compiler_args_key: String representation of compiler args.
        source_tree_hash: Combined hash of all header mtimes.

    Returns:
        Hex digest string.
    """
    hasher = hashlib.sha256()
    hasher.update(compiler_args_key.encode("utf-8"))
    hasher.update(source_tree_hash.encode("utf-8"))
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                hasher.update(chunk)
    except OSError:
        hasher.update(str(time.time()).encode("utf-8"))
    return hasher.hexdigest()


class IWYUCache:
    """Per-file IWYU result cache with source-tree-aware invalidation."""

    def __init__(self, enabled: bool = True) -> None:
        self._enabled = enabled
        self._data: dict[str, dict[str, list[str] | float | str]] = {}
        self._hits = 0
        self._misses = 0
        self._source_tree_hash = ""
        if enabled:
            self._load()

    def set_source_tree_hash(self, h: str) -> None:
        """Set the source tree hash for this session.

        Must be called before get()/put(). Computed once by the caller
        from the full list of header files.
        """
        self._source_tree_hash = h

    def _load(self) -> None:
        """Load cache from disk."""
        try:
            if _CACHE_FILE.exists():
                with open(_CACHE_FILE, "r") as f:
                    raw = json.load(f)
                if isinstance(raw, dict):
                    self._data = raw
        except (json.JSONDecodeError, OSError):
            self._data = {}

    def _save(self) -> None:
        """Persist cache to disk."""
        if not self._enabled:
            return
        try:
            _CACHE_DIR.mkdir(parents=True, exist_ok=True)
            with open(_CACHE_FILE, "w") as f:
                json.dump(self._data, f, separators=(",", ":"))
        except OSError:
            pass  # Non-fatal

    def get(self, file_path: Path, compiler_args_key: str) -> list[str] | None:
        """Look up cached IWYU result for a file.

        Args:
            file_path: Source file path.
            compiler_args_key: Compiler args fingerprint.

        Returns:
            List of removal strings if cached (empty list = clean),
            or None on cache miss.
        """
        if not self._enabled:
            self._misses += 1
            return None

        file_hash = _compute_file_hash(
            file_path, compiler_args_key, self._source_tree_hash
        )
        key = str(file_path)

        entry = self._data.get(key)
        if entry is not None and entry.get("hash") == file_hash:
            removals = entry.get("removals")
            if isinstance(removals, list):
                self._hits += 1
                return removals

        self._misses += 1
        return None

    def put(self, file_path: Path, compiler_args_key: str, removals: list[str]) -> None:
        """Store IWYU result for a file.

        Args:
            file_path: Source file path.
            compiler_args_key: Compiler args fingerprint.
            removals: List of removal strings (empty = clean).
        """
        if not self._enabled:
            return

        file_hash = _compute_file_hash(
            file_path, compiler_args_key, self._source_tree_hash
        )
        self._data[str(file_path)] = {
            "hash": file_hash,
            "removals": removals,
            "timestamp": time.time(),
        }

    def save(self) -> None:
        """Flush cache to disk. Call after all updates."""
        self._save()

    def clear(self) -> None:
        """Clear all cached results."""
        self._data = {}
        try:
            if _CACHE_FILE.exists():
                _CACHE_FILE.unlink()
        except OSError:
            pass

    @property
    def hits(self) -> int:
        return self._hits

    @property
    def misses(self) -> int:
        return self._misses

    def stats_summary(self) -> str:
        """Return a one-line summary of cache performance."""
        total = self._hits + self._misses
        if total == 0:
            return "cache: no lookups"
        rate = (self._hits / total) * 100
        return f"cache: {self._hits}/{total} hits ({rate:.0f}%)"
