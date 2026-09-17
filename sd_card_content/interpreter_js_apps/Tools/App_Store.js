var device = require("device");
var display = require("display");
var keyboard = require("keyboard");
var storage = require("storage");
var wifi = require("wifi");

// Color palette
var colours = {
    black: display.color(0, 0, 0),
    grey: display.color(127, 127, 127),
    white: display.color(255, 255, 255),
    green: display.color(0, 255, 0),
    yellow: display.color(255, 255, 0),
    orange: display.color(255, 165, 0),
    red: display.color(255, 0, 0),
    cyan: display.color(0, 255, 255)
};

// Configuration constants

var BASE_URL = "http://ghp.iceis.co.uk";
var CATEGORIES_URL = BASE_URL + "/service/main/releases/categories.json";
var SCRIPTS_DIR = "/BruceJS/", THEMES_DIR = "/Themes/";
var VERSION_FILE = "/BruceAppStore/installed.json", CACHE_DIR = "/BruceAppStore/cache/", LAST_UPDATED_FILE = "/BruceAppStore/lastUpdated.json";

// Data storage and application state
var availableCategories = [], availableScripts = [], releasesData = {}, installedVersions = {}, updatesAvailable = [];
var currentScript = 0, lastCategoryIndex = 0, selectedMenuOption = 0;
var currentView = "categories", selectedCategory = null;
var exitApp = false, isLoadingScripts = false, isLoadingCategories = false, isDownloading = false, showMenu = false;
var popupMessage = "", popupMessageClearTime = 0;
var descriptionScrollOffset = 0, nameScrollOffset = 0, lastScrollTime = 0;
var menuOptions = [], fileSystem = "littlefs";
var dirtyCategories = false, dirtyScripts = false, dirtyActionMenu = false;


// Display configuration
var displayWidth = display.width(), displayHeight = display.height();
var fontScale = displayWidth > 300 ? 1 : 0;
var maxCharacters = Math.trunc(displayWidth / (6 * (fontScale + 1)));
var fontHeight1 = 8 * (1 + fontScale), fontHeight2 = 8 * (2 + fontScale);


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

/**
 * Clear popup message after a delay
 */
function clearPopupAfterDelay() {
    popupMessageClearTime = now() + 3000;
}

/**
 * Check and clear status message if time expired
 */
function checkPopupClear() {
    if (popupMessageClearTime > 0 && now() >= popupMessageClearTime && popupMessage != "") {
        popupMessage = "";
        if (currentView === "categories") {
            dirtyCategories = true;
        } else if (currentView === "scripts") {
            dirtyScripts = true;
        }
    }
}

/**
 * Update description scrolling for long text
 */
function updateDescriptionScroll() {
    if (popupMessage || showMenu || currentView !== "scripts" ||
        availableScripts.apps.length === 0 || isLoadingScripts || isDownloading ||
        now() - lastScrollTime <= 200) {
        return;
    }

    lastScrollTime = now();
    var script = availableScripts.apps[currentScript];

    // Scroll description if needed
    if (script.d.length > maxCharacters) {
        descriptionScrollOffset = ++descriptionScrollOffset > script.d.length + 10 ? 0 : descriptionScrollOffset;
        updateDescriptionArea(script);
    }

    // Scroll name if needed - calculate max chars for size 2 text
    var nameTextSize = 2 + fontScale;
    var nameCharWidth = 6 * nameTextSize;
    var maxCharsForName = Math.floor(displayWidth / nameCharWidth);
    
    if (script.n.length > maxCharsForName) {
        nameScrollOffset = ++nameScrollOffset > script.n.length + 10 ? 0 : nameScrollOffset;
        updateNameArea(script);
    }
}

/**
 * Update only the description area to prevent screen flashing
 */
function updateDescriptionArea(script) {
    var descY = displayHeight / 10 * 5 + ((fontScale + 1) * 3) + 3;

    // Clear and setup display
    display.drawFillRect(0, descY - 10, displayWidth, 20, colours.black);
    setDisplayText(1, colours.white);

    // Create and display scrolling text
    var paddedText = script.d + "    ";
    var startPos = descriptionScrollOffset % paddedText.length;
    display.drawText((paddedText + paddedText).substring(startPos, startPos + maxCharacters),
        displayWidth / 2, descY);
}

/**
 * Update only the name area to prevent screen flashing
 */
