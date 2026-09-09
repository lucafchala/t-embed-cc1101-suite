"""
Comprehensive integration and stress tests for all fingerprint cache types.

Tests cover:
- All three cache types (FingerprintCache, TwoLayerFingerprintCache, HashFingerprintCache)
- Integration scenarios (switching between cache types)
- Stress tests (rapid operations, large file sets, edge cases)
- Performance benchmarks
- Accuracy validation

TwoLayerFingerprintCache and HashFingerprintCache use the zccache-fingerprint CLI
with glob-pattern based APIs.
"""

import tempfile
import time
from pathlib import Path

import pytest

from ci.fingerprint import (
    FingerprintCache,
    HashFingerprintCache,
    TwoLayerFingerprintCache,
)


def create_test_files(test_dir: Path, count: int = 10) -> list[Path]:
    """Create test files in a temporary directory."""
    test_dir.mkdir(parents=True, exist_ok=True)
    files: list[Path] = []
    for i in range(count):
        file_path = test_dir / f"test_file_{i}.txt"
        file_path.write_text(f"Content {i}\n")
        files.append(file_path)
    return sorted(files)


def test_all_caches_basic_functionality() -> None:
    """Test basic functionality across all three cache types."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        files = create_test_files(test_dir, 5)
        include = ["**/*.txt"]
        root = str(test_dir)

        # Test FingerprintCache (legacy - still uses file_paths API)
        cache_file = cache_dir / "fingerprint_cache.json"
        fp_cache = FingerprintCache(cache_file)
        baseline = time.time() - 3600

        changed_files = [f for f in files if fp_cache.has_changed(f, baseline)]
        assert len(changed_files) == 5, (
            f"FingerprintCache: Expected 5 changed files, got {len(changed_files)}"
        )

        # Test TwoLayerFingerprintCache (zccache-fingerprint CLI)
        two_layer = TwoLayerFingerprintCache(cache_dir, "two_layer_test")
        needs_update = two_layer.check_needs_update(include=include, root=root)
        assert needs_update, (
            "TwoLayerFingerprintCache: Expected cache miss on first check"
        )

        two_layer.mark_success()
        needs_update = two_layer.check_needs_update(include=include, root=root)
        assert not needs_update, (
            "TwoLayerFingerprintCache: Expected cache hit on second check"
        )

        # Test HashFingerprintCache (zccache-fingerprint CLI)
        hash_cache = HashFingerprintCache(cache_dir, "hash_test")
        needs_update = hash_cache.check_needs_update(include=include, root=root)
        assert needs_update, "HashFingerprintCache: Expected cache miss on first check"

        hash_cache.mark_success()
        needs_update = hash_cache.check_needs_update(include=include, root=root)
        assert not needs_update, (
            "HashFingerprintCache: Expected cache hit on second check"
        )


def test_touch_optimization_comparison() -> None:
    """Compare touch optimization across TwoLayer and Hash caches."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        files = create_test_files(test_dir, 3)
        include = ["**/*.txt"]
        root = str(test_dir)

        # TwoLayerFingerprintCache
        two_layer = TwoLayerFingerprintCache(cache_dir, "touch_two_layer")
        two_layer.check_needs_update(include=include, root=root)
        two_layer.mark_success()

        # Touch files
        time.sleep(0.05)
        for f in files:
            f.touch()

        # Should NOT need update (smart touch handling - blake3 detects same content)
        needs_update = two_layer.check_needs_update(include=include, root=root)
        assert not needs_update, (
            "TwoLayerFingerprintCache: Touch optimization should not trigger update"
        )

        # HashFingerprintCache uses aggregate blake3 with content hashing
        hash_cache = HashFingerprintCache(cache_dir, "touch_hash")
        hash_cache.check_needs_update(include=include, root=root)
        hash_cache.mark_success()

        # Touch files
        time.sleep(0.05)
        for f in files:
            f.touch()

        # Hash cache also uses content-based blake3 hashing, so touch should NOT trigger
        needs_update = hash_cache.check_needs_update(include=include, root=root)
        # Note: zccache hash cache uses blake3 content hashing, not mtime-based,
        # so it correctly handles touch optimization too
        # (Unlike the old Python HashFingerprintCache which used mtime in hash)


