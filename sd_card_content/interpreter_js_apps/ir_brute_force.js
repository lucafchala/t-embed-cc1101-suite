var display = require('display');
var keyboardApi = require('keyboard');
var dialog = require('dialog');
var ir = require('ir');

// Display functions
var fillScreen = display.fill;
var drawString = display.drawString;

// Input functions
var getAnyPress = keyboardApi.getAnyPress;
var keyboardPrompt = keyboardApi.keyboard;

// Dialog functions
var dialogChoice = dialog.choice;
var dialogError = dialog.error;
var dialogMessage = dialog.message;

// IR transmit function
var irTransmit = ir.transmit;

// IR Protocol definitions
var PROTOCOLS = {
    NEC: "NEC",
    SAMSUNG: "Samsung",
    SONY: "Sony",
    RC5: "RC5",
    RC6: "RC6",
    SIRC: "SIRC"
};

// Common TV power codes database (NEC protocol)
var TV_POWER_CODES = [
    // Generic/Universal
    0x20DF10EF, 0x20DF0FF0, 0x20DFF00F, 0x20DF708F,
    // Samsung
    0xE0E040BF, 0xE0E09966, 0xE0E019E6,
    // LG
    0x20DF10EF, 0x20DF23DC, 0x20DFC03F,
    // Sony
    0xA90, 0x750, 0xA50,
    // Panasonic
    0x40040100BCBD, 0x400401000405,
    // Sharp
    0x41C0, 0x51A8,
    // Toshiba
    0x02FD48B7, 0x2FD48B7,
    // Philips
    0x0C, 0x0CC,
    // Vizio
    0x20DF10EF, 0x20DF23DC,
    // TCL/Roku
    0x57E31ACB, 0x57E3906F,
    // Hisense
    0x20DF10EF, 0x10EF10EF
];

// Brand-specific code ranges
var BRAND_RANGES = {
    samsung_tv: {
        name: "Samsung TV",
        protocol: PROTOCOLS.SAMSUNG,
        start: 0xE0E00000,
        end: 0xE0E0FFFF,
        common_codes: [0xE0E040BF, 0xE0E0D02F, 0xE0E048B7, 0xE0E008F7, 0xE0E006F9]
    },
    lg_tv: {
        name: "LG TV",
        protocol: PROTOCOLS.NEC,
        start: 0x20DF0000,
        end: 0x20DFFFFF,
        common_codes: [0x20DF10EF, 0x20DF40BF, 0x20DFC03F, 0x20DF00FF, 0x20DF807F]
    },
    sony_tv: {
        name: "Sony TV",
        protocol: PROTOCOLS.SONY,
        start: 0x000,
        end: 0xFFF,
        common_codes: [0xA90, 0x750, 0x2D0, 0x010, 0x490]
    },
    panasonic_tv: {
        name: "Panasonic TV",
        protocol: PROTOCOLS.NEC,
        start: 0x40040000,
        end: 0x4004FFFF,
        common_codes: [0x40040100, 0x400401C0, 0x40040180]
    },
    generic_tv: {
        name: "Generic TV",
        protocol: PROTOCOLS.NEC,
        start: 0x00000000,
        end: 0x0000FFFF,
        common_codes: [0x10EF, 0x40BF, 0xC03F]
    },
    ac_units: {
        name: "AC Units",
        protocol: PROTOCOLS.NEC,
        start: 0x00000000,
        end: 0x000FFFFF,
        common_codes: [0x8166, 0x10EF, 0x708F]
    }
};

// Brute force configuration
var brute_config = {
    protocol: PROTOCOLS.NEC,
    start_code: 0x00000000,
    end_code: 0x0000FFFF,
    delay_ms: 300,
    mode: "sequential",  // sequential, random, power_codes
    brand: "generic_tv",
    current_position: 0,
    use_common_first: true
};

// Statistics
var stats = {
    total_sent: 0,
    start_time: 0,
    elapsed_time: 0
};

