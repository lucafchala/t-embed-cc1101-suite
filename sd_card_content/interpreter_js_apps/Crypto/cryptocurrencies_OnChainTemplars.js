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
const keyboard = require("keyboard");
const wifi = require("wifi");

var cryptocurrenciesList = [
    { id: "bitcoin", name: "Bitcoin (BTC)", price: 0 },
    { id: "ethereum", name: "Ethereum (ETH)", price: 0 },
    { id: "monero", name: "Monero (XMR)", price: 0 },
    { id: "polkadot", name: "Polkadot (DOT)", price: 0 },
    { id: "cosmos", name: "Cosmos Hub (ATOM)", price: 0 },
    { id: "cardano", name: "Cardano (ADA)", price: 0 },
    { id: "aptos", name: "Aptos (APT)", price: 0 },
    { id: "tron", name: "Tron (TRX)", price: 0 }
];
var lengthCryptoList = cryptocurrenciesList.length;

var ids = "";
for (var i = 0; i < lengthCryptoList; i++) {
    ids = ids + cryptocurrenciesList[i].id;
    if (i != lengthCryptoList) {
        ids = ids + ",";
    }
}
var URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + ids + "&vs_currencies=usd";

var currentIndex = 0;
var lastUpdate = 0;
var intervalUpdate = 30000;

function fetchPrices() {
    var response = wifi.httpFetch(URL, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (response.status == 200) {
        var data = JSON.parse(response.body);

        for (var i = 0; i < lengthCryptoList; i++) {
            var id = cryptocurrenciesList[i].id;
            if (data[id] && data[id].usd !== undefined) {
                cryptocurrenciesList[i].price = data[id].usd;
            } else {
                dialog.error("The price was not found { id=" + id + " }", true);
            }
        }
    } else {
        dialog.error("API Error: " + response.code, true);
    }
}

function updateDisplay() {
    display.fill(display.color(0, 0, 0));

    var centerX = display.width() / 2;
    var centerY1 = display.height() / 2 - 20;
    var centerY2 = display.height() / 2 + 20;

    var currentName = cryptocurrenciesList[currentIndex].name;
    var currentPrice = cryptocurrenciesList[currentIndex].price;

    if (currentPrice !== null) {
        // Draw name
        display.setTextColor(display.color(255, 255, 255));
        display.setTextSize(2);
        display.setTextAlign("center", "middle");
        display.drawText(currentName, centerX, centerY1);

        // Draw price
        var priceText = "$" + currentPrice.toString();
        display.setTextColor(display.color(0, 255, 0));
        display.setTextSize(3);
        display.drawText(priceText, centerX, centerY2);
    } else {
        display.setTextColor(display.color(255, 255, 255));
        display.setTextSize(1);
        display.setTextAlign("center", "middle");
        display.drawText("Loading prices...", centerX, centerY1);
    }
}

function main() {
    if (!wifi.connected()) {
        dialog.error("No Wi-Fi connection", true);
        return;
    }

    lastUpdate = now();
    fetchPrices();
    updateDisplay();

    while (true) {
        if (now() - lastUpdate >= intervalUpdate) {
            lastUpdate = now();
            fetchPrices();
        }

        if (keyboard.getNextPress()) {
            currentIndex = (currentIndex + 1) % lengthCryptoList;
            updateDisplay();
        }

        if (keyboard.getPrevPress()) {
            currentIndex = (currentIndex - 1 + lengthCryptoList) % lengthCryptoList;
            updateDisplay();
        }

        if (keyboard.getSelPress() || keyboard.getEscPress()) {
            break;
        }

        delay(100);
    }
}

main();
