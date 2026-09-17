// Import required modules for display, keyboard, and audio functionality
const display = require("display");
const keyboard = require("keyboard");
const audio = require("audio");

// Define color palette for the tone generator
// Colors are defined using RGB values (red, green, blue)
const colours = [
    display.color(0, 0, 0),       // black
    display.color(127, 127, 127), // grey
    display.color(255, 255, 255), // white
    display.color(0, 255, 0),     // green
    display.color(255, 255, 0),   // yellow
    display.color(255, 165, 0),   // orange
    display.color(255, 0, 255),   // magenta
];

// Predefined frequencies (musical notes) from C1 to B9
const frequencies = [
    // Octave 1
    { note: "C1", freq: 32.70 },
    { note: "C#1", freq: 34.65 },
    { note: "D1", freq: 36.71 },
    { note: "D#1", freq: 38.89 },
    { note: "E1", freq: 41.20 },
    { note: "F1", freq: 43.65 },
    { note: "F#1", freq: 46.25 },
    { note: "G1", freq: 49.00 },
    { note: "G#1", freq: 51.91 },
    { note: "A1", freq: 55.00 },
    { note: "A#1", freq: 58.27 },
    { note: "B1", freq: 61.74 },

    // Octave 2
    { note: "C2", freq: 65.41 },
    { note: "C#2", freq: 69.30 },
    { note: "D2", freq: 73.42 },
    { note: "D#2", freq: 77.78 },
    { note: "E2", freq: 82.41 },
    { note: "F2", freq: 87.31 },
    { note: "F#2", freq: 92.50 },
    { note: "G2", freq: 98.00 },
    { note: "G#2", freq: 103.83 },
    { note: "A2", freq: 110.00 },
    { note: "A#2", freq: 116.54 },
    { note: "B2", freq: 123.47 },

    // Octave 3
    { note: "C3", freq: 130.81 },
    { note: "C#3", freq: 138.59 },
    { note: "D3", freq: 146.83 },
    { note: "D#3", freq: 155.56 },
    { note: "E3", freq: 164.81 },
    { note: "F3", freq: 174.61 },
    { note: "F#3", freq: 185.00 },
    { note: "G3", freq: 196.00 },
    { note: "G#3", freq: 207.65 },
    { note: "A3", freq: 220.00 },
    { note: "A#3", freq: 233.08 },
    { note: "B3", freq: 246.94 },

    // Octave 4 (Middle octave)
    { note: "C4", freq: 261.63 },
    { note: "C#4", freq: 277.18 },
    { note: "D4", freq: 293.66 },
    { note: "D#4", freq: 311.13 },
    { note: "E4", freq: 329.63 },
    { note: "F4", freq: 349.23 },
    { note: "F#4", freq: 369.99 },
    { note: "G4", freq: 392.00 },
    { note: "G#4", freq: 415.30 },
    { note: "A4", freq: 440.00 },
    { note: "A#4", freq: 466.16 },
    { note: "B4", freq: 493.88 },

    // Octave 5
    { note: "C5", freq: 523.25 },
    { note: "C#5", freq: 554.37 },
    { note: "D5", freq: 587.33 },
    { note: "D#5", freq: 622.25 },
    { note: "E5", freq: 659.25 },
    { note: "F5", freq: 698.46 },
    { note: "F#5", freq: 739.99 },
    { note: "G5", freq: 783.99 },
    { note: "G#5", freq: 830.61 },
    { note: "A5", freq: 880.00 },
    { note: "A#5", freq: 932.33 },
    { note: "B5", freq: 987.77 },

    // Octave 6
    { note: "C6", freq: 1046.50 },
    { note: "C#6", freq: 1108.73 },
    { note: "D6", freq: 1174.66 },
    { note: "D#6", freq: 1244.51 },
    { note: "E6", freq: 1318.51 },
    { note: "F6", freq: 1396.91 },
    { note: "F#6", freq: 1479.98 },
    { note: "G6", freq: 1567.98 },
    { note: "G#6", freq: 1661.22 },
    { note: "A6", freq: 1760.00 },
    { note: "A#6", freq: 1864.66 },
    { note: "B6", freq: 1975.53 },

    // Octave 7
    { note: "C7", freq: 2093.00 },
    { note: "C#7", freq: 2217.46 },
    { note: "D7", freq: 2349.32 },
    { note: "D#7", freq: 2489.02 },
    { note: "E7", freq: 2637.02 },
    { note: "F7", freq: 2793.83 },
    { note: "F#7", freq: 2959.96 },
    { note: "G7", freq: 3135.96 },
    { note: "G#7", freq: 3322.44 },
    { note: "A7", freq: 3520.00 },
    { note: "A#7", freq: 3729.31 },
    { note: "B7", freq: 3951.07 },

    // Octave 8
    { note: "C8", freq: 4186.01 },
    { note: "C#8", freq: 4434.92 },
    { note: "D8", freq: 4698.63 },
    { note: "D#8", freq: 4978.03 },
    { note: "E8", freq: 5274.04 },
    { note: "F8", freq: 5587.65 },
    { note: "F#8", freq: 5919.91 },
    { note: "G8", freq: 6271.93 },
    { note: "G#8", freq: 6644.88 },
    { note: "A8", freq: 7040.00 },
    { note: "A#8", freq: 7458.62 },
    { note: "B8", freq: 7902.13 },

    // Octave 9
    { note: "C9", freq: 8372.02 },
    { note: "C#9", freq: 8869.84 },
    { note: "D9", freq: 9397.27 },
    { note: "D#9", freq: 9956.06 },
    { note: "E9", freq: 10548.08 },
    { note: "F9", freq: 11175.30 },
    { note: "F#9", freq: 11839.82 },
    { note: "G9", freq: 12543.85 },
    { note: "G#9", freq: 13289.75 },
    { note: "A9", freq: 14080.00 },
    { note: "A#9", freq: 14917.24 },
    { note: "B9", freq: 15804.27 },
];