// Format hex code with proper length
function formatHex(code, minLength) {
    var hex = code.toString(16).toUpperCase();
    while (hex.length < minLength) {
        hex = "0" + hex;
    }
    return "0x" + hex;
}

// Calculate estimated time
function calculateTime() {
    var total = brute_config.end_code - brute_config.start_code + 1;
    var time_sec = Math.floor((total * brute_config.delay_ms) / 1000);
    return {
        total: total,
        seconds: time_sec,
        minutes: Math.floor(time_sec / 60),
        hours: Math.floor(time_sec / 3600)
    };
}

// Format time display
function formatTime(seconds) {
    if (seconds < 60) {
        return String(seconds) + "s";
    } else if (seconds < 3600) {
        return String(Math.floor(seconds / 60)) + "m " + String(seconds % 60) + "s";
    } else {
        var hours = Math.floor(seconds / 3600);
        var mins = Math.floor((seconds % 3600) / 60);
        return String(hours) + "h " + String(mins) + "m";
    }
}

// TV Power Code Attack (tries known power codes)
function powerCodeAttack() {
    fillScreen(0);
    drawString("=== TV POWER CODES ===", 3, 0);
    drawString("", 3, 16);
    drawString("Trying " + TV_POWER_CODES.length + " known codes", 3, 32);
    drawString("Watch your TV!", 3, 48);
    drawString("", 3, 64);
    drawString("Press any key to stop", 3, 80);
    
    delay(2000);
    
    stats.total_sent = 0;
    stats.start_time = Date.now();
    
    for (var i = 0; i < TV_POWER_CODES.length; i++) {
        if (getAnyPress()) {
            dialogMessage("Stopped at code " + (i + 1));
            return;
        }
        
        var code = TV_POWER_CODES[i];
        
        fillScreen(0);
        drawString("POWER CODE " + (i + 1) + "/" + TV_POWER_CODES.length, 3, 0);
        drawString("", 3, 16);
        drawString("Code: " + formatHex(code, 8), 3, 32);
        drawString("", 3, 48);
        drawString("Watch your TV closely!", 3, 64);
        drawString("", 3, 80);
        drawString("Press key if it worked!", 3, 96);
        
        // Transmit the power code
        var result = irTransmit(PROTOCOLS.NEC, code);
        stats.total_sent++;
        
        if (!result) {
            drawString("TX Error!", 3, 112);
        }
        
        delay(brute_config.delay_ms);
        
        // Extra delay after each code for user to observe
        delay(500);
    }
    
    dialogMessage("Power code scan complete. " + TV_POWER_CODES.length + " codes tried.");
}

