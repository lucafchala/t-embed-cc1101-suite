/*
	I just got a bright idea... Why not make a simple text editor?!
	I mean... When you just have no other way - better than nothing
	Add a nice rolling number wheel for faster linenumber input
	Basically 0-9 repeated, select saves digit. Oh, also empty
	or otherwise denoted spot for finishing teh num input

	by gib
*/

const display = require("display");
const dialog = require("dialog");
const storage = require("storage");

const displayWidth = display.width();
const displayHeight = display.height();

var b_run = true;
var lines = [];
var location = "";

function cls(){

	display.fill(BRUCE_BGCOLOR);
}

function handleInput(){

	if(keyboard.getEscPress()){

		b_run = false;
	}
}

// Rethink logic driving the location of the line so that it draws background
// below it without any tinkering with numbers or ugly lines when not needed
function debugLine(inLine){

	display.drawFillRect(30, 50, 240, 25, 0);
	display.setCursor(31, 51);
	display.println(inLine);
}

function loadFile(fileLocation){

	try{

		return storage.read(fileLocation);
	}
	catch(ferr){

		cls();
		dialog.error("Error reading: " + ferr);
	}
}

function numberLines(arrayOfLines){

	cls();
	var doLines = dialog.message("Do you want line\nnumbered with that?", {left: "Yes", right: "No"});
	if(doLines === "Yes"){

		for(var line = 0; line < arrayOfLines.length; line++){

			arrayOfLines[line] = (line + 1) + " " + arrayOfLines[line];
		}
	}
	return arrayOfLines
}

function askIfNewFile(){

	cls();
	var newFile = "";
	if(lines.length){

		newFile = dialog.message("Load new file?", {left: "Yes", right: "No"});
	}
	if(newFile === "right"){

		return lines;
	}
	else{

		location = dialog.pickFile();
		var file = loadFile(location);
		file = file.replace(/\r/g, "");
		return file.split("\n");
	}
}

function theLogic(){

	lines = askIfNewFile();
	var dirtyLines = numberLines(lines);
	var stringified = dirtyLines.join("\n");
	cls();
	dialog.viewText(stringified, location);
	cls();
	var lineNumber = dialog.prompt("", -1, "Which line you want edited?");
	cls();
	try{

		lineNumber = Number(lineNumber) - 1;
	}
	catch(lerr){

		dialog.error("Error converting: " + lerr);
	}
	lines[lineNumber] = dialog.prompt(lines[lineNumber]);
	delay(300);
	cls();
	var doSave = dialog.message("Save file?", {left: "Yes", right: "No"});
	cls();
	if(doSave === "Yes"){

		storage.write(location, lines, "write");
		dialog.success("File saved", true);
		cls();
	}
	var doRepeat = dialog.message("One more?", {left: "Yes", right: "No"});
	if(doRepeat === "right") b_run = false;
}

function main(){

	while(b_run){

		handleInput();
		theLogic();
		delay(16);
	}
}
main();
