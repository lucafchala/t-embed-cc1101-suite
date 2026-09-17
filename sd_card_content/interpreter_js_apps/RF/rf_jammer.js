// ============================================================================
// RF JAMMING TOOL - FOR EDUCATIONAL AND AUTHORIZED TESTING ONLY
// ============================================================================
// 
// ⚠️  CRITICAL LEGAL WARNING ⚠️
//
// RF JAMMING IS ILLEGAL IN MOST COUNTRIES WITHOUT PROPER AUTHORIZATION
//
// United States: FCC violations carry fines up to $112,500 per day
// European Union: Can result in criminal prosecution
// Other Countries: Similar severe penalties apply
//
// LEGAL USES ONLY:
// - Testing YOUR OWN systems in shielded environments
// - Authorized security research with proper licenses
// - Educational demonstrations in Faraday cages
// - RF hardening tests of your own equipment
//
// NEVER USE TO:
// - Interfere with emergency services (911, police, ambulance)
// - Disrupt commercial communications
// - Jam WiFi, cellular, or GPS signals in public
// - Interfere with anyone else's devices
// - Use in public spaces
//
// BY USING THIS SCRIPT YOU ACKNOWLEDGE FULL LEGAL RESPONSIBILITY
// ============================================================================

var display = require('display');
var keyboardApi = require('keyboard');
var dialog = require('dialog');
var subghz = require('subghz');

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

// SubGHz transmit
var subghzTransmit = subghz.transmit;

// Jamming configuration
var jam_config = {
    frequency: 433920000,  // 433.92 MHz
    mode: "continuous",    // continuous, burst, sweep
    burst_duration: 100,   // ms per burst
    burst_delay: 50,       // ms between bursts
    sweep_start: 433000000,
    sweep_end: 434000000,
    sweep_step: 100000,    // 100 KHz steps
    pattern: "noise"       // noise, carrier, alternating
};

// Legal acknowledgment flag
var legal_acknowledged = false;

// Show legal warning
function showLegalWarning() {
    fillScreen(0);
    drawString("=== LEGAL WARNING ===", 3, 0);
    drawString("", 3, 16);
    drawString("RF jamming is ILLEGAL", 3, 32);
    drawString("without authorization", 3, 48);
    drawString("", 3, 64);
    drawString("USE ONLY:", 3, 80);
    drawString("- In shielded environment", 3, 96);
    drawString("- On YOUR devices", 3, 112);
    drawString("- With proper licenses", 3, 128);
    drawString("", 3, 144);
    drawString("Fines: Up to $112,500/day", 3, 160);
    drawString("Criminal prosecution possible", 3, 176);
    drawString("", 3, 192);
    drawString("Press any key if you agree", 3, 208);
    
    while (!getAnyPress()) {
        delay(100);
    }
    
    // Second confirmation
    fillScreen(0);
    drawString("SECOND CONFIRMATION", 3, 0);
    drawString("", 3, 16);
    drawString("I confirm:", 3, 32);
    drawString("", 3, 48);
    drawString("1. I own all devices affected", 3, 64);
    drawString("2. I am in controlled space", 3, 80);
    drawString("3. No public interference", 3, 96);
    drawString("4. I accept full liability", 3, 112);
    drawString("", 3, 128);
    drawString("I am LEGALLY RESPONSIBLE", 3, 144);
    drawString("for any misuse of this tool", 3, 160);
    drawString("", 3, 176);
    drawString("Press any key to confirm", 3, 192);
    
    while (!getAnyPress()) {
        delay(100);
    }
    
    legal_acknowledged = true;
}

