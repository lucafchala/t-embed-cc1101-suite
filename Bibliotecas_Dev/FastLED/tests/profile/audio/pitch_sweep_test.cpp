// Pitch Sweep Test — Aliasing & Spectral Quality Analysis
//
// Sweeps a sine wave across the full matrix of Mode × Window
// configurations. Two sweep regions:
//
//   1. In-band:  fmin → fmax  (where the FFT has valid bins)
//   2. Out-of-band: fmax → Nyquist  (above configured range)
//
// For each frequency step, records:
//   - Peak bin index and its center frequency
//   - Energy concentration (fraction in peak ±1 bins)
//   - Whether the peak bin is monotonically increasing
//   - Aliasing flag (peak frequency dropping >20% vs previous step)
//
// Outputs a JSON array suitable for offline plotting / analysis.
//
// Usage:
//   ./pitch_sweep_test.exe              # Human-readable report
//   ./pitch_sweep_test.exe json         # JSON output to stdout

// IWYU pragma: begin_keep
#include "third_party/cq_kernel/cq_kernel.h"
#include "third_party/cq_kernel/kiss_fftr.h"
// IWYU pragma: end_keep
#include "fl/audio/fft/fft.h"
#include "fl/audio/fft/fft_impl.h"
#include "fl/stl/int.h"
#include "fl/stl/json.h"
#include "fl/math/math.h"
#include "fl/stl/stdio.h"
#include "fl/stl/string.h"
#include "fl/stl/vector.h"

