/*
	A set of useful starting functions
	
	by gib
*/

const keyboard = require('keyboard');
const storage = require('storage');
const display = require("display");
const dialog = require('dialog');

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

display.setCursor(0, 0);
display.setTextSize(2);

var bDoRun = true;

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
	display.println("   Hello.")
	display.setTextSize(2);
	display.println("This is just a boilerplate");
}

function loadFile(name){

	var raw = storage.read(name);
	raw = raw.replace(/\r/g, "");
	var lined = raw.split("\n");
	return lined;
}

function displayStuff(what){
	
	display.fill(BRUCE_BGCOLOR);
	dialog.drawStatusBar();
	display.setTextSize(2.5);
	display.setCursor(0, 30);
	display.println(what);
}

function main(){

	showSplash();
	while(bDoRun){

		handleInput();
	}
}
main();