// Continuous jamming (rapid noise transmission)
function continuousJam() {
    fillScreen(0);
    drawString("CONTINUOUS JAMMING", 3, 0);
    drawString("Freq: " + (jam_config.frequency / 1000000).toFixed(2) + " MHz", 3, 16);
    drawString("", 3, 32);
    drawString("WARNING: THIS IS ACTIVE!", 3, 48);
    drawString("", 3, 64);
    drawString("HOLD ANY KEY TO STOP", 3, 80);
    
    var count = 0;
    var start_time = Date.now();
    
    while (true) {
        if (getAnyPress()) {
            break;
        }
        
        // Transmit noise pattern
        var noise_data = (Math.floor(Math.random() * 0xFFFFFF)).toString(16).toUpperCase();
        subghzTransmit(noise_data, jam_config.frequency, 100, 50);
        
        count++;
        
        // Update display every 10 transmissions
        if (count % 10 === 0) {
            var elapsed = Math.floor((Date.now() - start_time) / 1000);
            fillScreen(0);
            drawString("JAMMING ACTIVE", 3, 0);
            drawString("Transmissions: " + count, 3, 16);
            drawString("Time: " + elapsed + "s", 3, 32);
            drawString("Freq: " + (jam_config.frequency / 1000000).toFixed(2) + " MHz", 3, 48);
            drawString("", 3, 64);
            drawString("HOLD ANY KEY TO STOP", 3, 80);
        }
        
        delay(10); // Very short delay for continuous jamming
    }
    
    dialogMessage("Jamming stopped. " + count + " transmissions sent.");
}

// Burst jamming (intermittent)
function burstJam() {
    fillScreen(0);
    drawString("BURST JAMMING", 3, 0);
    drawString("Freq: " + (jam_config.frequency / 1000000).toFixed(2) + " MHz", 3, 16);
    drawString("Burst: " + jam_config.burst_duration + "ms", 3, 32);
    drawString("Delay: " + jam_config.burst_delay + "ms", 3, 48);
    drawString("", 3, 64);
    drawString("Press any key to stop", 3, 80);
    
    delay(2000);
    
    var burst_count = 0;
    var start_time = Date.now();
    
    while (true) {
        if (getAnyPress()) {
            break;
        }
        
        // Burst phase - rapid transmissions
        var burst_start = Date.now();
        var tx_count = 0;
        
        while (Date.now() - burst_start < jam_config.burst_duration) {
            var noise_data = (Math.floor(Math.random() * 0xFFFFFF)).toString(16).toUpperCase();
            subghzTransmit(noise_data, jam_config.frequency, 100, 20);
            tx_count++;
            delay(5);
        }
        
        burst_count++;
        
        // Update display
        var elapsed = Math.floor((Date.now() - start_time) / 1000);
        fillScreen(0);
        drawString("BURST JAMMING", 3, 0);
        drawString("Burst #" + burst_count, 3, 16);
        drawString("TX in burst: " + tx_count, 3, 32);
        drawString("Time: " + elapsed + "s", 3, 48);
        drawString("", 3, 64);
        drawString("HOLD ANY KEY TO STOP", 3, 80);
        
        // Delay phase
        delay(jam_config.burst_delay);
    }
    
    dialogMessage("Burst jamming stopped. " + burst_count + " bursts sent.");
}

// Frequency sweep jamming
function sweepJam() {
    var range = jam_config.sweep_end - jam_config.sweep_start;
    var steps = Math.floor(range / jam_config.sweep_step);
    
    fillScreen(0);
    drawString("SWEEP JAMMING", 3, 0);
    drawString("Range: " + (jam_config.sweep_start / 1000000).toFixed(2) + " - " + (jam_config.sweep_end / 1000000).toFixed(2) + " MHz", 3, 16);
    drawString("Steps: " + steps, 3, 32);
    drawString("Step: " + (jam_config.sweep_step / 1000).toFixed(0) + " KHz", 3, 48);
    drawString("", 3, 64);
    drawString("Press any key to stop", 3, 80);
    
    delay(2000);
    
    var sweep_count = 0;
    var start_time = Date.now();
    
    while (true) {
        if (getAnyPress()) {
            break;
        }
        
        // Sweep through frequency range
        for (var freq = jam_config.sweep_start; freq <= jam_config.sweep_end; freq += jam_config.sweep_step) {
            if (getAnyPress()) {
                dialogMessage("Sweep jamming stopped.");
                return;
            }
            
            var noise_data = (Math.floor(Math.random() * 0xFFFFFF)).toString(16).toUpperCase();
            subghzTransmit(noise_data, freq, 100, 15);
            
            // Update display every 5 frequencies
            if ((freq - jam_config.sweep_start) % (jam_config.sweep_step * 5) === 0) {
                fillScreen(0);
                drawString("SWEEP JAMMING", 3, 0);
                drawString("Current: " + (freq / 1000000).toFixed(2) + " MHz", 3, 16);
                drawString("Sweep #" + sweep_count, 3, 32);
                drawString("", 3, 48);
                drawString("HOLD ANY KEY TO STOP", 3, 64);
            }
            
            delay(20);
        }
        
        sweep_count++;
    }
}

