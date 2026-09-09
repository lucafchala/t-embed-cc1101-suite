// Per-phase profiling of FlowFieldFP to identify bottlenecks.
//
// Measures: syncParams, flowPrepare, emitters, flowAdvect, output copy
// individually to determine where time is spent.

#include "FastLED.h"
#include "fl/fx/2d/flowfield.h"
#include "fl/stl/cstring.h"
#include "fl/stl/stdio.h"
#include "tests/profile/profile_result.h"

static const uint16_t W = 22;
static const uint16_t H = 22;
static const uint16_t N = W * H;

static const int WARMUP_FRAMES = 20;
static const int PROFILE_FRAMES = 500;

namespace fl {

/// Friend struct declared in flowfield.h — accesses private methods.
struct FlowFieldFPProfiler {
    FlowFieldFP &fx;
    CRGB *leds;

    FlowFieldFPProfiler(FlowFieldFP &fx_, CRGB *leds_) : fx(fx_), leds(leds_) {}

    void warmup(int frames) {
        for (int i = 0; i < frames; i++) {
            u32 t = static_cast<u32>(i * 33);
            Fx::DrawContext ctx(t, leds);
            fx.draw(ctx);
        }
    }

    // Run each phase separately with timing.
    // Simulates what drawImpl does but with per-phase measurement.
    struct PhaseTimings {
        u32 sync_us;
        u32 prepare_us;
        u32 emitters_us;
        u32 advect_us;
        u32 output_us;
        u32 total_us;
    };

    PhaseTimings profilePhases(int frames, int start_frame) {
        PhaseTimings t = {};
        constexpr s16x16 ms_to_sec(0.001f);

        for (int i = 0; i < frames; i++) {
            u32 now = static_cast<u32>((start_frame + i) * 33);
            u32 dt_ms = 33;
            u32 t_ms = now;

            u32 t0, t1;

            // Phase 1: syncParams
            t0 = ::micros();
            fx.syncParams();
            t1 = ::micros();
            t.sync_us += t1 - t0;

            s16x16 dt_fp = s16x16(static_cast<i32>(dt_ms)) * ms_to_sec;
            s16x16 t_fp = s16x16(static_cast<i32>(t_ms)) * ms_to_sec;

            // Phase 2: flowPrepare
            t0 = ::micros();
            fx.flowPrepare(t_fp);
            t1 = ::micros();
            t.prepare_us += t1 - t0;

            // Phase 3: emitters
            t0 = ::micros();
            fx.emitLissajousLine(t_fp);
            t1 = ::micros();
            t.emitters_us += t1 - t0;

            // Phase 4: flowAdvect
            t0 = ::micros();
            fx.flowAdvect(dt_fp.raw());
            t1 = ::micros();
            t.advect_us += t1 - t0;

            // Phase 5: output copy
            // For rectangular grid, mapToIndex(x,y) == y*w+x == idx(y,x)
            t0 = ::micros();
            {
                int w = fx.mState.width;
                int h = fx.mState.height;
                for (int y = 0; y < h; y++) {
                    for (int x = 0; x < w; x++) {
                        int gi = fx.idx(y, x);
                        leds[gi].r = FlowFieldFP::q16_to_u8(fx.mState.r[gi]);
                        leds[gi].g = FlowFieldFP::q16_to_u8(fx.mState.g[gi]);
                        leds[gi].b = FlowFieldFP::q16_to_u8(fx.mState.b[gi]);
                    }
                }
            }
            t1 = ::micros();
            t.output_us += t1 - t0;
        }

        t.total_us = t.sync_us + t.prepare_us + t.emitters_us +
                     t.advect_us + t.output_us;
        return t;
    }
};

}  // namespace fl

using namespace fl;

int main(int argc, char *argv[]) {
    (void)argc;
    (void)argv;

    CRGB leds[N] = {};
    XYMap xy = XYMap::constructRectangularGrid(W, H);
    FlowFieldFP fx(xy);

    FlowFieldFPProfiler profiler(fx, leds);

    // Warmup
    profiler.warmup(WARMUP_FRAMES);

    // Profile
    auto t = profiler.profilePhases(PROFILE_FRAMES, WARMUP_FRAMES);

    double total = static_cast<double>(t.total_us);
    auto pct = [&](u32 v) -> double { return 100.0 * v / total; };
    auto ns_per = [&](u32 v) -> double {
        return static_cast<double>(v) * 1000.0 / PROFILE_FRAMES;
    };

    printf("FlowFieldFP Phase Breakdown (%d frames, %dx%d)\n",
           PROFILE_FRAMES, W, H);
    printf("%-14s %8s %8s %7s\n", "Phase", "Total us", "ns/frame", "  %");
    printf("----------------------------------------------\n");
    printf("%-14s %8u %8.0f %6.1f%%\n", "syncParams",
           t.sync_us, ns_per(t.sync_us), pct(t.sync_us));
    printf("%-14s %8u %8.0f %6.1f%%\n", "flowPrepare",
           t.prepare_us, ns_per(t.prepare_us), pct(t.prepare_us));
    printf("%-14s %8u %8.0f %6.1f%%\n", "emitters",
           t.emitters_us, ns_per(t.emitters_us), pct(t.emitters_us));
    printf("%-14s %8u %8.0f %6.1f%%\n", "flowAdvect",
           t.advect_us, ns_per(t.advect_us), pct(t.advect_us));
    printf("%-14s %8u %8.0f %6.1f%%\n", "output",
           t.output_us, ns_per(t.output_us), pct(t.output_us));
    printf("----------------------------------------------\n");
    printf("%-14s %8u %8.0f %6.1f%%\n", "TOTAL",
           t.total_us, ns_per(t.total_us), 100.0);

    // JSON output for profiling pipeline
    ProfileResultBuilder::print_result("fp_breakdown", "flowfield",
                                       PROFILE_FRAMES, t.total_us);

    return 0;
}
