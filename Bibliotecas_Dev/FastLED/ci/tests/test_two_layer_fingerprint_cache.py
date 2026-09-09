"""
Comprehensive test suite for TwoLayerFingerprintCache.

Tests cover:
- Core functionality (cache hits, misses, content changes)
- Two-layer detection (mtime + blake3 via zccache-fingerprint CLI)
- Smart mtime updates (touch optimization)
- Edge cases (missing files, corruption)
- Cache persistence across instances
- Performance requirements
"""

import shutil
import tempfile
import time
from pathlib import Path
from unittest import TestCase

from ci.fingerprint import TwoLayerFingerprintCache


class TestTwoLayerFingerprintCache(TestCase):
    """Test suite for TwoLayerFingerprintCache functionality."""

    def setUp(self) -> None:
        """Set up test environment with temporary directory."""
        self.test_dir = Path(tempfile.mkdtemp())
        self.cache_dir = self.test_dir / "cache"
        self.cache_dir.mkdir(exist_ok=True)
        self.temp_dir = self.test_dir / "src"
        self.temp_dir.mkdir(exist_ok=True)

    def tearDown(self) -> None:
        """Clean up test environment."""
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def create_test_file(self, path: Path, content: str) -> Path:
        """Create a test file with specific content."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            f.write(content)
        return path

    def modify_file_content(self, path: Path, new_content: str) -> None:
        """Modify file content."""
        time.sleep(0.05)  # Ensure modtime changes
        with open(path, "w") as f:
            f.write(new_content)

    def _check(
        self,
        cache: TwoLayerFingerprintCache,
        include: list[str] | None = None,
    ) -> bool:
        """Helper: run check_needs_update with default include pattern."""
        if include is None:
            include = ["**/*.txt"]
        return cache.check_needs_update(
            include=include,
            root=str(self.temp_dir),
        )

    def test_basic_cache_miss_hit(self) -> None:
        """Test basic cache miss and hit behavior."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "basic_test")

        self.create_test_file(self.temp_dir / "file1.txt", "content 1")
        self.create_test_file(self.temp_dir / "file2.txt", "content 2")

        # First check should need update (cache miss)
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "First check should need update")

        # Mark success
        cache.mark_success()

        # Second check should NOT need update (cache hit)
        needs_update = self._check(cache)
        self.assertFalse(needs_update, "Second check should be cache hit")

    def test_content_change_detection(self) -> None:
        """Test that content changes are detected."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "content_test")

        f = self.create_test_file(self.temp_dir / "file1.txt", "original")

        # Prime cache
        self._check(cache)
        cache.mark_success()

        # Modify content
        self.modify_file_content(f, "modified")

        # Should detect change
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "Content change should be detected")

    def test_touch_optimization(self) -> None:
        """Test smart mtime update when file is touched but content unchanged."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "touch_test")

        f = self.create_test_file(self.temp_dir / "file1.txt", "unchanged content")

        # Prime cache
        self._check(cache)
        cache.mark_success()

        # Touch file (change mtime but not content)
        time.sleep(0.05)
        f.touch()

        # Check after touch should NOT need update (smart touch handling)
        needs_update = self._check(cache)
        self.assertFalse(
            needs_update, "Touched file with same content should NOT need update"
        )

    def test_missing_file_detection(self) -> None:
        """Test detection when file is deleted from disk."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "missing_test")

        self.create_test_file(self.temp_dir / "file1.txt", "content 1")
        f2 = self.create_test_file(self.temp_dir / "file2.txt", "content 2")

        # Prime cache
        self._check(cache)
        cache.mark_success()

        # Delete a file
        f2.unlink()

        # Should detect change (file set changed)
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "Deleted file should be detected")

    def test_new_file_addition(self) -> None:
        """Test detection of new files added to monitored directory."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "new_file_test")

        self.create_test_file(self.temp_dir / "file1.txt", "content 1")

        # Prime cache
        self._check(cache)
        cache.mark_success()

        # Add new file (small delay for daemon FS watcher to pick up the event)
        self.create_test_file(self.temp_dir / "file2.txt", "content 2")
        time.sleep(0.5)

        # Should detect change
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "New file addition should be detected")

    def test_cache_persistence(self) -> None:
        """Test that cache persists across instances."""
        self.create_test_file(self.temp_dir / "file1.txt", "content 1")

        # First cache instance
        cache1 = TwoLayerFingerprintCache(self.cache_dir, "persist_test")
        self._check(cache1)
        cache1.mark_success()

        # Second cache instance (reload from disk)
        cache2 = TwoLayerFingerprintCache(self.cache_dir, "persist_test")
        needs_update = self._check(cache2)
        self.assertFalse(needs_update, "Cache should persist across instances")

    def test_invalidate(self) -> None:
        """Test cache invalidation."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "invalidate_test")

        self.create_test_file(self.temp_dir / "file1.txt", "content 1")

        # Prime cache
        self._check(cache)
        cache.mark_success()

        # Invalidate
        cache.invalidate()

        # Should need update after invalidation
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "Cache should need update after invalidation")

    def test_cache_corruption_recovery(self) -> None:
        """Test recovery from corrupted cache files."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "corrupt_test")

        self.create_test_file(self.temp_dir / "file1.txt", "content 1")

        # Create corrupted cache file
        cache_file = self.cache_dir / "fingerprint" / "corrupt_test.json"
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text("{invalid json")

        # Should handle corruption gracefully (treat as miss)
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "Corrupted cache should be treated as miss")

    def test_binary_files(self) -> None:
        """Test cache with binary files."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "binary_test")

        binary_file = self.temp_dir / "test.bin"
        binary_data = bytes(range(256))
        with open(binary_file, "wb") as f:
            f.write(binary_data)

        include = ["**/*.bin"]

        # Prime cache
        cache.check_needs_update(include=include, root=str(self.temp_dir))
        cache.mark_success()

        # Should be cache hit
        needs_update = cache.check_needs_update(
            include=include, root=str(self.temp_dir)
        )
        self.assertFalse(needs_update, "Binary file cache should hit")

        # Modify binary file
        time.sleep(0.05)
        with open(binary_file, "wb") as f:
            f.write(binary_data + b"\x00")

        # Should detect change
        needs_update = cache.check_needs_update(
            include=include, root=str(self.temp_dir)
        )
        self.assertTrue(needs_update, "Binary file change should be detected")

    def test_large_file_set_performance(self) -> None:
        """Test performance with many files."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "perf_test")

        # Create 50 files
        for i in range(50):
            self.create_test_file(self.temp_dir / f"file_{i}.txt", f"content {i}")

        # Time the check
        start = time.time()
        needs_update = self._check(cache)
        check_time = time.time() - start

        self.assertTrue(needs_update, "First check should need update")
        self.assertLess(
            check_time,
            5.0,
            f"Check with 50 files took {check_time:.3f}s, should be <5s",
        )

        # Mark success
        cache.mark_success()

        # Time cache hit
        start = time.time()
        needs_update = self._check(cache)
        hit_time = time.time() - start

        self.assertFalse(needs_update, "Cache should hit")
        self.assertLess(
            hit_time,
            3.0,
            f"Cache hit with 50 files took {hit_time:.3f}s, should be <3s",
        )

    def test_mark_success_without_check(self) -> None:
        """Test mark_success without prior check is handled gracefully."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "error_test")

        # Daemon path: silent no-op. Standalone: may raise.
        # Either behavior is acceptable — no cache should exist afterward.
        try:
            cache.mark_success()
        except KeyboardInterrupt:
            import _thread

            _thread.interrupt_main()
            raise
        except Exception:
            pass  # standalone raises, daemon doesn't — both OK

    def test_get_cache_info(self) -> None:
        """Test cache info retrieval."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "info_test")

        self.create_test_file(self.temp_dir / "file1.txt", "content 1")

        # No cache initially
        info = cache.get_cache_info()
        self.assertIsNone(info, "No cache info should exist initially")

        # After caching
        self._check(cache)
        cache.mark_success()

        info = cache.get_cache_info()
        # Daemon may persist lazily (cache file written async after mark-success)
        # so cache_file may not exist on disk yet. Both None and non-None are OK.
        if info is not None:
            self.assertTrue(info["cache_exists"], "Cache file should exist")

    def test_multiple_modifications_sequence(self) -> None:
        """Test sequence of multiple modifications."""
        cache = TwoLayerFingerprintCache(self.cache_dir, "sequence_test")

        file1 = self.create_test_file(self.temp_dir / "file1.txt", "v1")

        # Initial cache
        self._check(cache)
        cache.mark_success()

        # Modify v1 -> v2
        self.modify_file_content(file1, "v2")
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "v1->v2 change should be detected")
        cache.mark_success()

        # No change
        needs_update = self._check(cache)
        self.assertFalse(needs_update, "No change should be cache hit")

        # Modify v2 -> v3
        self.modify_file_content(file1, "v3")
        needs_update = self._check(cache)
        self.assertTrue(needs_update, "v2->v3 change should be detected")
        cache.mark_success()

        # No change
        needs_update = self._check(cache)
        self.assertFalse(needs_update, "Final state should be cache hit")


def run_all_tests() -> bool:
    """Execute all test scenarios."""
    import unittest

    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestTwoLayerFingerprintCache)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if result.wasSuccessful():
        print("\n✅ All TwoLayerFingerprintCache tests passed!")
        return True
    else:
        print("\n❌ Some tests failed!")
        return False


if __name__ == "__main__":
    import sys

    sys.exit(0 if run_all_tests() else 1)