function updateNameArea(script) {
    var nameY = displayHeight / 10 * 4;

    // Clear and setup display
    display.drawFillRect(0, nameY - 15, displayWidth, 30, colours.black);
    setDisplayText(2, colours.green);

    // Calculate max characters for size 2 text (actual font size is 2 + fontScale)
    var actualTextSize = 2 + fontScale;
    var charWidth = 6 * actualTextSize; // 6 pixels base width * text size
    var maxCharsForName = Math.floor(displayWidth / charWidth);

    // Create and display scrolling text
    var paddedText = script.n + "    ";
    var startPos = nameScrollOffset % paddedText.length;
    display.drawText((paddedText + paddedText).substring(startPos, startPos + maxCharsForName),
        displayWidth / 2, nameY);
}

/**
 * Reset description scroll when changing scripts
 */
function resetDescriptionScroll() {
    descriptionScrollOffset = 0;
    nameScrollOffset = 0;
}

// Detect file system at startup
detectFileSystem();

/**
 * Helper function to get installed version for a script
 */
function getInstalledVersion(script) {
    var installed = installedVersions[script.s];
    return (installed && installed.version) ? installed.version : null;
}

/**
 * Helper function to set display text properties
 */
function setDisplayText(size, color, align) {
    display.setTextSize(size + fontScale);
    display.setTextColor(color);
    display.setTextAlign(align || 'center', 'middle');
}

/**
 * Helper function to construct file paths consistently
 */
function getLocalFilePath(file, baseLocalDir, category, themeName) {
    // Determine the file path from the file object
    var filePath = (file && typeof file === 'object' && file.destination) 
        ? file.destination 
        : file;
    
    // Clean leading slashes from file path
    filePath = filePath.replace(/^\/+/, '');
    
    // For themes, use theme name as the category path
    var categoryPath = (category === 'Themes' && themeName) ? themeName : category;
    
    return baseLocalDir + categoryPath + '/' + filePath;
}

/**
 * Helper function to draw version info consistently
 */
function drawVersionInfo(script, startLine) {
    if (script.v !== 'UNKNOWN') {
        var installedVer = getInstalledVersion(script) || "None";
        drawText("Available: " + script.v, 1, "C", "G" + startLine, colours.grey);
        if (installedVer !== 'None') {
            drawText("Installed: " + installedVer, 1, "C", "G" + (startLine + 1), colours.grey);
        }
    }
}

/**
 * Helper function to check WiFi and display error if needed
 */
function checkWiFiConnection() {
    if (!wifi.connected()) {
        displayPopup("WiFi not connected");
        return false;
    }
    return true;
}

/**
 * Helper function to display scrolling text
 */
function drawScrollingText(text, centerX, y, scrollOffset) {
    var maxCharacters = Math.floor(displayWidth / (6 + fontScale));
    if (text.length > maxCharacters) {
        var displayText = text + "    ";
        var startPos = scrollOffset % displayText.length;
        var scrolledText = displayText.substring(startPos) + displayText.substring(0, startPos);
        var visibleText = scrolledText.substring(0, maxCharacters);
        display.setTextAlign('left', 'middle');
        display.drawText(visibleText, 0, y);
    } else {
        display.setTextAlign('center', 'middle');
        display.drawText(text, centerX, y);
    }
}

/**
 * Helper function to check device compatibility
 */
function checkDeviceCompatibility(app, currentDeviceBoard, isThemesCategory, currentResolution) {
    if (app["sd"] && !isThemesCategory) {
        var deviceMatches = false;
        var devices = app["sd"];

        if (typeof devices === "string") {
            deviceMatches = new RegExp(devices).test(currentDeviceBoard);
        } else if (devices.length > 0) {
            deviceMatches = devices.some(function (device) {
                return new RegExp(device).test(currentDeviceBoard);
            });
        }
        if (!deviceMatches) return false;
    }

    // Additional screen size check for themes only
    if (isThemesCategory && app["sss"] && app["sss"] !== currentResolution) {
        return false;
    }

    return true;
}

/**
 * Show action menu for current script
 */
function showActionMenu(script) {
    showMenu = true;
    selectedMenuOption = 0;

    var installedVersion = getInstalledVersion(script);
    var isInstalled = !!installedVersion;
    var hasUpdate = isInstalled && installedVersion !== script.v;

    menuOptions = isInstalled
        ? (hasUpdate ? ["Update", "Reinstall", "Delete"] : ["Reinstall", "Delete"])
        : ["Install"];

    menuOptions.push("Back");
    dirtyActionMenu = true;
}

/**
 * Hide action menu
 */
function hideActionMenu() {
    showMenu = false;
    dirtyScripts = true;
}

/**
 * Execute selected menu action
 */