def test_performance_comparison() -> None:
    """Compare performance across cache types."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        create_test_files(test_dir, 100)
        include = ["**/*.txt"]
        root = str(test_dir)

        # TwoLayerFingerprintCache performance
        two_layer = TwoLayerFingerprintCache(cache_dir, "perf_two_layer")
        start = time.time()
        two_layer.check_needs_update(include=include, root=root)
        two_layer_time = time.time() - start
        two_layer.mark_success()

        # Cache hit performance
        start = time.time()
        two_layer.check_needs_update(include=include, root=root)
        two_layer_hit_time = time.time() - start

        assert two_layer_time < 15.0, (
            f"TwoLayerFingerprintCache first check too slow: {two_layer_time:.3f}s"
        )
        assert two_layer_hit_time < 5.0, (
            f"TwoLayerFingerprintCache cache hit too slow: {two_layer_hit_time:.3f}s"
        )

        # HashFingerprintCache performance
        hash_cache = HashFingerprintCache(cache_dir, "perf_hash")
        start = time.time()
        hash_cache.check_needs_update(include=include, root=root)
        hash_time = time.time() - start
        hash_cache.mark_success()

        start = time.time()
        hash_cache.check_needs_update(include=include, root=root)
        hash_hit_time = time.time() - start

        assert hash_time < 5.0, (
            f"HashFingerprintCache first check too slow: {hash_time:.3f}s"
        )
        assert hash_hit_time < 5.0, (
            f"HashFingerprintCache cache hit too slow: {hash_hit_time:.3f}s"
        )


def test_accuracy_all_caches() -> None:
    """Test accuracy of change detection across all cache types."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        files = create_test_files(test_dir, 3)
        include = ["**/*.txt"]
        root = str(test_dir)

        # TwoLayerFingerprintCache accuracy
        two_layer = TwoLayerFingerprintCache(cache_dir, "accuracy_two_layer")
        two_layer.check_needs_update(include=include, root=root)
        two_layer.mark_success()

        # Modify one file
        time.sleep(0.05)
        files[1].write_text("Modified content\n")

        needs_update = two_layer.check_needs_update(include=include, root=root)
        assert needs_update, (
            "TwoLayerFingerprintCache: Should detect single file change"
        )

        # HashFingerprintCache accuracy
        hash_cache = HashFingerprintCache(cache_dir, "accuracy_hash")
        hash_cache.check_needs_update(include=include, root=root)
        hash_cache.mark_success()

        # Modify different file
        time.sleep(0.05)
        files[2].write_text("Different modified content\n")

        needs_update = hash_cache.check_needs_update(include=include, root=root)
        assert needs_update, "HashFingerprintCache: Should detect single file change"


def test_stress_rapid_operations() -> None:
    """Stress test with rapid cache operations."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        create_test_files(test_dir, 10)
        include = ["**/*.txt"]
        root = str(test_dir)

        # TwoLayerFingerprintCache stress
        two_layer = TwoLayerFingerprintCache(cache_dir, "stress_two_layer")
        for _ in range(10):
            needs_update = two_layer.check_needs_update(include=include, root=root)
            if needs_update:
                two_layer.mark_success()
            two_layer.invalidate()

        # HashFingerprintCache stress
        hash_cache = HashFingerprintCache(cache_dir, "stress_hash")
        for _ in range(10):
            needs_update = hash_cache.check_needs_update(include=include, root=root)
            if needs_update:
                hash_cache.mark_success()
            hash_cache.invalidate()


def test_stress_large_files() -> None:
    """Stress test with larger files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        # Create files with larger content (10KB each)
        files: list[Path] = []
        for i in range(5):
            file_path = test_dir / f"large_file_{i}.txt"
            file_path.parent.mkdir(parents=True, exist_ok=True)
            large_content = f"Line {i}\n" * 1000  # ~10KB
            file_path.write_text(large_content)
            files.append(file_path)

        include = ["**/*.txt"]
        root = str(test_dir)

        # TwoLayerFingerprintCache with large files
        two_layer = TwoLayerFingerprintCache(cache_dir, "large_two_layer")
        start = time.time()
        needs_update = two_layer.check_needs_update(include=include, root=root)
        elapsed = time.time() - start

        assert needs_update, "TwoLayerFingerprintCache: Should detect new large files"
        assert elapsed < 5.0, (
            f"TwoLayerFingerprintCache: Large files took {elapsed:.3f}s (expected < 5.0s)"
        )

        # HashFingerprintCache with large files
        hash_cache = HashFingerprintCache(cache_dir, "large_hash")
        start = time.time()
        needs_update = hash_cache.check_needs_update(include=include, root=root)
        elapsed = time.time() - start

        assert needs_update, "HashFingerprintCache: Should detect new large files"
        assert elapsed < 5.0, (
            f"HashFingerprintCache: Large files took {elapsed:.3f}s (expected < 5.0s)"
        )


def test_edge_case_symlinks() -> None:
    """Test edge case with symlinks (if supported)."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        # Create original files
        original = test_dir / "original.txt"
        original.parent.mkdir(parents=True, exist_ok=True)
        original.write_text("Original content")

        # Try to create symlink
        symlink = test_dir / "symlink.txt"
        try:
            symlink.symlink_to(original)
        except (OSError, NotImplementedError):
            pytest.skip("Symlinks not supported on this platform")

        include = ["**/*.txt"]
        root = str(test_dir)

        # Test with TwoLayerFingerprintCache
        two_layer = TwoLayerFingerprintCache(cache_dir, "symlink_two_layer")
        two_layer.check_needs_update(include=include, root=root)
        two_layer.mark_success()

        # Test with HashFingerprintCache
        hash_cache = HashFingerprintCache(cache_dir, "symlink_hash")
        hash_cache.check_needs_update(include=include, root=root)
        hash_cache.mark_success()


def test_edge_case_unicode_filenames() -> None:
    """Test edge case with Unicode filenames."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        test_dir.mkdir(parents=True, exist_ok=True)

        # Create files with Unicode names
        unicode_files = [
            test_dir / "测试文件.txt",  # Chinese
            test_dir / "файл.txt",  # Russian
            test_dir / "αρχείο.txt",  # Greek
        ]

        for f in unicode_files:
            f.write_text("Unicode filename test\n")

        include = ["**/*.txt"]
        root = str(test_dir)

        # TwoLayerFingerprintCache with Unicode
        two_layer = TwoLayerFingerprintCache(cache_dir, "unicode_two_layer")
        two_layer.check_needs_update(include=include, root=root)
        two_layer.mark_success()

        # HashFingerprintCache with Unicode
        hash_cache = HashFingerprintCache(cache_dir, "unicode_hash")
        hash_cache.check_needs_update(include=include, root=root)
        hash_cache.mark_success()