namespace {

using namespace ::fl;

// ---------------------------------------------------------------------------
// Sine-wave generator
// ---------------------------------------------------------------------------
static void generateSine(fl::vector<fl::i16> &buf, int samples,
                          int sampleRate, float freq,
                          float amplitude = 30000.0f) {
    buf.resize(samples);
    for (int i = 0; i < samples; i++) {
        float t = static_cast<float>(i) / static_cast<float>(sampleRate);
        float s = fl::sinf(2.0f * static_cast<float>(FL_M_PI) * freq * t);
        buf[i] = static_cast<fl::i16>(s * amplitude);
    }
}

// ---------------------------------------------------------------------------
// Helper: find peak bin
// ---------------------------------------------------------------------------
static int peakBin(fl::span<const float> bins) {
    int best = 0;
    float bestVal = 0.0f;
    for (int i = 0; i < static_cast<int>(bins.size()); i++) {
        if (bins[i] > bestVal) {
            bestVal = bins[i];
            best = i;
        }
    }
    return best;
}

// ---------------------------------------------------------------------------
// Helper: energy concentration in peak ±1 bins (fraction of total energy)
// ---------------------------------------------------------------------------
static float energyConcentration(fl::span<const float> bins, int peak) {
    float total = 0.0f;
    float peakEnergy = 0.0f;
    for (int i = 0; i < static_cast<int>(bins.size()); i++) {
        float e = bins[i] * bins[i];
        total += e;
        if (i >= peak - 1 && i <= peak + 1) {
            peakEnergy += e;
        }
    }
    if (total <= 0.0f)
        return 0.0f;
    return peakEnergy / total;
}

// ---------------------------------------------------------------------------
// Mode / Window enum tables
// ---------------------------------------------------------------------------
struct ModeEntry {
    Mode mode;
    const char *label;
};

static const ModeEntry MODES[] = {
    {Mode::LOG_REBIN, "LOG_REBIN"},
    {Mode::CQ_NAIVE, "CQ_NAIVE"},
    {Mode::CQ_OCTAVE, "CQ_OCTAVE"},
    {Mode::CQ_HYBRID, "CQ_HYBRID"},
};
static const int NUM_MODES = 4;

struct WindowEntry {
    Window window;
    const char *label;
};

static const WindowEntry WINDOWS[] = {
    {Window::NONE, "NONE"},
    {Window::HANNING, "HANNING"},
    {Window::BLACKMAN_HARRIS, "BLACKMAN_HARRIS"},
};
static const int NUM_WINDOWS = 3;

// ---------------------------------------------------------------------------
// Per-frequency-step result
// ---------------------------------------------------------------------------
struct SweepPoint {
    float inputFreq;
    int peakBinIdx;
    float peakBinFreq;
    float concentration; // energy in peak ±1 vs total
    bool monotonic;      // peak bin >= previous step's peak bin
    bool aliased;        // peak bin freq dropped >20% vs previous step
    bool inBand;         // true if inputFreq <= fmax
};

// ---------------------------------------------------------------------------
// Run a single sweep for one (mode, window) pair
// Sweeps from fmin to sweepMax (Nyquist) in log-spaced steps.
// Points where inputFreq > fmax are marked as out-of-band.
// ---------------------------------------------------------------------------
static void runSweep(Mode mode, Window window,
                     int samples, int bands, float fmin, float fmax,
                     int sampleRate, int numSteps,
                     fl::vector<SweepPoint> &out) {
    Args args(samples, bands, fmin, fmax, sampleRate, mode, window);
    Impl fft(args);
    Bins bins(bands);
    fl::vector<fl::i16> signal;

    // Sweep from fmin to Nyquist in log-spaced steps
    float nyquist = static_cast<float>(sampleRate) / 2.0f;
    float logMin = fl::logf(fmin);
    float logMax = fl::logf(nyquist);

    int prevPeakBin = -1;
    float prevPeakFreq = -1.0f;

    out.clear();
    for (int step = 0; step < numSteps; step++) {
        float t = static_cast<float>(step) / static_cast<float>(numSteps - 1);
        float freq = fl::expf(logMin + t * (logMax - logMin));

        generateSine(signal, samples, sampleRate, freq);
        fft.run(signal, &bins);

        int peak = peakBin(bins.raw());
        float peakFreq = bins.binToFreq(peak);
        float conc = energyConcentration(bins.raw(), peak);

        SweepPoint pt;
        pt.inputFreq = freq;
        pt.peakBinIdx = peak;
        pt.peakBinFreq = peakFreq;
        pt.concentration = conc;
        pt.monotonic = (peak >= prevPeakBin);
        pt.aliased = (prevPeakFreq > 0.0f && peakFreq < prevPeakFreq * 0.8f);
        pt.inBand = (freq <= fmax);

        out.push_back(pt);
        prevPeakBin = peak;
        prevPeakFreq = peakFreq;
    }
}

// ---------------------------------------------------------------------------
// Compute summary stats for a subset of sweep points
// ---------------------------------------------------------------------------
struct SweepSummary {
    int aliasingEvents;
    int nonMonotonicEvents;
    float minConcentration;
    float avgConcentration;
    int totalSteps;
};

static SweepSummary computeSummary(const fl::vector<SweepPoint> &points,
                                    bool inBandOnly) {
    SweepSummary s = {};
    s.minConcentration = 1.0f;
    float concSum = 0.0f;

    for (int i = 0; i < static_cast<int>(points.size()); i++) {
        const SweepPoint &pt = points[i];
        if (inBandOnly && !pt.inBand)
            continue;
        if (!inBandOnly && pt.inBand)
            continue;

        s.totalSteps++;
        if (pt.aliased)
            s.aliasingEvents++;
        if (!pt.monotonic && i > 0)
            s.nonMonotonicEvents++;
        if (pt.concentration < s.minConcentration)
            s.minConcentration = pt.concentration;
        concSum += pt.concentration;
    }
    if (s.totalSteps > 0)
        s.avgConcentration = concSum / static_cast<float>(s.totalSteps);
    return s;
}

// ---------------------------------------------------------------------------
// JSON output
// ---------------------------------------------------------------------------
static void emitJson(int samples, int bands, float fmin, float fmax,
                     int sampleRate, int numSteps) {
    fl::json root = fl::json::object();
    root.set("samples", samples);
    root.set("bands", bands);
    root.set("fmin", static_cast<double>(fmin));
    root.set("fmax", static_cast<double>(fmax));
    root.set("sample_rate", sampleRate);
    root.set("num_steps", numSteps);
    root.set("nyquist", static_cast<double>(sampleRate) / 2.0);

    fl::json sweeps = fl::json::array();

    fl::vector<SweepPoint> points;

    for (int m = 0; m < NUM_MODES; m++) {
        for (int w = 0; w < NUM_WINDOWS; w++) {
            runSweep(MODES[m].mode, WINDOWS[w].window,
                     samples, bands, fmin, fmax, sampleRate, numSteps,
                     points);

            fl::json entry = fl::json::object();
            entry.set("mode", MODES[m].label);
            entry.set("window", WINDOWS[w].label);

            SweepSummary inBand = computeSummary(points, true);
            SweepSummary outBand = computeSummary(points, false);

            fl::json inBandJson = fl::json::object();
            inBandJson.set("aliasing_events", inBand.aliasingEvents);
            inBandJson.set("non_monotonic_events", inBand.nonMonotonicEvents);
            inBandJson.set("min_energy_concentration",
                           static_cast<double>(inBand.minConcentration));
            inBandJson.set("avg_energy_concentration",
                           static_cast<double>(inBand.avgConcentration));
            inBandJson.set("total_steps", inBand.totalSteps);

            fl::json outBandJson = fl::json::object();
            outBandJson.set("aliasing_events", outBand.aliasingEvents);
            outBandJson.set("non_monotonic_events",
                            outBand.nonMonotonicEvents);
            outBandJson.set("min_energy_concentration",
                            static_cast<double>(outBand.minConcentration));
            outBandJson.set("avg_energy_concentration",
                            static_cast<double>(outBand.avgConcentration));
            outBandJson.set("total_steps", outBand.totalSteps);

            entry.set("in_band", inBandJson);
            entry.set("out_of_band", outBandJson);

            fl::json dataPoints = fl::json::array();
            for (int i = 0; i < static_cast<int>(points.size()); i++) {
                const SweepPoint &pt = points[i];

                fl::json p = fl::json::object();
                p.set("input_freq_hz", static_cast<double>(pt.inputFreq));
                p.set("peak_bin", pt.peakBinIdx);
                p.set("peak_bin_freq_hz",
                      static_cast<double>(pt.peakBinFreq));
                p.set("energy_concentration",
                      static_cast<double>(pt.concentration));
                p.set("monotonic", pt.monotonic);
                p.set("aliased", pt.aliased);
                p.set("in_band", pt.inBand);
                dataPoints.push_back(p);
            }

            entry.set("data", dataPoints);
            sweeps.push_back(entry);
        }
    }

    root.set("sweeps", sweeps);
    fl::printf("%s\n", root.to_string().c_str());
}

// ---------------------------------------------------------------------------
// Human-readable report
// ---------------------------------------------------------------------------
static void emitReport(int samples, int bands, float fmin, float fmax,
                       int sampleRate, int numSteps) {
    float nyquist = static_cast<float>(sampleRate) / 2.0f;

    fl::printf("===========================================================\n");
    fl::printf("  Pitch Sweep Aliasing Test\n");
    fl::printf("===========================================================\n");
    fl::printf("  Samples: %d  Bands: %d  Rate: %d Hz\n", samples, bands,
               sampleRate);
    fl::printf("  Freq range: %.1f - %.1f Hz  (Nyquist: %.1f Hz)\n", fmin,
               fmax, nyquist);
    fl::printf("  Sweep steps: %d (log-spaced, fmin to Nyquist)\n", numSteps);
    fl::printf("===========================================================\n");

    fl::vector<SweepPoint> points;

    // --- In-band section ---
    fl::printf("\n  --- IN-BAND (%.0f - %.0f Hz) ---\n\n", fmin, fmax);
    fl::printf("%-12s %-16s %5s %5s %8s %8s\n", "Mode", "Window", "Alias",
               "!Mon", "MinConc", "AvgConc");
    fl::printf(
        "-----------------------------------------------------------\n");

    for (int m = 0; m < NUM_MODES; m++) {
        for (int w = 0; w < NUM_WINDOWS; w++) {
            runSweep(MODES[m].mode, WINDOWS[w].window, samples, bands, fmin,
                     fmax, sampleRate, numSteps, points);
            SweepSummary s = computeSummary(points, true);
            fl::printf("%-12s %-16s %5d %5d %7.1f%% %7.1f%%\n",
                       MODES[m].label, WINDOWS[w].label, s.aliasingEvents,
                       s.nonMonotonicEvents, s.minConcentration * 100.0f,
                       s.avgConcentration * 100.0f);
        }
    }

    // --- Out-of-band section ---
    fl::printf("\n  --- OUT-OF-BAND (%.0f - %.0f Hz) ---\n\n", fmax, nyquist);
    fl::printf("%-12s %-16s %5s %5s %8s %8s\n", "Mode", "Window", "Alias",
               "!Mon", "MinConc", "AvgConc");
    fl::printf(
        "-----------------------------------------------------------\n");

    for (int m = 0; m < NUM_MODES; m++) {
        for (int w = 0; w < NUM_WINDOWS; w++) {
            runSweep(MODES[m].mode, WINDOWS[w].window, samples, bands, fmin,
                     fmax, sampleRate, numSteps, points);
            SweepSummary s = computeSummary(points, false);
            fl::printf("%-12s %-16s %5d %5d %7.1f%% %7.1f%%\n",
                       MODES[m].label, WINDOWS[w].label, s.aliasingEvents,
                       s.nonMonotonicEvents, s.minConcentration * 100.0f,
                       s.avgConcentration * 100.0f);
        }
    }

    fl::printf("\n  Alias = peak freq dropped >20%% vs previous step\n");
    fl::printf("  !Mon  = non-monotonic peak bin progression\n");
    fl::printf("  Conc  = energy concentration in peak +/- 1 bins\n");
    fl::printf("\n");
}

} // anonymous namespace

extern "C" void runner_setup_crash_handler();

int main(int argc, char *argv[]) {
    runner_setup_crash_handler();

    const int SAMPLES = 512;
    const int BANDS = 64;
    const float FMIN = Args::DefaultMinFrequency();
    const float FMAX = Args::DefaultMaxFrequency();
    const int SAMPLE_RATE = 44100;
    const int NUM_STEPS = 200;

    bool jsonOutput = (argc > 1 && fl::strcmp(argv[1], "json") == 0);

    if (jsonOutput) {
        emitJson(SAMPLES, BANDS, FMIN, FMAX, SAMPLE_RATE, NUM_STEPS);
    } else {
        emitReport(SAMPLES, BANDS, FMIN, FMAX, SAMPLE_RATE, NUM_STEPS);
    }

    return 0;
}