function executeMenuAction(script) {
    var action = menuOptions[selectedMenuOption];
    hideActionMenu();

    if (["Install", "Reinstall", "Update"].indexOf(action) !== -1) {
        installScript(script);
    } else if (action === "Delete") {
        deleteScript(script);
    }
}

/**
 * Delete a script
 */
/**
 * Helper function to show popup and clear after delay
 */
function showPopup(message) {
    displayPopup(message);
    clearPopupAfterDelay();
}

/**
 * Helper function to show interface with optional progress
 */
function showInterface(title, text, showProgress) {
    displayInterfaceNew(title, text, showProgress);
}

function deleteScript(script) {
    showInterface(script.n, "Deleting", true);
    try {
        var fullMetadata = loadFullMetadata(script);
        var files = fullMetadata.files || [];
        var baseLocalDir = (fullMetadata.category === 'Themes') ? THEMES_DIR : SCRIPTS_DIR;
        var deletedAny = false;

        for (var i = 0; i < files.length; i++) {
            showInterface(script.n, "Deleting file " + (i + 1) + " of " + files.length);
            var localFilePath = getLocalFilePath(files[i], baseLocalDir, fullMetadata.category, script.n);

            if (storage.remove({ fs: fileSystem, path: localFilePath })) {
                deletedAny = true;
            }
        }
        showInterface(script.n, "Finalizing deletion");

        if (deletedAny) {
            var categoryPath = fullMetadata.category === 'Themes' ? fullMetadata.category + '/' + script.n : fullMetadata.category;
            var filesInDir = storage.readdir({ fs: fileSystem, path: baseLocalDir + categoryPath });
            if (filesInDir.length === 0) {
                storage.remove({ fs: fileSystem, path: baseLocalDir + categoryPath });
            }

            delete installedVersions[script.s];
            saveInstalledVersions();
            dirtyScripts = true;
            showInterface("", "");
            drawScriptView();
            showPopup("Deleted successfully!");
        } else {
            showPopup("Failed deleting");
        }
    } catch (e) {
        showPopup("Err: " + e.message);
    }
    gc();
}

// Load installed versions
loadInstalledVersions();

// Load available categories
loadAvailableCategories();

/**
 * Load available scripts from remote releases.json
 */
function loadAvailableCategories() {
    isLoadingCategories = true;
    displayInterfaceNew("Launching", "Loading categories");

    try {
        if (!checkWiFiConnection()) {
            isLoadingCategories = false;
            return;
        }
        console.log("Fetching categories from: " + CATEGORIES_URL);
        var response = wifi.httpFetch(CATEGORIES_URL, {
            method: "GET",
            responseType: "json"
        });

        if (response.status === 200) {
            console.log("Successfully fetched categories.json");
            availableCategories = response.body;

            currentView = "categories";

            preloadCategoryFiles();

            createUpdatesCategory();

        } else {
            displayPopup("Err: " + response.status);
        }

    } catch (e) {
        displayPopup("Err: " + e.message);
    }
    displayPopup("");
    isLoadingCategories = false;
    dirtyCategories = true;
    gc();
    displayInterfaceNew();
    clearPopupAfterDelay();
}

/**
 * Preload all category files on startup if not already cached
 */
