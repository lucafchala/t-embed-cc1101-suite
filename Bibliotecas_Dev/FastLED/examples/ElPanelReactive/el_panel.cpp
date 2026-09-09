#include "el_panel.h"

#ifdef __EMSCRIPTEN__

static CRGB leds[NUM_EL_LEDS];
static fl::ScreenMap screenMap(NUM_EL_LEDS, 0.5f, [](int index, fl::vec2f &pt) {
    // Left group (high threshold): indices 0-3
    // Right group (low threshold):  indices 4-7
    bool isRight = index >= LEDS_PER_PANEL;
    int local = index % LEDS_PER_PANEL;
    float groupX = isRight ? 65.0f : 25.0f;
    // 2x2 grid within each group
    pt.x = groupX + (local % 2) * 10.0f;
    pt.y = 40.0f + (local / 2) * 10.0f;
});

void initPanels() {
    FastLED.addLeds<WS2812, 3, GRB>(leds, NUM_EL_LEDS)
        .setScreenMap(screenMap);
}

void setPanelHigh(float brightness) {
    uint8_t v = uint8_t(brightness * 255);
    fill_solid(leds, LEDS_PER_PANEL, CRGB(v, v, v));
}

void setPanelLow(float brightness) {
    uint8_t v = uint8_t(brightness * 255);
    fill_solid(leds + LEDS_PER_PANEL, LEDS_PER_PANEL, CRGB(v, v, v));
}

void showPanels() {
    FastLED.show();
}

#else // Real hardware

#include "fl/system/pin.h"

#define EL_PIN_HIGH 2  // D2 — high threshold panel
#define EL_PIN_LOW  1  // D1 — low threshold panel
#define PWM_FREQ_HZ 50

void initPanels() {
    fl::pinMode(EL_PIN_HIGH, fl::PinMode::Output);
    fl::pinMode(EL_PIN_LOW, fl::PinMode::Output);
    fl::setPwmFrequency(EL_PIN_HIGH, PWM_FREQ_HZ);
    fl::setPwmFrequency(EL_PIN_LOW, PWM_FREQ_HZ);
    fl::analogWrite(EL_PIN_HIGH, 0);
    fl::analogWrite(EL_PIN_LOW, 0);
}

void setPanelHigh(float brightness) {
    fl::analogWrite(EL_PIN_HIGH, uint8_t(brightness * 255));
}

void setPanelLow(float brightness) {
    fl::analogWrite(EL_PIN_LOW, uint8_t(brightness * 255));
}

void showPanels() {
    // No-op — PWM is always running
}

#endif // __EMSCRIPTEN__
