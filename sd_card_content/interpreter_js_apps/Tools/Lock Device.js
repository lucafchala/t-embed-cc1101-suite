// Import required modules for display, keyboard functionality, and storage
var display = require("display");
var keyboard = require("keyboard");
var storage = require("storage");
var battery = require("battery");

// Colors are defined using RGB values (red, green, blue)
const colours = [
    display.color(0, 0, 0),       // black
    display.color(127, 127, 127), // grey
    display.color(255, 255, 255), // white
    display.color(255, 0, 0),     // red
    display.color(255, 165, 0),   // orange
    display.color(255, 255, 0),   // yellow
    display.color(0, 255, 0),     // green
    display.color(0, 255, 255),   // cyan
    display.color(0, 0, 255),     // blue
    display.color(75, 0, 130),    // indigo
    display.color(138, 43, 226),  // violet
    display.color(255, 0, 255)    // magenta
];

// Get display dimensions for responsive layout
var displayWidth = display.width();
var displayHeight = display.height();
// Scale font size based on display width (larger screens get bigger fonts)
const fontScale = (displayWidth > 300 ? 1 : 0);

// Flag to control application exit
var exitApp = false;

// Timeout configuration
var failedAttempts = 0;
var isTimedOut = false;
var timeoutEndTime = 0;

// Display update timing
var lastDisplayUpdate = 0;
var displayUpdateInterval = 5000; // 5 seconds
var forceUpdateDisplay = false;
var lastCountdownUpdate = 0;

// Settings mode variables
var inSettingsMode = false;
var settingsMenuIndex = 0;
var settingsOptions = ["Change Password", "Timeout Settings"];
var settingsUnlocked = false;

// Timeout configuration
var config = {
    password: null,
    baseTimeout: 15000, // 15 seconds default
    maxTimeout: 300000, // 5 minutes maximum
    exponentialBackoff: true
};

var fileSystem = "littlefs";

/**
 * Detect which file system to use based on bruce.conf existence
 */
function detectFileSystem() {
    try {
        var confData = storage.read({ fs: "sd", path: "/bruce.conf" });
        fileSystem = confData ? "sd" : "littlefs";
    } catch (e) {
        fileSystem = "littlefs";
    }
}

detectFileSystem();

// Password configuration file path
var PASSWORD_FILE = __dirpath + "/Lock Device.json";

// Load configuration from file or prompt for setup
loadConfiguration();
var password = config.password || setupNewPassword();


// Fill display with UI background color
display.fill(BRUCE_BGCOLOR);

