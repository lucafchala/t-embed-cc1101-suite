// @filter: (mem is large)
// Gaussian blur AVR benchmark — run in avr8js emulator.
// Exercises blurGaussian<R,R> on an 8x8 CRGB matrix and prints
// microseconds per iteration over Serial.

#include <FastLED.h>

#define WIDTH 8
#define HEIGHT 8
#define NUM_LEDS (WIDTH * HEIGHT)
#define ITERS 100

CRGB leds[NUM_LEDS];

static void fill_test_data() {
    for (int i = 0; i < NUM_LEDS; i++) {
        leds[i] = CRGB(i * 37 + 17, i * 59 + 31, i * 83 + 47);
    }
}

template <int hR, int vR>
static void bench(const char *label) {
    fl::gfx::Canvas<CRGB> canvas(fl::span<CRGB>(leds, NUM_LEDS), WIDTH, HEIGHT);

    // Warmup
    fill_test_data();
    fl::gfx::blurGaussian<hR, vR>(canvas);

    // Timed run
    fill_test_data();
    unsigned long t0 = micros();
    for (int i = 0; i < ITERS; i++) {
        fl::gfx::blurGaussian<hR, vR>(canvas);
    }
    unsigned long elapsed = micros() - t0;

    Serial.print(label);
    Serial.print(": ");
    Serial.print(elapsed / ITERS);
    Serial.println(" us/iter");
}

void setup() {
    Serial.begin(115200);
    delay(100);

    Serial.println("== Gaussian Blur AVR Benchmark (8x8) ==");

    bench<1, 1>("R1 (3x3)");
    bench<2, 2>("R2 (5x5)");
    bench<3, 3>("R3 (7x7)");
    bench<4, 4>("R4 (9x9)");

    Serial.println("== Done ==");
}

void loop() {
    delay(1000);
    Serial.println("Test loop!");
}