function preloadCategoryFiles() {
    if (!availableCategories || !availableCategories.categories) return;

    // Load existing category timestamps (as array)
    var storedTimestamps = [];
    try {
        var lastUpdatedData = storage.read({ fs: fileSystem, path: LAST_UPDATED_FILE });
        if (lastUpdatedData) {
            var parsedData = JSON.parse(lastUpdatedData);
            storedTimestamps = parsedData.categories || [];
        }
    } catch (e1) {
        // No stored file or invalid, use empty array
    }

    var currentDeviceBoard = device.getBoard();
    var currentResolution = displayWidth + "x" + displayHeight;

    for (var c = 0; c < availableCategories.categories.length; c++) {
        var category = availableCategories.categories[c];
        displayInterfaceNew("Launching", "Processing " + category.name);

        console.log("Processing category: " + category.slug);

        // Skip categories without a slug or updates category
        if (!category.slug || category.slug === "updates") continue;

        var cacheFileName = CACHE_DIR + "category-" + category.slug + ".json";
        var categoryLastUpdated = category.lastUpdated || 0;

        // Find stored timestamp for this category
        var storedLastUpdated = 0;
        var timestampIndex = -1;
        for (var t = 0; t < storedTimestamps.length; t++) {
            if (storedTimestamps[t].slug === category.slug) {
                storedLastUpdated = storedTimestamps[t].lastUpdated || 0;
                timestampIndex = t;
                break;
            }
        }

        // Check if cache file needs to be updated
        var needsDownload = categoryLastUpdated > storedLastUpdated;

        if (!needsDownload) {
            try {
                needsDownload = !storage.read({ fs: fileSystem, path: cacheFileName });
            } catch (e2) {
                needsDownload = true;
            }
        }

        if (needsDownload) {
            try {
                console.log("Downloading category file: category-" + category.slug + ".json (lastUpdated: " + categoryLastUpdated + " > stored: " + storedLastUpdated + ")");
                var response = wifi.httpFetch(BASE_URL + "/service/main/releases/category-" + category.slug + ".min.json", {
                    method: "GET",
                    responseType: "json"
                });

                if (response.status === 200) {
                    console.log("Successfully downloaded category-" + category.slug + ".json");
                    var categoryData = response.body;

                    // Apply filtering before caching
                    var filteredApps = [];
                    var isThemesCategory = category.slug === "themes" || (category.name && category.name.toLowerCase().indexOf("theme") !== -1);

                    for (var i = 0; i < categoryData.apps.length; i++) {
                        var app = categoryData.apps[i];
                        if (checkDeviceCompatibility(app, currentDeviceBoard, isThemesCategory, currentResolution)) {
                            filteredApps.push(app);
                        }
                    }

                    categoryData.apps = filteredApps;
                    categoryData.count = filteredApps.length;

                    // Cache the filtered data
                    try {
                        storage.write({ fs: fileSystem, path: cacheFileName }, JSON.stringify(categoryData, null, 2), "write");

                        // Update stored timestamp for this category immediately after successful save
                        if (timestampIndex >= 0) {
                            storedTimestamps[timestampIndex].lastUpdated = categoryLastUpdated;
                        } else {
                            storedTimestamps.push({
                                slug: category.slug,
                                lastUpdated: categoryLastUpdated
                            });
                        }

                        // Save timestamps immediately after successful cache write
                        try {
                            storage.write({ fs: fileSystem, path: LAST_UPDATED_FILE },
                                JSON.stringify({ categories: storedTimestamps }, null, 2), "write");
                        } catch (e3) {
                            // Ignore timestamp save errors
                        }
                    } catch (e4) {
                        // Don't update timestamps if cache write failed
                        console.log("Error saving cache file for category " + category.slug + ": " + e4.message);
                    }
                } else {
                    console.log("Failed to download category-" + category.slug + ".json: HTTP " + response.status);
                }
            } catch (e5) {
                // Log download errors for preloading
                console.log("Error downloading category " + category.slug + ": " + e5.message);
            }
        } else {
            console.log("Category " + category.slug + " is up to date (stored: " + storedLastUpdated + ", remote: " + categoryLastUpdated + ")");
        }
        gc();
    }
}

/**
 * Load available scripts category
 */
function loadCategory(category) {
    try {
        // WiFi check needed for updates category
        if (category.slug === "updates" && !checkWiFiConnection()) {
            isLoadingScripts = false;
            return;
        }

        if (category.slug === "updates") {
            availableScripts = updatesAvailable;
        } else {
            // Load from cache (should always exist due to preloading)
            var cacheFileName = CACHE_DIR + "category-" + category.slug + ".json";

            try {
                var cachedData = storage.read({ fs: fileSystem, path: cacheFileName });
                if (cachedData) {
                    availableScripts = JSON.parse(cachedData);
                } else {
                    displayPopup("Error loading category data");
                }
            } catch (e1) {
                displayPopup("Error loading category data");
            }
        }
    } catch (e2) {
        displayPopup("Err: " + e2.message);
    }

    gc();

    isLoadingScripts = false;
    displayInterfaceNew();
    clearPopupAfterDelay();
}


function loadFullMetadata(script) {
    try {
    console.log(BASE_URL + '/service/main/repositories/' + script.s.replace(/ /g, '%20') + '/metadata.json');
            var response = wifi.httpFetch(BASE_URL + '/service/main/repositories/' + script.s.replace(/ /g, '%20') + '/metadata.json', {
            method: "GET",
            responseType: "json"
        });
        if (response.status === 200) {
            return response.body;
        }
        displayPopup("Err (A): " + response.status);
    } catch (e) {
        displayPopup("Err (B): " + e.message);
    }
    gc();
}

/**
 * Load installed script versions from file
 */
function loadInstalledVersions() {
    try {
        var versionData = storage.read({ fs: fileSystem, path: VERSION_FILE });
        installedVersions = versionData ? JSON.parse(versionData) : {};
    } catch (e) {
        installedVersions = {};
    }

    if (!installedVersions["BruceDevices/App-Store/App Store"]) {
        installedVersions["BruceDevices/App-Store/App Store"] = {
            version: "0.0.0",
            commit: ""
        };
        saveInstalledVersions();
    }
    gc();
}

