#pragma once

/// EL panel hardware abstraction.
/// On WASM: 4 LEDs per panel for visualization.
/// On real hardware: PWM pin drive at 50 Hz.

#include <FastLED.h>

#define LEDS_PER_PANEL 4
#define NUM_EL_LEDS    (LEDS_PER_PANEL * 2)

void initPanels();
void setPanelHigh(float brightness);  // 0.0–1.0
void setPanelLow(float brightness);   // 0.0–1.0
void showPanels();