// Main application loop
while (!exitApp) {

    if (keyboard.getEscPress()) {
        if (inSettingsMode) {
            inSettingsMode = false;
            settingsUnlocked = false;
            forceUpdateDisplay = true;
            // } else {
            //     exitApp = true;
        }
    }

    var currentTime = Date.now();

    if (inSettingsMode) {
        handleSettingsMode();
    } else {
        // Long-press detection for settings access
        if (keyboard.getPrevPress() || keyboard.getNextPress()) {
            enterSettingsMode();
        }

        // Only update display every 5 seconds or when showing error, or every 1 second during timeout
        var shouldUpdateDisplay = (currentTime - lastDisplayUpdate > displayUpdateInterval) ||
            forceUpdateDisplay;

        var shouldUpdateCountdown = isTimedOut && (currentTime - lastCountdownUpdate > 1000);

        // Check if timeout period has ended
        if (isTimedOut && currentTime >= timeoutEndTime) {
            isTimedOut = false;
            forceUpdateDisplay = true;
        }

        if (shouldUpdateDisplay) {

            forceUpdateDisplay = false;

            // Clear display
            display.fill(BRUCE_BGCOLOR);

            // Display status bar (battery and time)
            drawStatusBar();

            // Display title
            // Set text alignment to center
            display.setTextAlign('center', 'middle');
            display.setTextSize(2 + fontScale);
            display.setTextColor(BRUCE_PRICOLOR);
            display.drawText("Device", displayWidth / 2, displayHeight / 6 * 2);
            display.drawText("Locked", displayWidth / 2, displayHeight / 6 * 2.8);

            // Display timeout message if timed out
            if (isTimedOut) {
                var remainingTime = Math.ceil((timeoutEndTime - currentTime) / 1000);
                display.setTextSize(1 + fontScale);
                display.setTextColor(colours[3]); // Red color for timeout
                display.drawText("Incorrect Password!", displayWidth / 2, displayHeight / 6 * 4.2);
                display.drawText("Try again in " + remainingTime + " seconds", displayWidth / 2, displayHeight / 6 * 5);
                lastCountdownUpdate = currentTime;
            } else {
                // Display instructions
                display.setTextSize(1 + fontScale);
                display.setTextColor(BRUCE_SECCOLOR);
                display.drawText("Press SELECT key", displayWidth / 2, displayHeight / 6 * 4.2);
                display.drawText("to unlock", displayWidth / 2, displayHeight / 6 * 5);
            }

            lastDisplayUpdate = currentTime;
        } else if (shouldUpdateCountdown) {
            // Only update the countdown text during timeout
            var remainingTime = Math.ceil((timeoutEndTime - currentTime) / 1000);

            // Clear just the countdown line area
            display.drawFillRect(0, displayHeight / 6 * 5 - 10, displayWidth, 20, BRUCE_BGCOLOR);

            // Redraw the countdown text
            display.setTextAlign('center', 'middle');
            display.setTextSize(1 + fontScale);
            display.setTextColor(colours[3]); // Red color for timeout
            display.drawText("Try again in " + remainingTime + " seconds", displayWidth / 2, displayHeight / 6 * 5);

            lastCountdownUpdate = currentTime;
        }

        // Check for any key press to open keyboard (only if not timed out or showing error)
        if (keyboard.getSelPress() && !isTimedOut) {
            // Open keyboard for password input
            if (isPIN(password)) {
                var enteredPassword = keyboard.numKeyboard(50, "Enter PIN:", true);
            } else {
                var enteredPassword = keyboard.keyboard(50, "Enter password:", true);
            }

            // Check password
            if (enteredPassword === password) {
                exitApp = true;
                break;
            } else if (enteredPassword !== null && enteredPassword !== "" && enteredPassword !== "\x1b") {
                // Wrong password - increase failed attempts and show error/timeout
                failedAttempts++;

                // Start timeout period with configurable duration
                var timeoutDuration = config.exponentialBackoff
                    ? config.baseTimeout * Math.pow(2, failedAttempts - 1)
                    : config.baseTimeout;
                // Cap at maximum timeout
                timeoutDuration = Math.min(timeoutDuration, config.maxTimeout);
                isTimedOut = true;
                timeoutEndTime = Date.now() + timeoutDuration;
                forceUpdateDisplay = true;
            } else {
                // User cancelled or entered empty password - just refresh display
                forceUpdateDisplay = true;
            }
        }
    }

    // Small delay to prevent excessive CPU usage
    delay(50);
}

function isPIN(str) {
    return /^[0-9.]+$/.test(str);
}

/**
 * Load configuration from file or create default config
 */
function loadConfiguration() {
    try {
        var configData = storage.read({ fs: fileSystem, path: PASSWORD_FILE });
        if (configData) {
            var loadedConfig = JSON.parse(configData);
            // Merge with defaults to ensure all properties exist
            config.password = loadedConfig.password || null;
            config.baseTimeout = loadedConfig.baseTimeout || 15000;
            config.maxTimeout = loadedConfig.maxTimeout || 300000;
            config.exponentialBackoff = loadedConfig.exponentialBackoff !== undefined ? loadedConfig.exponentialBackoff : true;
        }
    } catch (e) {
        // File doesn't exist or is corrupted, use defaults
    }
}

/**
 * Load password from config or setup new password if not set
 */
function loadOrSetupPassword() {
    if (config.password) {
        return config.password;
    }
    return setupNewPassword();
}

/**
 * Setup a new password and save it to file
 */
function setupNewPassword() {
    display.fill(BRUCE_BGCOLOR);
    display.setTextAlign('center', 'middle');
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Password Setup", displayWidth / 2, displayHeight / 4);

    display.setTextSize(1 + fontScale);
    display.setTextColor(BRUCE_SECCOLOR);
    display.drawText("First time setup", displayWidth / 2, displayHeight / 2 - 20 * fontScale);
    display.drawText("Press any key to", displayWidth / 2, displayHeight / 2 + 20 * fontScale);
    display.drawText("create password", displayWidth / 2, displayHeight / 2 + 20 * 2 * fontScale);

    // Wait for any key press
    while (!keyboard.getAnyPress()) {
        delay(50);
    }

    var newPassword = createPasswordWithConfirmation("Create new password:");
    config.password = newPassword;
    saveConfiguration();
    return newPassword;
}