def test_mtime_fast_path_scans_correct_extensions() -> None:
    """Regression test: mtime fast path must scan the right file extensions.

    The mtime fast path in FingerprintManager._mtime_fast_path() scans
    directories for file changes. It must use the correct extensions for
    each test type:
    - C++ tests: .cpp, .h, .hpp, .c, .ino
    - Python tests: .py

    Previously, check_python() used the default C++ extensions when scanning
    ci/, which contains only .py files. This caused the fast path to always
    fire (max_mtime=0.0), silently skipping Python tests forever after the
    first successful run.
    """
    from ci.util.fingerprint import (
        _CPP_SOURCE_EXTS,
        _PY_SOURCE_EXTS,
        _get_max_source_file_mtime,
    )

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Create a directory with only .py files (simulates ci/)
        py_dir = temp_path / "py_only"
        py_dir.mkdir()
        py_file = py_dir / "test_module.py"
        py_file.write_text("def test(): pass\n")

        # Scanning with C++ extensions should find nothing
        cpp_mtime = _get_max_source_file_mtime(py_dir, exts=_CPP_SOURCE_EXTS)
        assert cpp_mtime == 0.0, (
            f"C++ extension scan found files in Python-only dir: mtime={cpp_mtime}"
        )

        # Scanning with Python extensions should find the .py file
        py_mtime = _get_max_source_file_mtime(py_dir, exts=_PY_SOURCE_EXTS)
        assert py_mtime > 0.0, "Python extension scan failed to find .py files"

        # Create a directory with only .cpp files (simulates src/)
        cpp_dir = temp_path / "cpp_only"
        cpp_dir.mkdir()
        cpp_file = cpp_dir / "main.cpp"
        cpp_file.write_text("int main() { return 0; }\n")

        # Scanning with Python extensions should find nothing
        py_mtime2 = _get_max_source_file_mtime(cpp_dir, exts=_PY_SOURCE_EXTS)
        assert py_mtime2 == 0.0, (
            f"Python extension scan found files in C++-only dir: mtime={py_mtime2}"
        )

        # Scanning with C++ extensions should find the .cpp file
        cpp_mtime2 = _get_max_source_file_mtime(cpp_dir, exts=_CPP_SOURCE_EXTS)
        assert cpp_mtime2 > 0.0, "C++ extension scan failed to find .cpp files"

        # Default (no exts) should behave like C++ extensions
        default_mtime = _get_max_source_file_mtime(cpp_dir)
        assert default_mtime == cpp_mtime2, (
            "Default extension scan should match C++ extensions"
        )
        default_py_mtime = _get_max_source_file_mtime(py_dir)
        assert default_py_mtime == 0.0, (
            "Default extension scan should not find .py files"
        )


def test_consistency_after_crash() -> None:
    """Test cache consistency after simulated crash (no mark_success)."""
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test_files"
        cache_dir = temp_path / ".cache"
        cache_dir.mkdir(exist_ok=True)

        create_test_files(test_dir, 3)
        include = ["**/*.txt"]
        root = str(test_dir)

        # TwoLayerFingerprintCache - check but don't mark success (simulated crash)
        two_layer = TwoLayerFingerprintCache(cache_dir, "crash_two_layer")
        two_layer.check_needs_update(include=include, root=root)
        # Intentionally skip mark_success()

        # Create new instance - should still need update
        two_layer2 = TwoLayerFingerprintCache(cache_dir, "crash_two_layer")
        needs_update = two_layer2.check_needs_update(include=include, root=root)
        assert needs_update, (
            "TwoLayerFingerprintCache: Should still need update after crash"
        )

        # HashFingerprintCache - check but don't mark success
        hash_cache = HashFingerprintCache(cache_dir, "crash_hash")
        hash_cache.check_needs_update(include=include, root=root)
        # Intentionally skip mark_success()

        # Create new instance - should still need update
        hash_cache2 = HashFingerprintCache(cache_dir, "crash_hash")
        needs_update = hash_cache2.check_needs_update(include=include, root=root)
        assert needs_update, (
            "HashFingerprintCache: Should still need update after crash"
        )