/**
 * Save installed script versions to file and refresh Updates category
 */
function saveInstalledVersions() {
    try {
        storage.write({ fs: fileSystem, path: VERSION_FILE }, JSON.stringify(installedVersions, null, 2), "write");
        if (!isLoadingScripts && releasesData) {
            createUpdatesCategory();
        }
    } catch (e) {
        // Ignore save errors
    }
    gc();
}

/**
 * Get status indicator for script
 */
function getScriptStatus(script) {
    var installedVersion = getInstalledVersion(script);
    if (!installedVersion) return { text: "NOT INSTALLED", color: colours.yellow };
    if (installedVersion !== script.v) return { text: "UPDATE AVAILABLE", color: colours.orange };
    return { text: "UP TO DATE", color: colours.green };
}

/**
 * Helper function to split text into lines that fit within maxCharacters
 */
function splitTextIntoLines(text) {
    // First split by \n, then wrap each line to maxCharacters
    var rawLines = text.split('\n');
    var lines = [];
    for (var l = 0; l < rawLines.length; l++) {
        var segment = rawLines[l];
        if (segment.length <= maxCharacters) {
            lines.push(segment);
        } else {
            var words = segment.split(' '), currentLine = '';
            for (var i = 0; i < words.length; i++) {
                var testLine = currentLine + (currentLine.length > 0 ? ' ' : '') + words[i];
                if (testLine.length <= maxCharacters) {
                    currentLine = testLine;
                } else {
                    if (currentLine.length > 0) {
                        lines.push(currentLine);
                        currentLine = words[i];
                    } else {
                        lines.push(words[i]);
                    }
                }
            }
            if (currentLine.length > 0) lines.push(currentLine);
        }
    }
    return lines;
}

/**
 * Draw popup message with background box
 */
function displayPopup(message) {
    console.log("Display Popup Check: |" + popupMessage + "|" + (message !== undefined ? message : "") + "|");
    var redrawNeeded = false;
    if (message == undefined) {
        //popupMessage = "";
    } else if (popupMessage !== message) {
        if (message != "") {
            var redrawNeeded = true;
        }
        popupMessage = message;
    }
    console.log("Display Popup After Set: |" + popupMessage + "|" + redrawNeeded + "|");
    if (!redrawNeeded) return;
    console.log("Displaying popup: " + popupMessage);
    setDisplayText(1, colours.orange);

    var lines = splitTextIntoLines(popupMessage);
    var boxHeight = lines.length * (fontScale + 1) * 8 + 20;
    // Calculate boxWidth based on the longest line's pixel width
    // Calculate width - characters 6px wide at base scale
    var maxLineChars = 0;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].length > maxLineChars) maxLineChars = lines[i].length;
    }
    var charWidth = 6 * (1 + fontScale); // Per character
    var maxLineWidth = maxLineChars * charWidth;
    var boxWidth = Math.min(displayWidth - 20, maxLineWidth + 40); // Add padding
    var boxX = (displayWidth - boxWidth) / 2;
    var boxY = displayHeight / 2 - boxHeight / 2;

    // Draw box background and border
    display.drawFillRect(boxX, boxY, boxWidth, boxHeight, colours.black);
    display.drawRect(boxX, boxY, boxWidth, boxHeight, colours.orange);

    // Draw text lines
    lines.forEach(function (line, i) {
        var textY = boxY + 18 + (i * (fontScale + 1) * 8);
        display.drawText(line, displayWidth / 2, textY);
    });
}

/**
 * Draw action menu
 */
function drawActionMenu() {
    if (dirtyActionMenu) {
        dirtyActionMenu = false;
        if (!showMenu || availableScripts.apps.length === 0) return;

        var menuHeight = menuOptions.length * 16 + 24;
        var menuWidth = Math.min(displayWidth - 40, 200);
        var menuX = (displayWidth - menuWidth) / 2;
        var menuY = (displayHeight - menuHeight) / 2;

        // Draw menu background and border
        display.drawFillRect(menuX, menuY, menuWidth, menuHeight, colours.black);
        display.drawRect(menuX, menuY, menuWidth, menuHeight, colours.white);

        // Draw menu options
        setDisplayText(1, null, null); // Will be set individually for each option
        menuOptions.forEach(function (option, k) {
            var optionY = menuY + 16 + (k * (fontScale + 1) * 10);
            var optionColor = (k === selectedMenuOption) ? colours.green : colours.grey;
            var prefix = (k === selectedMenuOption) ? "> " : "  ";

            display.setTextColor(optionColor);
            display.setTextAlign('left', 'middle');
            display.drawText(prefix + option, menuX + 10, optionY);
        });
    }
}

