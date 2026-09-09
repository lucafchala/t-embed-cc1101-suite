#pragma once

// ============================================================================
// PRECOMPILED HEADER FOR UNIT TESTS
// ============================================================================
// This file is compiled once and shared across all test executables to speed
// up compilation. It includes commonly used headers that rarely change.

// FastLED.h is included directly (not via PCH chaining) to avoid mtime
// validation failures caused by zccache touching FastLED.h.pch.
#include "FastLED.h"

// Test framework and common test utilities
#include "test.h"

// Additional common headers can be added here as needed
