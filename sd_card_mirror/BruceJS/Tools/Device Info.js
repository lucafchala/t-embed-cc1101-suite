// Import required modules for display, keyboard, and device functionality
const display = require("display");
const keyboard = require("keyboard");
const device = require("device");
const wifi = require("wifi");
const storage = require("storage");

// Define color palette for the device info display
// Colors are defined using RGB values (red, green, blue)
const colours = [
    display.color(0, 0, 0),       // black - used for background
    display.color(127, 127, 127), // grey - used for labels
    display.color(255, 255, 255), // white - used for values
    display.color(255, 255, 0),   // yellow - used for highlights
    display.color(255, 0, 0),     // red
    display.color(255, 140, 0),   // orange
    display.color(0, 255, 0),     // green
];

// Application state variables
var currentPage = 0;    // Current page being displayed
var totalPages = 5;     // Total number of info pages
var exitApp = false;    // Controls main application loop
var refreshInterval = 0; // Counter for auto-refresh

// Get display dimensions for responsive layout
const displayWidth = display.width();
const displayHeight = display.height();
// Scale font size based on display width (larger screens get bigger fonts)
const fontScale = (displayWidth > 320 ? 1 : 0);

displayPage();

/**
 * Displays basic device information (page 1)
 */
function displayDeviceInfo() {
    // Clear screen with black background
    display.fill(colours[0]);
    // Left-align text for better readability
    display.setTextAlign('left', 'middle');

    // Display page title
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Device Info", 10, 12);

    var y = 25 + fontScale * 10;
    display.setTextSize(1 + fontScale);
    display.setTextColor(colours[1]);
    display.drawText("Version:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText(device.getBruceVersion(), displayWidth / 3 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("Name:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText(device.getName(), displayWidth / 3 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("Board:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText(device.getBoard(), displayWidth / 3 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("Model:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText(device.getModel(), displayWidth / 3 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("IP Addr:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText(wifi.getIPAddress(), displayWidth / 3 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("MAC Addr:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText(wifi.getMACAddress(), displayWidth / 3 + 10, y);

    drawFooter("Screen Info", "Battery Info");
}

function displayBatteryInfo() {
    // Clear screen with black background
    display.fill(colours[0]);
    // Left-align text for better readability
    display.setTextAlign('left', 'middle');

    // Display page title
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Battery Info", 10, 12);

    var battery = device.getBatteryDetailed();

    var y = 25 + fontScale * 10;
    display.setTextSize(1 + fontScale);
    display.setTextColor(colours[1]);
    display.drawText("Battery:", 10, y);
    display.setTextColor(colours[(battery.battery_percent > 75 ? 6 : (battery.battery_percent > 50 ? 5 : (battery.battery_percent > 25 ? 3 : 4)))]);
    display.drawText(battery.battery_percent + "%", displayWidth / 3 + 10, y);
    display.setTextColor(colours[2]);
    display.drawText(battery.voltage + "V", displayWidth / 2 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("Capacity:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText(battery.remaining_capacity + "/" + battery.full_capacity + "mAh", displayWidth / 3 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("Is Charging:", 10, y);
    display.setTextColor(colours[(battery.is_charging ? 6 : 4)]);
    display.drawText(battery.is_charging, displayWidth / 3 + 10, y);
    display.setTextColor(colours[2]);
    display.drawText(battery.charging_current + "mA", displayWidth / 2 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("Time Left:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText((battery.is_charging ? "Forever" : battery.time_to_empty + " minutes"), displayWidth / 3 + 10, y);

    y += 12 + fontScale * 5;
    display.setTextColor(colours[1]);
    display.drawText("Curr Usage:", 10, y);
    display.setTextColor(colours[2]);
    display.drawText("I:" + battery.current_instant + "mA", displayWidth / 6 * 2 + 10, y);
    display.drawText("A:" + battery.current_average + "mA", displayWidth / 6 * 3 + 35, y);
    display.drawText("R:" + battery.current_raw + "mA", displayWidth / 6 * 5 - 15, y);

    drawFooter("Device Info", "Storage Info");
}

/**
 * Displays storage information (page 3)
 */
function displayStorageInfo() {
    // Clear screen with black background
    display.fill(colours[0]);
    // Left-align text for better readability
    display.setTextAlign('left', 'middle');

    // Display page title
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Storage Info", 10, 12);

    // Get storage space
    const storageSpaceLittleFS = storage.spaceLittleFS();
    const storageSpaceSDCard = storage.spaceSDCard();
    const memoryStats = device.getFreeHeapSize();

    // Display LittleFS
    var y = 25 + fontScale * 10;
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[2]);
    display.drawText("LittleFS:", 10, y);

    y += 12 + fontScale * 5;
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Total:", 25, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(storageSpaceLittleFS.total * 1024), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Used:", 25, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(storageSpaceLittleFS.used * 1024), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Free:", 25, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(storageSpaceLittleFS.free * 1024), displayWidth / 8 * 7, y);

    // Display SD Card
    y += 12 + fontScale * 5;
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[2]);
    display.drawText("SD Card:", 10, y);

    y += 12 + fontScale * 5;
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Total:", 25, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(storageSpaceSDCard.total * 1024), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Used:", 25, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(storageSpaceSDCard.used * 1024), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Free:", 25, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(storageSpaceSDCard.free * 1024), displayWidth / 8 * 7, y);

    drawFooter("Battery Info", "Memory Info");
}

/**
 * Displays memory information (page 4)
 */
function displayMemoryInfo() {
    // Clear screen with black background
    display.fill(colours[0]);
    // Left-align text for better readability
    display.setTextAlign('left', 'middle');

    // Display page title
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Memory Info", 10, 12);

    // Get memory statistics
    const memoryStats = device.getFreeHeapSize();

    // Display memory information
    var y = 25 + fontScale * 10;
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("RAM Free:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(memoryStats.ram_free), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("RAM Size:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(memoryStats.ram_size), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("RAM Min Free:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(memoryStats.ram_min_free), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("PSRAM Free:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(memoryStats.psram_free), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("PSRAM Size:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(formatBytes(memoryStats.psram_size), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("EEPROM Size:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(device.getEEPROMSize(), displayWidth / 8 * 7, y);

    drawFooter("Storage Info", "Screen Info");
}

/**
 * Displays screen information (page 5)
 */
function displayScreenInfo() {
    // Clear screen with black background
    display.fill(colours[0]);
    // Left-align text for better readability
    display.setTextAlign('left', 'middle');

    // Display page title
    display.setTextSize(2 + fontScale);
    display.setTextColor(BRUCE_PRICOLOR);
    display.drawText("Screen Info", 10, 12);

    // Display screen information
    var y = 25 + fontScale * 10;
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Height:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(display.height(), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Width:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(display.width(), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Rotation:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(display.getRotation(), displayWidth / 8 * 7, y);

    y += 12 + fontScale * 5;
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Brightness:", 10, y);
    display.setTextAlign('right', 'middle');
    display.setTextColor(colours[2]);
    display.drawText(display.getBrightness() + "%", displayWidth / 8 * 7, y);

    drawFooter("Memory Info", "Device Info");
}

/**
 * Helper function to draw the footer
 */
function drawFooter(previous, next) {
    // Display navigation info
    display.setTextSize(1 + fontScale);
    display.setTextAlign('left', 'middle');
    display.setTextColor(colours[1]);
    display.drawText("Prev: " + previous + "   Next: " + next, 10, displayHeight - 42 - fontScale * 5);
    display.drawText("Exit: Close", 10, displayHeight - 25 - fontScale * 5);

    // Display author credit in white at bottom
    display.setTextSize(1 + fontScale);
    display.setTextAlign('center', 'middle');
    display.setTextColor(colours[2]);
    display.drawText("By github.com/emericklaw", displayWidth / 2, displayHeight - 5 - fontScale * 5);
}

/**
 * Helper function to format bytes into readable units
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0.0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

/**
 * Main display function that shows the current page
 */
function displayPage() {
    if (currentPage === 0) {
        displayDeviceInfo();
    } else if (currentPage === 1) {
        displayBatteryInfo();
    } else if (currentPage === 2) {
        displayStorageInfo();
    } else if (currentPage === 3) {
        displayMemoryInfo();
    } else if (currentPage === 4) {
        displayScreenInfo();
    }
    console.log(currentPage);
}

// Main application loop - continues until exitApp becomes true
while (!exitApp) {
    // Check for exit button press (ESC key)
    if (keyboard.getEscPress()) {
        display.fill(colours[0]);
        exitApp = true;
        break;
    }

    // Handle Next button press - go to next page
    if (keyboard.getNextPress()) {
        currentPage++;
        if (currentPage >= totalPages) {
            currentPage = 0;  // Wrap around to first page
        }
        displayPage();
    }

    // Handle Previous button press - go to previous page
    if (keyboard.getPrevPress()) {
        currentPage--;
        if (currentPage < 0) {
            currentPage = totalPages - 1;  // Wrap around to last page
        }
        displayPage();
    }

    // Handle Select button press - refresh current page
    if (keyboard.getSelPress()) {
        displayPage();
    }

    // Auto-refresh every 5 seconds (100 * 50ms = 5000ms)
    refreshInterval++;
    if (refreshInterval >= 100) {
        displayPage();
        refreshInterval = 0;
    }

    // Small delay to prevent excessive CPU usage and button bouncing
    delay(50);
}