/**
 * Draw category view
 */
function drawCategoryView() {
    gc();
    if (dirtyCategories) {
        dirtyCategories = false;
        console.log("Drawing category view");
        if (availableCategories.totalCategories === 0) {
            drawText("No categories available", 1, "C", "G6", colours.red);
            drawText("Check WiFi", 1, "C", "G7", colours.white);
            return;
        }

        if (showMenu) return;

        var categoryName = availableCategories.categories[currentScript].name;
        var totalCategories = availableCategories.totalCategories;
        var totalApps = availableCategories.categories[currentScript].count; // Default from categories.json

        // Try to get actual filtered count from cached category file
        if (categoryName !== "Updates") {
            var categorySlug = availableCategories.categories[currentScript].slug;
            var cacheFileName = CACHE_DIR + "category-" + categorySlug + ".json";
            try {
                var cachedData = storage.read({ fs: fileSystem, path: cacheFileName });
                if (cachedData) {
                    var parsedCache = JSON.parse(cachedData);
                    if (parsedCache.count !== undefined) {
                        totalApps = parsedCache.count; // Use filtered count from cache
                    }
                }
            } catch (e) {
                // Use default count from categories.json if cache read fails
            }
        }

        // Display current category info
        drawText((currentScript + 1) + " of " + totalCategories, 1, "C", "G3", colours.white);

        // Category name with special styling for Updates
        var nameText = categoryName === "Updates" ? "* " + categoryName + " *" : categoryName;
        drawText(nameText, 2, "C", "G5", categoryName === "Updates" ? colours.orange : colours.green);

        // Category description
        var descText = categoryName === "Updates"
            ? totalApps + " Update" + (totalApps === 1 ? "" : "s") + " Available"
            : totalApps + (categoryName === "Themes" ? " Theme" : " App") + (totalApps === 1 ? "" : "s");
        drawText(descText, 1, "C", "G7", colours.white);
    }
    gc();
}

/**
 * Draw script view
 */
function drawScriptView() {
    gc();
    if (dirtyScripts) {
        dirtyScripts = false;
        display.drawFillRect(0, fontHeight2 + 1, displayWidth, displayHeight, colours.black);
        if (availableScripts.apps.length === 0) {
            drawText("No apps in category", 1, "C", "G4", colours.red);
            drawText("Press ESC to go back", 1, "C", "G6", colours.white);
            return;
        }

        if (showMenu) return;

        var script = availableScripts.apps[currentScript];
        var status = getScriptStatus(script);

        // Show category name and position
        if (selectedCategory) {
            drawText(selectedCategory.name + "      " + (currentScript + 1) + " of " + availableScripts.apps.length, 1, "C", "G2", colours.white);
        }


        // Script name (with scrolling support)
        setDisplayText(2, colours.green);
        var nameY = displayHeight / 10 * 4;
        drawScrollingText(script.n, displayWidth / 2, nameY, nameScrollOffset);

        // Script description (with scrolling support)
        setDisplayText(1, colours.white);
        var descY = displayHeight / 10 * 5 + ((fontScale + 1) * 3) + 3;
        drawScrollingText(script.d, displayWidth / 2, descY, descriptionScrollOffset);

        // Status and version info
        drawText(status.text, 1, "C", "G7", status.color);
        drawVersionInfo(script, 8);

    }
    gc();
}

/**
 * Display the App Store interface
 */
var appNameShown = false;
var currentStatusLine1 = "";
var currentStatusLine2 = "";

function displayInterfaceNew(statusLine1, statusLine2, forceUpdate) {
    gc();
    console.log("Display Interface Update: |" + statusLine1 + "|" + statusLine2 + "|");

    if (statusLine1 === undefined) statusLine1 = "";
    if (statusLine2 === undefined) statusLine2 = "";

    if (forceUpdate === undefined) forceUpdate = false;

    if (forceUpdate) {
        display.drawFillRect(0, fontHeight2, displayWidth, displayHeight, colours.black);
    }

    console.log("Display Interface Update: |" + statusLine1 + "|" + statusLine2 + "|");
    if (!showMenu) {
        if (!appNameShown) {
            drawText("Bruce App Store", 2, "C", "G1", BRUCE_PRICOLOR);
            appNameShown = true;
        }
    }

    if (statusLine1 != currentStatusLine1) {
        drawText(statusLine1, 1, "C", "G4", colours.cyan);
        currentStatusLine1 = statusLine1;
    }
    if (statusLine2 != currentStatusLine2) {
        drawText(statusLine2, 1, "C", "G6", colours.white);
        currentStatusLine2 = statusLine2;
    }
    gc();
}

