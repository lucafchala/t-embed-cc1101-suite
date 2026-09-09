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

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

display.setCursor(0, 0);
display.setTextSize(2.5);

function debugDisplay(debugData, bWaitForEsc){

	display.fill(BRUCE_BGCOLOR);
	display.setTextColor(BRUCE_PRICOLOR);
	display.setCursor(0, 0);
	display.setTextSize(0);
	display.println(debugData);
	if(!bWaitForEsc){

		while(true){
 
			if(keyboard.getAnyPress()){

				break;
			}
		}
	}
}

function showSplash(){
	
	display.fill(BRUCE_BGCOLOR);
	display.setCursor(0, 0);
	display.setTextSize(4);
	display.println("   Hello.")
	display.setTextSize(2);
	display.println("App will attempt to load\nfiles from /rttts. If not\n" +
					"found you still can load a\nmultiline file or select\n" +
					"some other folder, you'll\nget a choice.\n");
}

function checkFolder(){

	try{

		return storage.readdir({fs: "sd", path: '/rttts'});
	}
	catch(e1){

		return false;
	}
}

function modeChoice(folderFound){

	display.println("Press any key to continue");
	pauseForInput();
	display.fill(BRUCE_BGCOLOR);
	display.setTextSize(2.5);
	try{
		if(!folderFound){

			var noFolder = dialog.message("No /rttts found\n\nChoose your mode:", {left: "file", right: "dir",});
			return noFolder;
		}
		var withFolder = dialog.message("Choose your mode:", {left: "file", center: "/rttts", right: "dir",});
		return withFolder;
	}
	catch(e2){

		debugDisplay("e2: " + e2);
	}
}

function playSingleFile(previousLoad){

	if(previousLoad === undefined){

		var fileLocation = dialog.pickFile();
		previousLoad = loadFile(fileLocation);
	}
	var fileNames = fetchFileNames(previousLoad);
	if(fileNames.length === 1) playMelody(fileNames[0]);
	else{

		var fileIndex = getBigFileIndex(fileNames);
		// var singleMelody = loadFile({fs: "sd", path: fileLocation[0] + fileNames[fileIndex]});
		displayStuff(fileNames[fileIndex]);
		playMelody(previousLoad[fileIndex]);
		return previousLoad;
	}
}

function playFromRTTTS(RTTTSData){

	var chosenMelody = dialog.choice(RTTTSData);
	var loadedMelody = loadFile({fs: "sd", path: "/rttts/" + chosenMelody});
	displayStuff(chosenMelody);
	playMelody(loadedMelody[0]);
}

function playFromCustomDir(){

	var customDir = getCustomDir();
	var loadedDir = storage.readdir({fs: "sd", path: customDir}); 
	var chosenMelody = dialog.choice(loadedDir);
	var loadedMelody = loadFile({fs: "sd", path: customDir + "/" + chosenMelody});
	displayStuff(chosenMelody);
	playMelody(loadedMelody[0]);
}

function getCustomDir(){

	try{
		var selectedDir = dialog.pickFile();
		var slicedDir = selectedDir.split("/");
		slicedDir = slicedDir.slice(0, -1);
		return slicedDir.join("/");
	}
	catch(e4){

		debugDisplay("e4 "+ e4);
	}
}

function loadFile(name){

	var raw = storage.read(name);
	raw = raw.replace(/\r/g, "");
	var lined = raw.split("\n");
	return lined;
}

function getBigFileIndex(ofWhat){
	
	var chosen = dialog.choice(ofWhat);
	for(var i = 0; i < ofWhat.length; i++){

		if(ofWhat[i].indexOf(chosen) === 0){
			
			return i;
		}
	}
}

function fetchFileNames(fromWhat){

	var tmpNames = [];
	for(var i = 0; i < fromWhat.length; i++){

		tmpNames.push(fromWhat[i].split(":")[0]);
	}
	return tmpNames;
}

function playMelody(tune){

	serial.cmd("music_player " + tune);
	displayAfterPlay();
}

function displayAfterPlay(){

	display.fill(BRUCE_BGCOLOR);
	display.setCursor(90, 50);
	display.setTextSize(4);
	display.println("DONE!");
	display.setTextSize(2.5);
	display.println("\n    Press select/escape")
}

function displayStuff(what){
	
	display.fill(BRUCE_BGCOLOR);
	dialog.drawStatusBar();
	display.setTextSize(2.5);
	display.setCursor(0, 30);
	display.println("Playing:\n" + what + "\n\nEnjoy your melody!");
}

function main(){

	showSplash();
	var bGoAgain = true;
	var areYouThere = checkFolder();
	var whatMode = modeChoice(areYouThere);
	var prevFile = undefined;
	while(true){

		if(whatMode === "file" && bGoAgain){

			if(prevFile === undefined) prevFile = playSingleFile();
			else{playSingleFile(prevFile);}
			bGoAgain = false;
		}
		else if(whatMode === "/rttts" && bGoAgain){

			playFromRTTTS(areYouThere);
			bGoAgain = false;
		}
		else if(whatMode === "right" && bGoAgain){

			playFromCustomDir();
			bGoAgain = false;
		}

		if(keyboard.getEscPress()){

			break;
		}
		if(keyboard.getSelPress()){

			bGoAgain = true;
		}
	}
}
main();
