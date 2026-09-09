#pragma once

#include "fl/stl/stdint.h"

namespace fl {

/// Lightweight snapshot of pre-computed audio analysis for one audio sample.
/// Accumulated between visual frames; effects receive a span of these via
/// DrawContext::audio.
struct AudioFrame {
    float bass = 0.0f;       ///< Bass energy (0.0-1.0, normalized)
    float mid = 0.0f;        ///< Mid energy (0.0-1.0, normalized)
    float treble = 0.0f;     ///< Treble energy (0.0-1.0, normalized)
    float volume = 0.0f;     ///< Overall volume (0.0-1.0, normalized RMS)
    bool beat = false;       ///< True if a beat was detected this sample
    fl::u32 timestamp = 0;   ///< When this audio sample was captured (ms)
};

} // namespace fl