function createPasswordWithConfirmation(initialPrompt) {
    var newPassword = "";
    var confirmPassword = "";

    // Loop until passwords match or user cancels
    while (true) {
        // Get new password
        newPassword = keyboard.keyboard(50, initialPrompt, true);
        if (newPassword === null || newPassword === "" || newPassword === "\x1b") {
            continue;
        }

        // Confirm password
        var promptText = isPIN(newPassword) ? "Confirm PIN:" : "Confirm password:";
        if (isPIN(newPassword)) {
            confirmPassword = keyboard.numKeyboard(50, promptText, true);
        } else {
            confirmPassword = keyboard.keyboard(50, promptText, true);
        }

        if (confirmPassword === null || confirmPassword === "\x1b") {
            // User cancelled confirmation
            continue; // Try again for setup
        }

        if (newPassword === confirmPassword) {
            return newPassword; // Success
        } else {
            // Passwords don't match, show error and try again
            display.fill(BRUCE_BGCOLOR);
            display.setTextAlign('center', 'middle');
            display.setTextSize(1 + fontScale);
            display.setTextColor(colours[3]); // Red
            display.drawText("Passwords don't match!", displayWidth / 2, displayHeight / 2 - 10);
            display.setTextColor(BRUCE_SECCOLOR);
            display.drawText("Try again...", displayWidth / 2, displayHeight / 2 + 10);
            delay(2000);
        }
    }
}

/**
 * Save configuration to file
 */
function saveConfiguration() {
    try {
        storage.write({ fs: fileSystem, path: PASSWORD_FILE }, JSON.stringify(config, null, 2), "write");
    } catch (e) {
        console.log("Warning: Could not save configuration file: " + e.message);
    }
}

/**
 * Save password to configuration file (deprecated - use saveConfiguration)
 */
function savePassword(pwd) {
    config.password = pwd;
    saveConfiguration();
}

/**
 * Enter settings mode with authentication
 */
function enterSettingsMode() {
    // Show "entering settings" screen
    display.fill(BRUCE_BGCOLOR);
    display.setTextAlign('center', 'middle');
    display.setTextSize(2 + fontScale);
    display.setTextColor(colours[4]); // Yellow
    display.drawText("Entering", displayWidth / 2, displayHeight / 2 - 20);
    display.drawText("Settings", displayWidth / 2, displayHeight / 2 + 20);
    delay(1500);

    // Prompt for password authentication
    var enteredPassword;
    if (isPIN(password)) {
        enteredPassword = keyboard.numKeyboard(50, "Enter PIN to access settings:", true);
    } else {
        enteredPassword = keyboard.keyboard(50, "Enter password to access settings:", true);
    }

    if (enteredPassword === password) {
        inSettingsMode = true;
        settingsUnlocked = true;
        settingsMenuIndex = 0;
        forceUpdateDisplay = true;
    } else {
        // Wrong password or cancelled
        display.fill(BRUCE_BGCOLOR);
        display.setTextAlign('center', 'middle');
        display.setTextSize(1 + fontScale);
        display.setTextColor(colours[3]); // Red
        display.drawText("Access Denied", displayWidth / 2, displayHeight / 2);
        delay(2000);
        forceUpdateDisplay = true;
    }
    delay(500);
    handleSettingsMode();
}

/**
 * Handle settings mode input and display
 */
function handleSettingsMode() {
    if (!settingsUnlocked) {
        return;
    }

    // Handle navigation
    if (keyboard.getNextPress()) {
        settingsMenuIndex = (settingsMenuIndex + 1) % settingsOptions.length;
        forceUpdateDisplay = true;
    } else if (keyboard.getPrevPress()) {
        settingsMenuIndex = (settingsMenuIndex - 1 + settingsOptions.length) % settingsOptions.length;
        forceUpdateDisplay = true;
    }

    // Handle selection
    if (keyboard.getSelPress()) {
        if (settingsOptions[settingsMenuIndex] === "Change Password") {
            changePassword();
        } else if (settingsOptions[settingsMenuIndex] === "Timeout Settings") {
            configureTimeout();
        }
    }

    // Display settings menu
    if (forceUpdateDisplay) {
        drawSettingsMenu();
        forceUpdateDisplay = false;
    }
}

/**
 * Draw the settings menu
 */
function drawSettingsMenu() {
    display.fill(BRUCE_BGCOLOR);
    display.setTextAlign('center', 'middle');

    // Title
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Settings", displayWidth / 2, displayHeight / 6);

    // Menu options
    display.setTextSize(1 + fontScale);
    for (var i = 0; i < settingsOptions.length; i++) {
        var yPos = displayHeight / 3 + (i * 22 * fontScale);
        var isSelected = (i === settingsMenuIndex);

        display.setTextColor(isSelected ? colours[6] : colours[2]); // Green if selected, white otherwise
        var prefix = isSelected ? "> " : "  ";
        display.setTextAlign('left', 'middle');
        display.drawText(prefix + settingsOptions[i], displayWidth / 5, yPos);
    }

    // Instructions
    display.setTextAlign('center', 'middle');
    display.setTextSize(1 + fontScale);
    display.setTextColor(colours[1]); // Grey
    display.drawText("Next/Prev: Navigate", displayWidth / 2, displayHeight - 40);
    display.drawText("Select: Choose  ESC: Exit", displayWidth / 2, displayHeight - 20);
}

