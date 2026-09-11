/*
	Channel graph with complex features (WiP)
	Graph works, shows channel congestion.
	Shows network list with channel and RSSI
	To quit press esc when NOT scanning.
	
	by gib
*/

const keyboard = require('keyboard');
const display = require("display");
const dialog = require('dialog');
const wifi = require('wifi');

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

display.setTextSize(0);

const scanInterval = 2000;
const X = 10;
const Y = 10;
const W = 160;
const H = 140;

var bDoRun = true;
var lastScanTime = 0;

function handleInput(){

	if(keyboard.getEscPress()){

		bDoRun = false;
	}
	if(keyboard.getNextPress()){

	}
	if(keyboard.getPrevPress()){

	}
	if(keyboard.getSelPress()){

	}
}

function debugDisplay(debugData, bWaitForEsc){

	display.fill(BRUCE_BGCOLOR);
	display.setTextColor(BRUCE_PRICOLOR);
	display.setCursor(0, 0);
	display.setTextSize(0);
	display.println(debugData);
	if(!bWaitForEsc) pauseForInput();
}

function pauseForInput(){

	while(true){

		if(keyboard.getAnyPress()){

			break;
		}
	}
}

function showSplash(){

	display.fill(BRUCE_BGCOLOR);
	display.setCursor(0, 0);
	display.setTextSize(4);
	display.println("     Hello.")
	display.setTextSize(2);
	display.println("  Welcome to the\n  ChannelGraph app\n\n\n\n\nby gib");
	display.setTextSize(0);
}

function rssiColor(rssi){

	if(rssi >= -50) return 0x07E0;
	if(rssi >= -60) return 0xAFE5;
	if(rssi >= -70) return 0xFFE0;
	if(rssi >= -80) return 0xFD20;
	return 0xF800;
}

function drawBarGraph(data){

	display.fill(BRUCE_BGCOLOR);
	var max = 0;
	for(var i = 0; i < data.length; i++){

		if (data[i] > max) max = data[i];
	}
	if(max < 1) max = 1;
	var labelEvery = 1;
	if(max > 10) labelEvery = 2;
	if(max > 20) labelEvery = 5;
	if(max > 50) labelEvery = 10;
	for(var value = 0; value <= max; value++){

		var y = Y + H - (value / max) * H;
		display.drawLine(X, Math.round(y), X + W, Math.round(y), (BRUCE_PRICOLOR >> 1) & 0x7BEF);
		if((value % labelEvery === 0 || value === max) && value !== 0){

			display.setCursor(2, Math.round(y) - 3);
			display.print(value);
		}
	}
	var count = data.length;
	var slotWidth = W / count;
	var barWidth = slotWidth * 0.8;
	for(var i = 0; i < count; i++){

		var barHeight = (data[i] / max) * (H);
		var bx = X + i * slotWidth + (slotWidth - barWidth) / 2;
		var by = Y + H - barHeight;
		display.drawFillRect(Math.round(bx), Math.round(by), Math.round(barWidth), Math.round(barHeight), BRUCE_PRICOLOR);
		display.setCursor(bx + 2, Y + H + 5);
		display.print(to_upper_case(to_hex_string(i + 1)));
	}
	display.drawLine(X, Y, X, Y + H, BRUCE_PRICOLOR);
	display.drawLine(X, Y + H, X + W, Y + H, BRUCE_PRICOLOR);
	lastScanTime = now();
}

function displayNetworkList(list, nameLen){

	for(var i = 0; i < list.length; i++){

		var channel = list[i].channel;
		var ssidShort = list[i].SSID.substring(0, nameLen);
		var rssi = list[i].RSSI;
		display.setCursor(176, i * 8);

		var line = to_upper_case(to_hex_string(channel)) + " " + ssidShort;
		display.print(line)
		display.setCursor(302, i * 8);
		display.setTextColor(rssiColor(rssi));
		display.print(rssi);
		display.setTextColor(BRUCE_PRICOLOR);
	}
}

function delayTheScans(){

	var nowTime = now();
	if(nowTime - lastScanTime > scanInterval){

		lastScanTime = nowTime;
		return true;
	}
	return false;
}

function scanAndExtract(){

	display.setCursor(68, 0);
	display.println('SCANNING');
	var scanResult = wifi.scan();
	var channels = [];
	var counts = [];
	var details = [];
	if(scanResult.length !== 0){

		for(var i = 0; i < scanResult.length; i++){

			var channel = scanResult[i].channel;
			channels.push(channel);
			details.push({"channel": channel, "SSID": scanResult[i].SSID, "RSSI": scanResult[i].RSSI});
		}
	}
	else return [];
	for(var i = 0; i < 14; i++){

		counts[i] = 0;
	}
	for(var i = 0; i < channels.length; i++){

		counts[channels[i] - 1]++;
	}
	return [counts, details];
}

function main(){

	showSplash();
	while(bDoRun){

		if(delayTheScans()){

			var compactStuff = scanAndExtract();
			drawBarGraph(compactStuff[0]);
			displayNetworkList(compactStuff[1], 18);
		}
		handleInput();
	}
}
main();
