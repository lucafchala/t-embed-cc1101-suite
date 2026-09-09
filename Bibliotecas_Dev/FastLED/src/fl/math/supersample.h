#pragma once

namespace fl {
enum class SuperSample {
    SUPER_SAMPLE_NONE = 1, // 1x supersampling (no supersampling)
    SUPER_SAMPLE_2X = 2,   // 2x supersampling
    SUPER_SAMPLE_4X = 4,   // 4x supersampling
    SUPER_SAMPLE_8X = 8    // 8x supersampling
};
} // namespace fl