// Sequential brute force
function sequentialBruteForce() {
    var total = brute_config.end_code - brute_config.start_code + 1;
    var count = brute_config.current_position;
    
    fillScreen(0);
    drawString("=== SEQUENTIAL BRUTE ===", 3, 0);
    drawString("Range: " + formatHex(brute_config.start_code, 8), 3, 16);
    drawString("    to " + formatHex(brute_config.end_code, 8), 3, 32);
    drawString("Total: " + total + " codes", 3, 48);
    drawString("", 3, 64);
    drawString("Starting in 3 seconds...", 3, 80);
    drawString("HOLD ANY KEY TO STOP", 3, 96);
    
    delay(3000);
    
    stats.total_sent = 0;
    stats.start_time = Date.now();
    
    for (var code = brute_config.start_code + count; code <= brute_config.end_code; code++) {
        if (getAnyPress()) {
            brute_config.current_position = code - brute_config.start_code;
            
            fillScreen(0);
            drawString("BRUTE FORCE STOPPED", 3, 0);
            drawString("", 3, 16);
            drawString("Progress: " + Math.floor((count / total) * 100) + "%", 3, 32);
            drawString("Codes sent: " + stats.total_sent, 3, 48);
            drawString("Last: " + formatHex(code, 8), 3, 64);
            drawString("", 3, 80);
            drawString("Can resume from here", 3, 96);
            drawString("", 3, 112);
            drawString("Press any key...", 3, 128);
            
            while (!getAnyPress()) {
                delay(100);
            }
            return false;
        }
        
        count++;
        stats.total_sent++;
        stats.elapsed_time = Math.floor((Date.now() - stats.start_time) / 1000);
        
        var percent = Math.floor((count / total) * 100);
        
        // Calculate ETA
        var avg_time = stats.elapsed_time / count;
        var remaining = total - count;
        var eta = Math.floor(avg_time * remaining);
        
        // Update display every 10 codes
        if (count % 10 === 0 || count === 1) {
            fillScreen(0);
            drawString("BRUTE FORCING...", 3, 0);
            drawString("", 3, 12);
            drawString("Code: " + formatHex(code, 8), 3, 24);
            drawString("Progress: " + percent + "%", 3, 36);
            drawString("Count: " + count + "/" + total, 3, 48);
            drawString("", 3, 60);
            drawString("Time: " + formatTime(stats.elapsed_time), 3, 72);
            drawString("ETA: " + formatTime(eta), 3, 84);
            drawString("", 3, 96);
            drawString("HOLD KEY TO STOP", 3, 108);
        }
        
        // Transmit IR code
        var result = irTransmit(brute_config.protocol, code);
        
        if (!result && count % 50 === 0) {
            drawString("TX errors detected", 3, 120);
            delay(1000);
        }
        
        delay(brute_config.delay_ms);
    }
    
    // Complete
    brute_config.current_position = 0;
    
    fillScreen(0);
    drawString("=== COMPLETE ===", 3, 0);
    drawString("", 3, 16);
    drawString("All codes transmitted!", 3, 32);
    drawString("Total: " + stats.total_sent, 3, 48);
    drawString("Time: " + formatTime(stats.elapsed_time), 3, 64);
    drawString("", 3, 80);
    drawString("Did anything respond?", 3, 96);
    drawString("", 3, 112);
    drawString("Press any key...", 3, 128);
    
    while (!getAnyPress()) {
        delay(100);
    }
    
    return true;
}

// Random brute force
function randomBruteForce() {
    var total = brute_config.end_code - brute_config.start_code + 1;
    var codes_to_try = Math.min(total, 1000); // Limit random to 1000 tries
    
    fillScreen(0);
    drawString("=== RANDOM BRUTE ===", 3, 0);
    drawString("", 3, 16);
    drawString("Will try " + codes_to_try + " random codes", 3, 32);
    drawString("from range:", 3, 48);
    drawString(formatHex(brute_config.start_code, 8) + " to", 3, 64);
    drawString(formatHex(brute_config.end_code, 8), 3, 80);
    drawString("", 3, 96);
    drawString("Press any key to start", 3, 112);
    
    while (!getAnyPress()) {
        delay(100);
    }
    
    stats.total_sent = 0;
    stats.start_time = Date.now();
    
    for (var i = 0; i < codes_to_try; i++) {
        if (getAnyPress()) {
            dialogMessage("Random brute stopped at " + i);
            return;
        }
        
        // Generate random code in range
        var range = brute_config.end_code - brute_config.start_code;
        var random_offset = Math.floor(Math.random() * range);
        var code = brute_config.start_code + random_offset;
        
        fillScreen(0);
        drawString("RANDOM BRUTE", 3, 0);
        drawString("", 3, 16);
        drawString("Try: " + (i + 1) + "/" + codes_to_try, 3, 32);
        drawString("Code: " + formatHex(code, 8), 3, 48);
        drawString("", 3, 64);
        drawString("HOLD KEY TO STOP", 3, 80);
        
        irTransmit(brute_config.protocol, code);
        stats.total_sent++;
        
        delay(brute_config.delay_ms);
    }
    
    dialogMessage("Random brute complete. " + codes_to_try + " codes tried.");
}

