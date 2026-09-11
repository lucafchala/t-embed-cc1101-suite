/*
	A minimalistic player for Bruce firmware devices (equipped with a speaker)
	that uses melodies written using RTTTS format.
	Proper preparation of the melodies file took longer than writing of the code

	by gib
*/

const keyboard = require('keyboard');
const storage = require('storage');
const display = require("display");
const dialog = require('dialog');

const melodyFile = {fs: "sd", path:"/melodies.rttts"};

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

function loadFile(name){

	var raw = storage.read(name);
	raw = raw.replace(/\r/g, "");
	var lined = raw.split("\n");
	return lined;
}

function getIndex(ofWhat){

	var chosen = dialog.choice(ofWhat);
	for(var i = 0; i < ofWhat.length; i++){

		if(ofWhat[i].indexOf(chosen) === 0){

			return i;
		}
	}
}

function extractNames(fromWhat){

	var tmpList = [];
	for(var i = 0; i < fromWhat.length; i++){

		tmpList.push(fromWhat[i].split(":")[0]);
	}
	return tmpList;
}

function playSong(tune){

	serial.cmd("music_player " + tune);
}

function displayStuff(what){

	display.fill(BRUCE_BGCOLOR);
	dialog.drawStatusBar();
	display.setTextSize(2.5);
	display.setCursor(0, 50);
	display.println("Playing:\n" + what);
}

function main(){

	var bDoRun = true;
	var melody = loadFile(melodyFile);
	var names = extractNames(melody);
	while(bDoRun){

		if(keyboard.getEscPress()){

			bDoRun = false;
		}
		var index = getIndex(names);
		displayStuff(names[index]);
		playSong(melody[index]);
	}
}
main();