/**
 * Change password functionality
 */
function changePassword() {
    var newPassword = createPasswordWithConfirmation("Enter new password:", null);

    if (newPassword === null) {
        return; // User cancelled
    }

    // Passwords match, save and exit
    config.password = newPassword;
    saveConfiguration();

    // Show success message
    display.fill(BRUCE_BGCOLOR);
    display.setTextAlign('center', 'middle');
    display.setTextSize(1 + fontScale);
    display.setTextColor(colours[6]); // Green
    display.drawText("Password Changed", displayWidth / 2, displayHeight / 2 - 10);
    display.drawText("Successfully!", displayWidth / 2, displayHeight / 2 + 10);
    delay(2000);

    forceUpdateDisplay = true;
}

/**
 * Configure timeout settings
 */
function configureTimeout() {
    var timeoutMenuIndex = 0;
    var timeoutOptions = ["Base Timeout", "Max Timeout", "Exponential Backoff"];
    var inTimeoutMenu = true;
    var needsUpdate = true;

    while (inTimeoutMenu) {
        // Only redraw when needed
        if (needsUpdate) {
            // Draw timeout configuration menu
            display.fill(BRUCE_BGCOLOR);
            display.setTextAlign('center', 'middle');

            // Title
            display.setTextSize(2 + fontScale);
            display.setTextColor(BRUCE_PRICOLOR);
            display.drawText("Timeout Settings", displayWidth / 2, displayHeight / 8);

            // Current values display
            display.setTextSize(1 + fontScale);
            display.setTextColor(colours[1]); // Grey
            display.drawText("Base: " + (config.baseTimeout / 1000) + "s  Max: " + (config.maxTimeout / 1000) + "s", displayWidth / 2, displayHeight / 4);
            display.drawText("Exponential: " + (config.exponentialBackoff ? "ON" : "OFF"), displayWidth / 2, displayHeight / 4 + 20 * fontScale);

            // Menu options
            for (var i = 0; i < timeoutOptions.length; i++) {
                var yPos = displayHeight / 2 + (i * 22 * fontScale) + 20 * fontScale;
                var isSelected = (i === timeoutMenuIndex);

                display.setTextColor(isSelected ? colours[6] : colours[2]);
                var prefix = isSelected ? "> " : "  ";
                display.setTextAlign('left', 'middle');
                display.drawText(prefix + timeoutOptions[i], displayWidth / 5, yPos);
            }

            needsUpdate = false;
        }

        // Handle input
        delay(50);

        if (keyboard.getNextPress()) {
            timeoutMenuIndex = (timeoutMenuIndex + 1) % timeoutOptions.length;
            needsUpdate = true;
        } else if (keyboard.getPrevPress()) {
            timeoutMenuIndex = (timeoutMenuIndex - 1 + timeoutOptions.length) % timeoutOptions.length;
            needsUpdate = true;
        } else if (keyboard.getSelPress()) {
            if (timeoutOptions[timeoutMenuIndex] === "Base Timeout") {
                configureBaseTimeout();
                needsUpdate = true;
            } else if (timeoutOptions[timeoutMenuIndex] === "Max Timeout") {
                configureMaxTimeout();
                needsUpdate = true;
            } else if (timeoutOptions[timeoutMenuIndex] === "Exponential Backoff") {
                config.exponentialBackoff = !config.exponentialBackoff;
                saveConfiguration();
                needsUpdate = true;
            }
        } else if (keyboard.getEscPress()) {
            inTimeoutMenu = false;
        }
    }

    forceUpdateDisplay = true;
}

/**
 * Configure base timeout duration
 */