function drawText(text, size, x, y, textColour) {
    var titleHeight = 8 * (2 + fontScale);
    var titlePaddingBottom = 4;
    var totalRows = 9;
    if (x == "C") x = displayWidth / 2;

    if (y.substring(0, 1) === 'G') {
        var lineNum = parseInt(y.substring(1));
        y = lineNum == 1 ? titleHeight :
            ((displayHeight - titleHeight - titlePaddingBottom) / (totalRows - 1) * (lineNum - 1)) + titleHeight + titlePaddingBottom;
    }

    display.drawFillRect(0, y - 8 * (size + fontScale), displayWidth, 8 * (size + fontScale), colours.black);
    setDisplayText(size, textColour, 'center');
    display.setTextAlign('center', 'bottom');
    display.drawText(text, x, y);
}

/**
 * Download and install a script
 */
function installScript(script) {
    isDownloading = true;
    console.log("Starting installation of script: " + script.n);
    displayInterfaceNew(script.n, "Connecting", true);

    try {
        // Check WiFi connection
        if (!checkWiFiConnection()) {
            isDownloading = false;
            return;
        }

        displayInterfaceNew(script.n, "Installing");
        var success = 0;
        var errors = 0;

        // Download full metadata
        var fullMetadata = loadFullMetadata(script);
        var files = fullMetadata.files || [];
        var baseLocalDir = (fullMetadata.category === 'Themes') ? THEMES_DIR : SCRIPTS_DIR;

        // Loop through the files
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var localFilePath = getLocalFilePath(file, baseLocalDir, fullMetadata.category, script.n);
            var repoFilePath = (file && typeof file === 'object' && file.source)
                ? (fullMetadata.path + file.source).replace(/^\/+/, '')
                : (fullMetadata.path + file).replace(/^\/+/, '');

            console.log("Downloading file " + (i + 1) + " of " + files.length + ": " + repoFilePath);

            var url = (BASE_URL +'/service/manual/' + fullMetadata.owner + '/' + fullMetadata.repo + '/' + fullMetadata.commit + '/' + repoFilePath).replace(/ /g, '%20');
            console.log(url);
            console.log(localFilePath);
            var response = wifi.httpFetch(url, {
                save: { fs: fileSystem, path: localFilePath, mode: "write" },
            });
            if (response.status === 200) {
                console.log("Size: " + response.length + " bytes");
                console.log("Saved to: " + localFilePath);
                console.log("Successfully downloaded: " + repoFilePath);
                displayInterfaceNew(script.n, "Downloading " + (i + 1) + " of " + files.length);

                success++;
            } else {
                console.log("Failed to download " + repoFilePath);
                errors++;
                displayInterfaceNew("Error", "Download failed for " + files[i].source);
            }
            gc();
        }

        // Check if all files were downloaded successfully
        if (success === files.length && errors === 0) {
            installedVersions[script.s] = {
                version: fullMetadata.version,
                commit: fullMetadata.commit
            };

            saveInstalledVersions();
            dirtyScripts = true;
            displayInterfaceNew("", "");
            drawScriptView();
            displayPopup("Installed successfully!");
        }

    } catch (e) {
        displayInterfaceNew("Error", "Err (A): " + e.message);
    }
    gc();
    isDownloading = false;
    clearPopupAfterDelay();
}

/**
 * Create an "Updates" category containing apps with available updates
 */