// Carrier wave jamming (simple tone)
function carrierJam() {
    fillScreen(0);
    drawString("CARRIER JAMMING", 3, 0);
    drawString("Freq: " + (jam_config.frequency / 1000000).toFixed(2) + " MHz", 3, 16);
    drawString("", 3, 32);
    drawString("Transmitting pure carrier", 3, 48);
    drawString("", 3, 64);
    drawString("HOLD ANY KEY TO STOP", 3, 80);
    
    var count = 0;
    var start_time = Date.now();
    
    // Carrier pattern - all 1s
    var carrier_data = "FFFFFF";
    
    while (true) {
        if (getAnyPress()) {
            break;
        }
        
        subghzTransmit(carrier_data, jam_config.frequency, 200, 100);
        count++;
        
        if (count % 5 === 0) {
            var elapsed = Math.floor((Date.now() - start_time) / 1000);
            fillScreen(0);
            drawString("CARRIER JAMMING", 3, 0);
            drawString("Transmissions: " + count, 3, 16);
            drawString("Time: " + elapsed + "s", 3, 32);
            drawString("", 3, 48);
            drawString("HOLD ANY KEY TO STOP", 3, 64);
        }
        
        delay(50);
    }
    
    dialogMessage("Carrier jamming stopped.");
}

// Configuration menu
function configMenu() {
    while (true) {
        var options = {};
        options["=== JAMMING CONFIG ==="] = "header";
        options["Frequency: " + (jam_config.frequency / 1000000).toFixed(2) + " MHz"] = "freq";
        options["Mode: " + jam_config.mode] = "mode";
        
        if (jam_config.mode === "burst") {
            options["Burst Duration: " + jam_config.burst_duration + "ms"] = "burst_dur";
            options["Burst Delay: " + jam_config.burst_delay + "ms"] = "burst_del";
        }
        
        if (jam_config.mode === "sweep") {
            options["Sweep Start: " + (jam_config.sweep_start / 1000000).toFixed(2) + " MHz"] = "sweep_start";
            options["Sweep End: " + (jam_config.sweep_end / 1000000).toFixed(2) + " MHz"] = "sweep_end";
            options["Sweep Step: " + (jam_config.sweep_step / 1000).toFixed(0) + " KHz"] = "sweep_step";
        }
        
        options["Pattern: " + jam_config.pattern] = "pattern";
        options["Back"] = "back";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "back") break;
        else if (choice === "freq") {
            var input = keyboardPrompt(String(jam_config.frequency / 1000000), 32, "Frequency (MHz)");
            if (input) jam_config.frequency = parseInt(parseFloat(input) * 1000000);
        }
        else if (choice === "mode") {
            var mode_opts = {};
            mode_opts["Continuous (Fast)"] = "continuous";
            mode_opts["Burst (Intermittent)"] = "burst";
            mode_opts["Sweep (Range)"] = "sweep";
            mode_opts["Carrier (Pure tone)"] = "carrier";
            var mode_choice = dialogChoice(mode_opts);
            if (mode_choice !== "") jam_config.mode = mode_choice;
        }
        else if (choice === "burst_dur") {
            var input = keyboardPrompt(String(jam_config.burst_duration), 32, "Burst duration (ms)");
            if (input) jam_config.burst_duration = parseInt(input);
        }
        else if (choice === "burst_del") {
            var input = keyboardPrompt(String(jam_config.burst_delay), 32, "Burst delay (ms)");
            if (input) jam_config.burst_delay = parseInt(input);
        }
        else if (choice === "sweep_start") {
            var input = keyboardPrompt(String(jam_config.sweep_start / 1000000), 32, "Start freq (MHz)");
            if (input) jam_config.sweep_start = parseInt(parseFloat(input) * 1000000);
        }
        else if (choice === "sweep_end") {
            var input = keyboardPrompt(String(jam_config.sweep_end / 1000000), 32, "End freq (MHz)");
            if (input) jam_config.sweep_end = parseInt(parseFloat(input) * 1000000);
        }
        else if (choice === "sweep_step") {
            var input = keyboardPrompt(String(jam_config.sweep_step / 1000), 32, "Step size (KHz)");
            if (input) jam_config.sweep_step = parseInt(parseFloat(input) * 1000);
        }
        else if (choice === "pattern") {
            var pattern_opts = {};
            pattern_opts["Random Noise"] = "noise";
            pattern_opts["Carrier Wave"] = "carrier";
            pattern_opts["Alternating"] = "alternating";
            var pattern_choice = dialogChoice(pattern_opts);
            if (pattern_choice !== "") jam_config.pattern = pattern_choice;
        }
    }
}

