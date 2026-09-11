/*
	Something has been missing from the tools so I wrote it myself.
	A simple bar graph showing RSSI of a selected SSID. Nothing too fancy.
	You can change the SSID by holding select for a bit due to the code scanning
	for networks pretty often. I don't think there's a better way, using the tools
	at hand that is. If you do then	please feel free to let me know about it!
	To quit hold escape key for a bit (same reason as mentioned above) or press
	escape when presented with SSID choices.

	by gib
*/

const keyboard = require('keyboard');
const display = require("display");
const dialog = require('dialog');
const wifi = require('wifi');

const X = 25;
const Y = 10;
const W = 280;
const H = 140;
const DISPLAY_WIDTH = display.width();
const SCAN_INTERVAL = 50;
const RSSI_MIN = -100;
const RSSI_MAX = -30;

var bDoRun = true;
var currentSSID = "";
var lastScanTime = 0;
var displayBuffer = new RingBuffer(20);

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);
display.setTextSize(0);

function RingBuffer(size){

	this.size = size;
	this.buffer = new Array(size);
	for(var i = 0; i < size; i++){

		this.buffer[i] = 0;
	}
}

RingBuffer.prototype.add = function(value){

	if(this.buffer.length < this.size){

		this.buffer.push(value);
	}
	else{

		this.buffer.shift();
		this.buffer.push(value);
	}
};

RingBuffer.prototype.get = function(){

	return this.buffer;
};

function handleInput(){

	if(keyboard.getEscPress()){

		bDoRun = false;
	}
	if(keyboard.getNextPress()){

	}
	if(keyboard.getPrevPress()){

	}
	if(keyboard.getSelPress()){

		pesterUser("WAIT");
	}
}

function getMiddleForText(fontSize, length){

	return DISPLAY_WIDTH / 2 - length * fontSize * 6 / 2;
}

function rssiColor(rssi){

	if(rssi >= -30) return 0x07E0;
	if(rssi >= -40) return 0xB7E0;
	if(rssi >= -50) return 0xAFEF;
	if(rssi >= -60) return 0xFFE0;
	if(rssi >= -65) return 0xFEE0;
	if(rssi >= -70) return 0xFD20;
	if(rssi >= -75) return 0xFC00;
	if(rssi >= -80) return 0xF800;
	if(rssi >= -85) return 0xC800;
	if(rssi >= -90) return 0x8000;
	if(rssi >= -95) return 0x4208;
	return BRUCE_PRICOLOR;
}

function pesterUser(message){

	displayStatus(message);
	currentSSID = selectSSID();
	displayBuffer = new RingBuffer(20);
}

function selectSSID(){

	var result = wifi.scan();
	if(result.length !== 0){

		var choices = [];
		for(var i = 0; i < result.length; i++){

			choices.push(result[i].SSID);
		}
		var selectedSSID = dialog.choice(choices);
		return selectedSSID;
	}
	else return;
}

function displayStatus(message){

	display.setCursor(getMiddleForText(6, message.length), 0);
	display.setTextColor(BRUCE_PRICOLOR);
	display.setTextSize(1);
	display.println(message);
}

function showSplash(){
	
	display.fill(BRUCE_BGCOLOR);
	display.setCursor(getMiddleForText(5, 24), 0);
	display.setTextSize(4);
	display.println("HELLO\n")
	display.setTextSize(2);
	display.println("Welcome to the\nSSID RSSI tracker app\nSelect the SSID\n\nby gib");
	display.setTextSize(0);
}

function drawBarGraph(data){

	display.fill(BRUCE_BGCOLOR);
	var max = -100;
	var min = 0;
	for(var rssi = RSSI_MIN; rssi <= RSSI_MAX; rssi += 10){

		var y = Y + H - ((rssi - RSSI_MIN) / (RSSI_MAX - RSSI_MIN)) * H;
		if(rssi !== -100){

			display.setCursor(2, Math.round(y) - 3);
			display.setTextSize(1);
			display.setTextColor(BRUCE_PRICOLOR);
			display.print(rssi);
			display.drawLine(X, Math.round(y), X + W, Math.round(y), (BRUCE_PRICOLOR >> 1) & 0x7BEF);
		}
	}
	var count = data.length;
	var slotWidth = W / count;
	var barWidth = slotWidth - 2;
	for(var i = 0; i < count; i++){
		
		if (data[i] === 0) continue;

		var normalized = (data[i] - RSSI_MIN) / (RSSI_MAX - RSSI_MIN);
		if (normalized < 0) normalized = 0;
		if (normalized > 1) normalized = 1;

		normalized = Math.pow(normalized, 1.6);
		var barHeight = normalized * H;
		var bx = X + i * slotWidth + (slotWidth - barWidth) / 2;
		var by = Y + H - barHeight;
		display.drawFillRect(Math.round(bx), Math.round(by), Math.round(barWidth), Math.round(barHeight), rssiColor(data[i]));
	}
	display.drawLine(X, Y, X, Y + H, BRUCE_PRICOLOR);
	display.drawLine(X, Y + H, X + W, Y + H, BRUCE_PRICOLOR);
	display.setTextColor(BRUCE_PRICOLOR);
	display.setTextSize(1);
	display.setCursor(getMiddleForText(6, currentSSID.length + 5), Y + H + 5);
	display.print("SSID: " + currentSSID);
	lastScanTime = now();
}

function scanAndExtract(ssid){

	displayStatus("SCANNING");
	var scanResult = wifi.scan();
	var rssi = 0;
	if(scanResult.length !== 0){

		for(var i = 0; i < scanResult.length; i++){

			if(scanResult[i].SSID === ssid){

				return Number(scanResult[i].RSSI);
			}
		}
		return 0;
	}
	else return 0;
}

function delayTheScans(){

	var nowTime = now();
	if(nowTime - lastScanTime > SCAN_INTERVAL){

		lastScanTime = nowTime;
		return true;
	}
	return false;
}

function main(){

	showSplash();
	currentSSID = selectSSID();
	while(bDoRun){
		
		if(currentSSID === ""){
	
			display.fill(BRUCE_BGCOLOR);
			var quit = dialog.message("QUIT?", {left: "YES", right: "NO"});
			if(quit === "YES") break;
			else pesterUser("SCANNING");
		}
		if(delayTheScans() && currentSSID !== ""){

			displayBuffer.add(scanAndExtract(currentSSID));
			drawBarGraph(displayBuffer.get());
		}
		handleInput();
	}
}
main();
