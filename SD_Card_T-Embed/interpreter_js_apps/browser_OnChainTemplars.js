// Copyright (c) 2026, DEADBLACKCLOVER.

// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.

// This program is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
const dialog = require("dialog");
const keyboard = require("keyboard");
const wifi = require("wifi");

var history = [];
var historyPointer = -1;

var URL = "https://";

const optionsObject = { "Enter web address": "enter", "Go Back": "go_back", "Go Forward": "go_forward", Quit: "quit" };
var resultChoice = optionsObject["Enter web address"];

function main() {
    while (true) {
        if (!wifi.connected()) {
            dialog.error("No Wi-Fi connection", true);
            break;
        }

        if (resultChoice == optionsObject["Enter web address"]) {
            URL = dialog.prompt(URL);
            historyPointer++;
            history[historyPointer] = URL;
        } else if (resultChoice == optionsObject["Go Back"]) {
            if (historyPointer != 0) {
                historyPointer--;
                URL = history[historyPointer];
            }
        } else if (resultChoice == optionsObject["Go Forward"]) {
            if (historyPointer <= history.length) {
                historyPointer++;
                URL = history[historyPointer];
            }
        }

        const response = wifi.httpFetch("https://www.w3.org/services/html2txt?url=" + URL + "&noinlinerefs=on&endrefs=on", { method: "GET" });
        dialog.viewText(response.body);

        resultChoice = dialog.choice(optionsObject);
        if (resultChoice == optionsObject["Quit"]) {
            break;
        }
    }
}

main();