// Application state variables
var currentFreqIndex = 45;  // Start with A4 (440Hz)
var duration = 500;         // Duration in milliseconds
var isPlaying = false;      // Track if tone is currently playing
var exitApp = false;        // Controls main application loop
var selectedMode = 3;       // Toggle between frequency, duration adjustment modes and play
var adjustMode = false;     // Toggle adjust mode

// Get display dimensions for responsive layout
const displayWidth = display.width();
const displayHeight = display.height();
// Scale font size based on display width (larger screens get bigger fonts)
const fontScale = (displayWidth > 300 ? 1 : 0);

// Show the initial interface
displayInterface();

/**
 * Displays the tone generator interface
 * Shows current frequency, duration, and play
 */
function displayInterface() {
    // Clear screen with black background
    display.fill(colours[0]);
    // Center-align all text
    display.setTextAlign('center', 'middle');

    // Display app title
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Tone Generator", displayWidth / 2, 7 + fontScale * 5);

    // Display current frequency
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Frequency:", 10, displayHeight / 9 * 2);
    display.setTextColor(selectedMode == 1 ? adjustMode ? colours[5] : colours[4] : colours[2]);
    const currentFreq = frequencies[currentFreqIndex];
    display.drawText(currentFreq.note + " (" + currentFreq.freq.toFixed(2) + " Hz)",
        displayWidth / 2 - 20, displayHeight / 9 * 2);

    // Display current duration
    display.setTextColor(colours[1]);
    display.drawText("Duration:", 10, displayHeight / 9 * 3);
    display.setTextColor(selectedMode == 2 ? adjustMode ? colours[5] : colours[4] : colours[2]);
    display.drawText(duration + " ms", displayWidth / 2 - 20, displayHeight / 9 * 3);

    // Display playing status
    display.setTextAlign('center', 'middle');
    display.setTextSize(2 + fontScale);
    if (!isPlaying) {
        display.setTextColor(selectedMode == 3 ? colours[4] : colours[2]);
        display.drawText("PLAY", displayWidth / 2, displayHeight / 2 - 2);
    } else {
        display.setTextColor(colours[6]);
        display.drawText("PLAYING", displayWidth / 2, displayHeight / 2 - 2);
    }

    // Display control instructions
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Prev/Next: Change Setting", 10, displayHeight / 9 * 6 - 7);
    display.drawText("Select: Edit/Save/Play", 10, displayHeight / 9 * 7 - 8);
    display.drawText("Exit: Close", 10, displayHeight / 9 * 8 - 9);

    // Display author credit in white at bottom
    display.setTextSize(1 + fontScale);
    display.setTextAlign('center', 'middle');
    display.setTextColor(colours[2]);
    display.drawText("By github.com/emericklaw", displayWidth / 2, displayHeight - 5 - fontScale * 5 + 2);
}

/**
 * Play the current tone
 */
function playTone() {
    const currentFreq = frequencies[currentFreqIndex];
    isPlaying = true;
    displayInterface();

    // Play the tone
    audio.tone(currentFreq.freq, duration, false);
    isPlaying = false;
    displayInterface();
}

/**
 * Adjust duration by a given amount
 */
function adjustDuration(delta) {
    duration += delta;
    // Keep duration within reasonable bounds
    if (duration < 200) duration = 200;
}

// Main application loop - continues until exitApp becomes true
while (!exitApp) {
    // Check for exit button press (ESC key)
    if (keyboard.getEscPress()) {
        exitApp = true;
        break;
    }

    // Handle Select button press - play tone or switch mode on long press
    if (keyboard.getSelPress()) {
        if (selectedMode != 3) {
            adjustMode = !adjustMode;
            displayInterface();
        } else {
            playTone();
        }
    }

    // Handle Next button press - adjust frequency or duration based on mode
    if (keyboard.getNextPress()) {
        if (adjustMode) {
            if (selectedMode == 1) {
                // Adjust frequency
                currentFreqIndex++;
                if (currentFreqIndex >= frequencies.length) {
                    currentFreqIndex = 0;  // Wrap around to first frequency
                }
            } else if (selectedMode == 2) {
                // Adjust duration
                adjustDuration(100);
            }
        } else {
            selectedMode++;
            if (selectedMode > 3) selectedMode = 1;
        }
        displayInterface();
    }

    // Handle Previous button press - adjust frequency or duration based on mode
    if (keyboard.getPrevPress()) {
        if (adjustMode) {
            if (selectedMode == 1) {
                // Adjust frequency
                currentFreqIndex--;
                if (currentFreqIndex < 0) {
                    currentFreqIndex = frequencies.length - 1;  // Wrap around to last frequency
                }
            } else if (selectedMode == 2) {
                // Adjust duration
                adjustDuration(-100);
            }
        } else {
            selectedMode--;
            if (selectedMode < 1) selectedMode = 3;
        }
        displayInterface();
    }

    // Small delay to prevent excessive CPU usage and button bouncing
    delay(50);
}
