/**
 * Bruce HA Dashboard - Home Assistant Control App
 * 
 * This app allows controlling Home Assistant devices via Bruce firmware's REST API.
 * 
 * CONFIGURATION (Edit these values at the top):
 */

// Server Configuration
var SERVER_URL = "http://192.168.1.100:8123";  // Replace with your Home Assistant IP and port
var ACCESS_TOKEN = "YOUR_BEARER_TOKEN_HERE";   // Get from http://SERVER_URL/profile

// List of Devices to Control (entity IDs)
var DEVICES = [
    "light.living_room",           // Living room light
    "switch.kitchen_outlet",       // Kitchen outlet switch
    "climate.living_room_thermostat",  // Thermostat
    "sensor.front_door_motion",    // Front door motion sensor
    "camera.front_door",           // Front door camera
    "media_player.living_room_tv"   // Living room TV
];

// Import required modules
var wifi = require("wifi");
var dialog = require("dialog");

/**
 * Fetch data from Home Assistant REST API
 * @param {string} endpoint - The API endpoint to call
 * @returns {string} Response body as string
 */
function fetchFromHA(endpoint) {
    var fullUrl = SERVER_URL + "/api/" + endpoint;
    
    // Check if wifi is connected
    if (!wifi.connected()) {
        dialog.error("Not connected to WiFi", true);
        return null;
    }
    
    // Make HTTP GET request with authorization header
    var response = wifi.httpFetch(fullUrl, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + ACCESS_TOKEN,
            "Content-Type": "application/json"
        }
    });
    
    return response.body;
}

/**
 * Send command to Home Assistant REST API (POST)
 * @param {string} endpoint - The API endpoint
 * @param {object} data - JSON data to send
 */
function postToHA(endpoint, data) {
    var fullUrl = SERVER_URL + "/api/" + endpoint;
    
    // Check if wifi is connected
    if (!wifi.connected()) {
        dialog.error("Not connected to WiFi", true);
        return false;
    }
    
    // Make HTTP POST request with authorization header and body
    var response = wifi.httpFetch(fullUrl, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + ACCESS_TOKEN,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    
    return response.body;
}

/**
 * Get all entity states from Home Assistant
 */
function getAllStates() {
    var result = fetchFromHA("states");
    if (result) {
        dialog.success("Retrieved " + DEVICES.length + " devices");
        return result;
    }
    return null;
}

/**
 * Get state of a specific device
 * @param {string} entityID - The entity ID of the device
 */
function getDeviceState(entityID) {
    var result = fetchFromHA("states/" + entityID);
    if (result) {
        dialog.info("Fetched state for: " + entityID);
        return result;
    }
    return null;
}

/**
 * Turn on a device
 * @param {string} entityID - The entity ID of the device
 */
function turnOnDevice(entityID) {
    var data = {
        "state": "on",
        "attributes": {}
    };
    
    dialog.message("Turning ON: " + entityID, true);
    postToHA("states/" + entityID, data);
    dialog.success("Device turned ON");
}

/**
 * Turn off a device
 * @param {string} entityID - The entity ID of the device
 */
function turnOffDevice(entityID) {
    var data = {
        "state": "off",
        "attributes": {}
    };
    
    dialog.message("Turning OFF: " + entityID, true);
    postToHA("states/" + entityID, data);
    dialog.success("Device turned OFF");
}

/**
 * Toggle a device (on if off, off if on)
 * @param {string} entityID - The entity ID of the device
 */
function toggleDevice(entityID) {
    var currentState = getDeviceState(entityID);
    
    // Parse current state to determine if it's "on" or "off"
    var isOn = (currentState && currentState.indexOf("on") !== -1);
    
    if (isOn) {
        turnOffDevice(entityID);
    } else {
        turnOnDevice(entityID);
    }
}

/**
 * Display device information in a text viewer
 */
function showDeviceInfo() {
    dialog.drawStatusBar();
    
    var infoText = "=== HOME ASSISTANT DASHBOARD ===\n\n";
    infoText += "Server: " + SERVER_URL + "\n";
    infoText += "Devices configured: " + DEVICES.length + "\n\n";
    infoText += "--- DEVICE LIST ---\n\n";
    
    for (var i = 0; i < DEVICES.length; i++) {
        var deviceID = DEVICES[i];
        var state = getDeviceState(deviceID);
        
        if (state) {
            infoText += "[" + i + "] " + deviceID + "\n";
            infoText += "    State: " + extractState(state) + "\n\n";
        } else {
            infoText += "[" + i + "] " + deviceID + " - Unable to fetch state\n\n";
        }
    }
    
    // Create text viewer widget
    var tftWidth = display.width();
    var tftHeight = display.height();
    
    var textViewer = dialog.createTextViewer(infoText, {
        fontSize: 1,
        startX: 5,
        startY: 5,
        width: tftWidth - 10,
        height: tftHeight - 20,
        indentWrappedLines: true
    });
}

/**
 * Extract state from entity state JSON string
 */
function extractState(stateJSON) {
    try {
        var parsed = JSON.parse(stateJSON);
        return parsed.state || "unknown";
    } catch (e) {
        return "error parsing";
    }
}

/**
 * Main application loop
 */
function main() {
    dialog.drawStatusBar();
    
    // Show welcome message
    dialog.message("Bruce HA Dashboard", true);
    dialog.info("Loading devices...");
    
    // Display all device information
    showDeviceInfo();
    
    // Main menu loop
    while (true) {
        dialog.drawStatusBar();
        
        var menuText = "=== MAIN MENU ===\n";
        menuText += "1. Refresh Device States\n";
        menuText += "2. Toggle All Devices\n";
        menuText += "3. Show Detailed Info\n";
        menuText += "4. Exit\n";
        
        dialog.viewText(menuText);
        
        // Wait for user selection
        var choice = dialog.message("Select option:", {
            left: "1",
            center: "2",
            right: "3"
        });
        
        if (choice === "left") {
            // Refresh all device states
            dialog.info("Refreshing device states...");
            showDeviceInfo();
        } else if (choice === "center") {
            // Toggle all devices
            var confirm = dialog.message("Toggle ALL devices?", {
                left: "No",
                right: "Yes"
            });
            
            if (confirm === "right") {
                for (var i = 0; i < DEVICES.length; i++) {
                    toggleDevice(DEVICES[i]);
                }
                dialog.success("All devices toggled");
            }
        } else if (choice === "right") {
            // Show detailed info
            showDeviceInfo();
        } else if (!choice) {
            // Exit
            break;
        }
    }
}

// Run the main application
main();