// Common codes first, then sequential
function smartBruteForce() {
    var brand = BRAND_RANGES[brute_config.brand];
    
    if (!brand || !brand.common_codes || brand.common_codes.length === 0) {
        dialogError("No common codes for this brand");
        return;
    }
    
    // First, try common codes
    fillScreen(0);
    drawString("SMART BRUTE FORCE", 3, 0);
    drawString("", 3, 16);
    drawString("Phase 1: Common codes", 3, 32);
    drawString("Trying " + brand.common_codes.length + " codes", 3, 48);
    drawString("", 3, 64);
    drawString("Watch device closely!", 3, 80);
    
    delay(2000);
    
    stats.total_sent = 0;
    stats.start_time = Date.now();
    
    for (var i = 0; i < brand.common_codes.length; i++) {
        if (getAnyPress()) {
            var continue_opt = {};
            continue_opt["Common codes done, continue?"] = "continue";
            continue_opt["Stop here"] = "stop";
            var choice = dialogChoice(continue_opt);
            if (choice !== "continue") {
                return;
            }
            break;
        }
        
        var code = brand.common_codes[i];
        
        fillScreen(0);
        drawString("COMMON CODE " + (i + 1), 3, 0);
        drawString("", 3, 16);
        drawString("Code: " + formatHex(code, 8), 3, 32);
        drawString("", 3, 48);
        drawString("Did it work?", 3, 64);
        drawString("Hold key if YES", 3, 80);
        
        irTransmit(brute_config.protocol, code);
        stats.total_sent++;
        
        delay(brute_config.delay_ms);
        delay(500); // Extra observation time
    }
    
    // Ask if we should continue with full brute
    var options = {};
    options["Common codes tried"] = "header";
    options["Continue full brute?"] = "continue";
    options["Stop here"] = "stop";
    
    var choice = dialogChoice(options);
    
    if (choice === "continue") {
        // Continue with sequential brute force
        sequentialBruteForce();
    }
}

// Load brand preset
function loadBrandPreset() {
    var options = {};
    options["=== BRAND PRESETS ==="] = "header";
    
    var brands = ["samsung_tv", "lg_tv", "sony_tv", "panasonic_tv", "generic_tv", "ac_units"];
    
    for (var i = 0; i < brands.length; i++) {
        var key = brands[i];
        var brand = BRAND_RANGES[key];
        options[brand.name] = key;
    }
    
    options["Back"] = "back";
    
    var choice = dialogChoice(options);
    
    if (choice !== "" && choice !== "back") {
        var brand = BRAND_RANGES[choice];
        brute_config.brand = choice;
        brute_config.protocol = brand.protocol;
        brute_config.start_code = brand.start;
        brute_config.end_code = brand.end;
        brute_config.current_position = 0;
        
        dialogMessage("Loaded: " + brand.name);
    }
}