function configureBaseTimeout() {
    var timeoutSeconds = Math.round(config.baseTimeout / 1000);
    var newTimeout = keyboard.numKeyboard(3, "Base timeout (5-120 seconds):", false);

    if (newTimeout && !isNaN(parseInt(newTimeout))) {
        var seconds = parseInt(newTimeout);
        if (seconds >= 5 && seconds <= 120) {
            config.baseTimeout = seconds * 1000;
            saveConfiguration();

            // Show success
            display.fill(BRUCE_BGCOLOR);
            display.setTextAlign('center', 'middle');
            display.setTextSize(1 + fontScale);
            display.setTextColor(colours[6]);
            display.drawText("Base timeout set to", displayWidth / 2, displayHeight / 2 - 10);
            display.drawText(seconds + " seconds", displayWidth / 2, displayHeight / 2 + 10);
            delay(1500);
        } else {
            showTimeoutError("Invalid range (5-120 seconds)");
        }
    }
}

/**
 * Configure maximum timeout duration
 */
function configureMaxTimeout() {
    var maxTimeoutSeconds = Math.round(config.maxTimeout / 1000);
    var newMaxTimeout = keyboard.numKeyboard(4, "Max timeout (60-3600 seconds):", false);

    if (newMaxTimeout && !isNaN(parseInt(newMaxTimeout))) {
        var seconds = parseInt(newMaxTimeout);
        if (seconds >= 60 && seconds <= 3600) {
            config.maxTimeout = seconds * 1000;
            saveConfiguration();

            // Show success
            display.fill(BRUCE_BGCOLOR);
            display.setTextAlign('center', 'middle');
            display.setTextSize(1 + fontScale);
            display.setTextColor(colours[6]);
            display.drawText("Max timeout set to", displayWidth / 2, displayHeight / 2 - 10);
            display.drawText(seconds + " seconds", displayWidth / 2, displayHeight / 2 + 10);
            delay(1500);
        } else {
            showTimeoutError("Invalid range (60-3600 seconds)");
        }
    }
}

/**
 * Show timeout configuration error
 */
function showTimeoutError(message) {
    display.fill(BRUCE_BGCOLOR);
    display.setTextAlign('center', 'middle');
    display.setTextSize(1 + fontScale);
    display.setTextColor(colours[3]); // Red
    display.drawText("Error:", displayWidth / 2, displayHeight / 2 - 10);
    display.drawText(message, displayWidth / 2, displayHeight / 2 + 10);
    delay(2000);
}

/**
 * Draw status bar with battery and clock
 */
function drawStatusBar() {
    var currentTime = Date.now();
    var batteryLevel = getBatteryLevel();
    var batteryString = batteryLevel + "%";

    // Only show time if timestamp is valid (after 2025-01-01)
    var showClock = currentTime > 1735689600000;

    if (showClock) {
        var timeString = formatTime(currentTime);
        // Draw time on the left
        display.setTextAlign('left', 'top');
        display.setTextSize(1 + fontScale);
        display.setTextColor(BRUCE_SECCOLOR);
        display.drawText(timeString, 5, 5);
    }

    // Draw battery on the right
    display.setTextAlign('right', 'top');
    var batteryColor = batteryLevel > 20 ? BRUCE_SECCOLOR : colours[3]; // White or red if low
    display.setTextColor(batteryColor);
    display.drawText(batteryString, displayWidth - 40, 5);

    // Draw battery icon
    drawBatteryIcon(displayWidth - 35, 5, batteryLevel);
}

/**
 * Format time as HH:MM from timestamp
 */
function formatTime(timestamp) {
    // Calculate total seconds since epoch
    var totalSeconds = Math.floor(timestamp / 1000);

    // Calculate hours and minutes (simplified - shows time since epoch % 24 hours)
    var secondsInDay = totalSeconds % 86400; // 86400 seconds in a day
    var hours = Math.floor(secondsInDay / 3600);
    var minutes = Math.floor((secondsInDay % 3600) / 60);

    // Pad with zeros if needed
    var hoursStr = hours < 10 ? "0" + hours : hours.toString();
    var minutesStr = minutes < 10 ? "0" + minutes : minutes.toString();

    return hoursStr + ":" + minutesStr;
}

/**
 * Get battery level percentage
 */
function getBatteryLevel() {
    try {
        var level = battery.level();
        return Math.round(level);
    } catch (e) {
        return 100; // Default if battery module not available
    }
}

/**
 * Draw battery icon
 */
function drawBatteryIcon(x, y, level) {
    // Battery outline (30x15 pixels)
    display.drawRect(x, y, 30, 15, colours[2]); // White outline
    display.drawFillRect(x + 30, y + 5, 3, 5, colours[2]); // Battery tip

    // Fill based on level
    var fillWidth = Math.max(1, Math.round((level / 100) * 28));
    var fillColor = level > 20 ? colours[6] : colours[3]; // Green or red
    display.drawFillRect(x + 1, y + 1, fillWidth, 13, fillColor);
}