// Start jamming with confirmation
function startJamming() {
    // Final confirmation
    fillScreen(0);
    drawString("=== START JAMMING ===", 3, 0);
    drawString("", 3, 16);
    drawString("Mode: " + jam_config.mode, 3, 32);
    drawString("Freq: " + (jam_config.frequency / 1000000).toFixed(2) + " MHz", 3, 48);
    drawString("", 3, 64);
    drawString("FINAL WARNING:", 3, 80);
    drawString("This will transmit RF energy", 3, 96);
    drawString("Ensure legal compliance!", 3, 112);
    drawString("", 3, 128);
    drawString("Press any key to START", 3, 144);
    drawString("or wait 10s to cancel", 3, 160);
    
    var wait_start = Date.now();
    var started = false;
    
    while (Date.now() - wait_start < 10000) {
        if (getAnyPress()) {
            started = true;
            break;
        }
        delay(100);
    }
    
    if (!started) {
        dialogMessage("Cancelled");
        return;
    }
    
    // Execute jamming based on mode
    if (jam_config.mode === "continuous") {
        continuousJam();
    } else if (jam_config.mode === "burst") {
        burstJam();
    } else if (jam_config.mode === "sweep") {
        sweepJam();
    } else if (jam_config.mode === "carrier") {
        carrierJam();
    }
}

// Main menu
function mainMenu() {
    // Show legal warning first
    if (!legal_acknowledged) {
        showLegalWarning();
    }
    
    while (true) {
        var options = {};
        options["=== RF JAMMER ==="] = "header";
        options["Configure"] = "config";
        options["--- START JAMMING ---"] = "start";
        options["Test Single Burst"] = "test";
        options["Show Legal Warning"] = "legal";
        options["Exit"] = "exit";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "exit") {
            break;
        }
        else if (choice === "config") {
            configMenu();
        }
        else if (choice === "start") {
            startJamming();
        }
        else if (choice === "test") {
            fillScreen(0);
            drawString("Test burst...", 3, 0);
            var test_data = "ABCDEF";
            subghzTransmit(test_data, jam_config.frequency, 100, 20);
            dialogMessage("Test burst sent");
        }
        else if (choice === "legal") {
            showLegalWarning();
        }
    }
    
    fillScreen(0);
    drawString("RF Jammer closed", 3, 0);
    delay(1000);
}

// Start application
mainMenu();