// Configuration menu
function configMenu() {
    while (true) {
        var calc = calculateTime();
        
        var options = {};
        options["=== CONFIGURATION ==="] = "header";
        options["Brand: " + BRAND_RANGES[brute_config.brand].name] = "brand";
        options["Protocol: " + brute_config.protocol] = "protocol";
        options["Start: " + formatHex(brute_config.start_code, 8)] = "start";
        options["End: " + formatHex(brute_config.end_code, 8)] = "end";
        options["Delay: " + brute_config.delay_ms + " ms"] = "delay";
        options["Position: " + brute_config.current_position] = "position";
        options["---"] = "sep1";
        options["Total: " + calc.total + " codes"] = "info1";
        options["Time: ~" + formatTime(calc.seconds)] = "info2";
        options["---"] = "sep2";
        options["Reset Position"] = "reset";
        options["Back"] = "back";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "back") break;
        else if (choice === "brand") {
            loadBrandPreset();
        }
        else if (choice === "protocol") {
            var proto_opts = {};
            proto_opts["NEC (most common)"] = PROTOCOLS.NEC;
            proto_opts["Samsung"] = PROTOCOLS.SAMSUNG;
            proto_opts["Sony (SIRC)"] = PROTOCOLS.SONY;
            proto_opts["RC5"] = PROTOCOLS.RC5;
            proto_opts["RC6"] = PROTOCOLS.RC6;
            var proto = dialogChoice(proto_opts);
            if (proto !== "") brute_config.protocol = proto;
        }
        else if (choice === "start") {
            var input = keyboardPrompt(brute_config.start_code.toString(16), 32, "Start code (hex)");
            if (input) {
                brute_config.start_code = parseInt(input, 16);
                brute_config.current_position = 0;
            }
        }
        else if (choice === "end") {
            var input = keyboardPrompt(brute_config.end_code.toString(16), 32, "End code (hex)");
            if (input) {
                brute_config.end_code = parseInt(input, 16);
            }
        }
        else if (choice === "delay") {
            var input = keyboardPrompt(String(brute_config.delay_ms), 32, "Delay (ms)");
            if (input) {
                brute_config.delay_ms = parseInt(input);
            }
        }
        else if (choice === "position") {
            var input = keyboardPrompt(String(brute_config.current_position), 32, "Start position");
            if (input) {
                var pos = parseInt(input);
                var total = brute_config.end_code - brute_config.start_code + 1;
                if (pos >= 0 && pos < total) {
                    brute_config.current_position = pos;
                } else {
                    dialogError("Position out of range");
                }
            }
        }
        else if (choice === "reset") {
            brute_config.current_position = 0;
            dialogMessage("Position reset to 0");
        }
    }
}

// Main menu
function mainMenu() {
    // Info screen
    fillScreen(0);
    drawString("=== IR BRUTE FORCE ===", 3, 0);
    drawString("", 3, 16);
    drawString("Supported:", 3, 32);
    drawString("- TVs (Samsung, LG, Sony)", 3, 48);
    drawString("- AC units", 3, 64);
    drawString("- Projectors", 3, 80);
    drawString("- Set-top boxes", 3, 96);
    drawString("", 3, 112);
    drawString("Point IR at device", 3, 128);
    drawString("", 3, 144);
    drawString("Press any key...", 3, 160);
    
    while (!getAnyPress()) {
        delay(100);
    }
    
    while (true) {
        var options = {};
        options["=== IR BRUTE FORCE ==="] = "header";
        options["Quick: TV Power Codes"] = "power";
        options["Smart Brute (Recommended)"] = "smart";
        options["Sequential Brute"] = "sequential";
        options["Random Brute"] = "random";
        options["Configure"] = "config";
        options["Test Single Code"] = "test";
        options["Exit"] = "exit";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "exit") {
            break;
        }
        else if (choice === "power") {
            powerCodeAttack();
        }
        else if (choice === "smart") {
            smartBruteForce();
        }
        else if (choice === "sequential") {
            sequentialBruteForce();
        }
        else if (choice === "random") {
            randomBruteForce();
        }
        else if (choice === "config") {
            configMenu();
        }
        else if (choice === "test") {
            var test_code = keyboardPrompt("", 32, "Code to test (hex)");
            if (test_code && test_code !== "") {
                var code = parseInt(test_code, 16);
                fillScreen(0);
                drawString("Testing: " + formatHex(code, 8), 3, 0);
                drawString("Protocol: " + brute_config.protocol, 3, 16);
                
                var result = irTransmit(brute_config.protocol, code);
                
                if (result) {
                    dialogMessage("Code transmitted!");
                } else {
                    dialogError("Transmission failed");
                }
            }
        }
    }
    
    fillScreen(0);
    drawString("IR Brute Force closed", 3, 0);
    delay(1000);
}

// Start application
mainMenu();