function createUpdatesCategory() {
    try {
        updatesAvailable = { "category": "Updates", "slug": "updates", "count": 0, "apps": [] };

        if (!availableCategories || !availableCategories.categories) return;

        // Go through all cached category files to find apps with updates
        for (var c = 0; c < availableCategories.categories.length; c++) {
            var category = availableCategories.categories[c];
            if (category.slug === "updates") continue; // Skip updates category itself

            var cacheFileName = CACHE_DIR + "category-" + category.slug + ".json";

            try {
                var cachedData = storage.read({ fs: fileSystem, path: cacheFileName });
                if (cachedData) {
                    var categoryData = JSON.parse(cachedData);

                    // Check each app in this category for updates
                    for (var i = 0; i < categoryData.apps.length; i++) {
                        var app = categoryData.apps[i];
                        var installedVersion = getInstalledVersion(app);

                        // Check if app is installed and has an update available
                        if (installedVersion && installedVersion !== app.v) {
                            // Check if this app is already in the updates list (avoid duplicates)
                            var alreadyAdded = false;
                            for (var u = 0; u < updatesAvailable.apps.length; u++) {
                                if (updatesAvailable.apps[u].slug === app.slug) {
                                    alreadyAdded = true;
                                    break;
                                }
                            }

                            if (!alreadyAdded) {
                                updatesAvailable.apps.push(app);
                            }
                        }
                    }
                }
            } catch (e1) {
                // Ignore cache read errors for individual categories
            }
        }

        updatesAvailable.count = updatesAvailable.apps.length;

        // Remove existing Updates category if present
        availableCategories.categories = availableCategories.categories.filter(function (cat) {
            return cat.slug !== "updates";
        });
        availableCategories.totalCategories = availableCategories.categories.length;

        // Add Updates category if there are updates available
        if (updatesAvailable.apps.length > 0) {
            availableCategories.categories.unshift({
                name: "Updates",
                slug: "updates",
                count: updatesAvailable.count
            });
            availableCategories.totalCategories++;
        }
    } catch (e2) {
        displayPopup("Err: " + e2.message);
    }
    gc();
}

/**
 * Select a category and load its scripts
 */
function selectCategory(category) {
    lastCategoryIndex = currentScript;
    selectedCategory = category;
    currentView = "scripts";
    currentScript = 0;
    resetDescriptionScroll();

    loadCategory(category);

    dirtyScripts = true;
}

/**
 * Go back to category selection
 */
function goBackToCategories() {
    display.drawFillRect(0, fontHeight2 + 1, displayWidth, displayHeight, colours.black);
    currentView = "categories";
    currentScript = lastCategoryIndex;
    availableScripts = [];
    selectedCategory = null;
    resetDescriptionScroll();
    dirtyCategories = true;
}

// Helper function to handle navigation (next/prev) with wrapping
function handleNavigation(isNext, maxLength, onUpdate) {
    if (maxLength === 0) return;

    currentScript = isNext
        ? (currentScript + 1) % maxLength
        : (currentScript - 1 + maxLength) % maxLength;

    if (onUpdate) onUpdate();
    if (currentView === "categories") {
        dirtyCategories = true;
    } else {
        dirtyScripts = true;
    }
}

// Main application loop
while (!exitApp) {
    // Handle ESC button
    if (keyboard.getEscPress()) {
        if (showMenu) {
            hideActionMenu();
        } else if (currentView === "scripts") {
            goBackToCategories();
        } else {
            exitApp = true;
            break;
        }
    }

    if (!isDownloading) {
        // Clear popupMessage if any button is pressed
        if (popupMessage != "" && (keyboard.getNextPress() || keyboard.getPrevPress() || keyboard.getSelPress() || keyboard.getEscPress())) {
            popupMessage = "";
            popupMessageClearTime = 0;
            if (currentView === "categories") {
                dirtyCategories = true;
            } else {
                dirtyScripts = true;
            }
        } else if (showMenu) {
            // Handle menu navigation
            if (keyboard.getNextPress()) {
                selectedMenuOption = (selectedMenuOption + 1) % menuOptions.length;
                dirtyActionMenu = true;
            } else if (keyboard.getPrevPress()) {
                selectedMenuOption = (selectedMenuOption - 1 + menuOptions.length) % menuOptions.length;
                dirtyActionMenu = true;
            }

            if (keyboard.getSelPress()) {
                executeMenuAction(availableScripts.apps[currentScript]);
            }
        } else if (currentView === "categories") {
            // Handle category navigation
            if (keyboard.getNextPress()) {
                handleNavigation(true, availableCategories.totalCategories);
            } else if (keyboard.getPrevPress()) {
                handleNavigation(false, availableCategories.totalCategories);
            } else if (keyboard.getSelPress() && availableCategories.totalCategories > 0) {
                selectCategory(availableCategories.categories[currentScript]);
            }
        } else {
            // Handle script navigation
            if (keyboard.getNextPress()) {
                handleNavigation(true, availableScripts.apps.length, resetDescriptionScroll);
            } else if (keyboard.getPrevPress()) {
                handleNavigation(false, availableScripts.apps.length, resetDescriptionScroll);
            } else if (keyboard.getSelPress() && availableScripts.apps.length > 0) {
                showActionMenu(availableScripts.apps[currentScript]);
            }
        }
        drawCategoryView();
        drawScriptView();
        drawActionMenu();
    }

    checkPopupClear();
    updateDescriptionScroll();
    delay(50);
}
