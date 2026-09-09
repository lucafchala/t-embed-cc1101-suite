/*
	A script allowing fast access to transmit the mmost useful IR and/or RF files
	You can add new fields to it, modify them and such. In menu or by editing .conf

	by gib
*/

const keyboard = require('keyboard');
const storage = require('storage');
const display = require("display");
const dialog = require('dialog');
const subghz = require('subghz');
const serial = require('serial');
const ir = require('ir');

const DISP_WIDTH = display.width();
const DISP_HEIGHT = display.height();

const CONF_FILE = {fs: "sd", path: "/config/TransmitMenu.conf"};
const IR_CACHE = "/config/IRCache/";
storage.mkdir("/config");
storage.mkdir("/config/IRCache");

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

display.setCursor(0, 0);
display.setTextSize(2.5);

const cols = 3;
const buttonW = 100;
const buttonH = 20;
const padding = 3;
const radius = 10;

var IRMenu = [];
var subGHzMenu = [];
var selectedMenu = [];

var selectedMode = "";

var selectedIndex = 0;
var scrollOffset = 0;

var bDoRun = true;
var bUpdatedIndex = false;
var bInMenu = true;
var bIsEditing = false;

function handleInput(){
		
	if(keyboard.getEscPress()){
		
		if(!bInMenu) bDoRun = false;
		else{

			bInMenu = false;
			display.fill(BRUCE_BGCOLOR);
			var quitFully = dialog.message("Fully quit or change menu?", {left: "Menu", right: "Quit"});
			if(quitFully === "right"){

				bDoRun = false;
			}
			else{

				bIsEditing = false;
				selectMenuType();
			}
		}
	}
	if(keyboard.getNextPress()){
		
		if(bInMenu){

			selectedIndex++;
			if(selectedIndex > selectedMenu.length - 1) selectedIndex = 0;
			bUpdatedIndex = true;
		}
	}
	if(keyboard.getPrevPress()){
		if(bInMenu){

			selectedIndex--;
			if(selectedIndex < 0) selectedIndex = selectedMenu.length -1;
			bUpdatedIndex = true;
		}
	}
	if(keyboard.getSelPress()){
		
		if(bInMenu && selectedMenu !== [] && !bIsEditing){

			bUpdatedIndex = true;
			runSelectedCommand();
		}
		else{

			selectEditTool();
		}
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
	display.println("    Hello.")
	display.setTextSize(2);
	display.println("\nThis is a first-time thing\nThis script will now pre-\npare " +
		"your .conf file for\nyou and you won't see this\nsplash again. Hope it'll \n" +
		"be useful. Have fun!");
	pauseForInput();
	display.fill(BRUCE_BGCOLOR);
	display.setCursor(0, 0);
	display.println("\n\nYou'll be asked to provide\nfirst file so you can\n" + 
		"start with something.\nYou can add more items\nusing the edit menu.\n\nby gib");
	pauseForInput();
	display.fill(BRUCE_BGCOLOR);
}

function runSelectedCommand(){

	if(selectedMode === "ir" && selectedMenu.length > 0){

		try{

			// I think that ir.transmitFile() and serial.cmd("ir tx_from_file") are broken.
			// It also seems that "SpamAll" when used from file browser. The same file
			// with only one command doesn't send when "spammed" but sends with no issues
			// when "Choose cmd" is used. So for now I'm going to work around it

			// ir.transmitFile(selectedMenu[selectedIndex]["file"], true);
			// var maybeSerial = selectedMenu[selectedIndex]["file"].replace(/[^\x20-\x7E]/g, "");
			// serial.cmd("ir tx_from_file " + maybeSerial);

			var fileContents = storage.read(selectedMenu[selectedIndex]["file"]);
			var lastBlock = fileContents.split("#");
			var tempProtocol = "";
			var tempAddress = "";
			var tempCommand = "";
			lastBlock = lastBlock[lastBlock.length - 1];
			lastBlock = lastBlock.split("\n");
			for(var i = 0; i < lastBlock.length; i++){
				
				if(lastBlock[i].indexOf("protocol") === 0){

					tempProtocol = lastBlock[i].split(": ");
					tempProtocol = tempProtocol[1];
				}
				else if(lastBlock[i].indexOf("address") === 0){

					tempAddress = lastBlock[i].split(": ");
					tempAddress = tempAddress[1];
					tempAddress = tempAddress.replace(/ /g, "");
				}
				else if(lastBlock[i].indexOf("command") === 0){

					tempCommand = lastBlock[i].split(": ");
					tempCommand = tempCommand[1];
					tempCommand = tempCommand.replace(/ /g, "");
				}
			}
			serial.cmd("ir tx " + tempProtocol + " " + tempAddress + " " + tempCommand);
			dialog.info("Done!");
		}
		catch(erir){

			dialog.error("IR transmit error: " + erir);
		}
	}
	else if(selectedMenu.length > 0){
		
		try{
	
			dialog.info("Transmitting...");
			subghz.transmitFile(selectedMenu[selectedIndex]["file"]);
			dialog.info("Done!");
		}
		catch(ersg){
	
			dialog.error("SubGHz transmit error: " + ersg);
		}
	}
	display.fill(BRUCE_BGCOLOR);
}

function handleEditing(){

	display.fill(BRUCE_BGCOLOR);
	var whichMode = dialog.message("Let's narrow it down\nwhat type?", {left: "ir", right:"SubGHz"});
	if(whichMode === "ir"){

		selectedMenu = IRMenu;
		selectedMode = "ir";
	}
	else{
		
		selectedMenu = subGHzMenu;
		selectedMode = "sub";
	}
	bIsEditing = true;
	drawGrid(selectedMenu);
	
}

function selectMenuType(){
	
	display.fill(BRUCE_BGCOLOR);
	var chosenMenu = dialog.message("Choose menu:", {left: "ir", center: "Edit", right: "SubGHz"});
	if(chosenMenu === "ir"){
		
		selectedMenu = IRMenu;
		selectedMode = "ir";
		if(!bIsEditing) selectedIndex = 0;
	}
	else if(chosenMenu === "Edit"){
		
		handleEditing();
		if(!bIsEditing) selectedIndex = 0;
	}
	else{
		
		selectedMode = "sub";
		selectedMenu = subGHzMenu;
		if(!bIsEditing) selectedIndex = 0;
	}
	bUpdatedIndex = true;
	display.fill(BRUCE_BGCOLOR);
}

function loadConfig(){

	try{
		
		return storage.read(CONF_FILE);
	}
	catch(e1){

		return 0
	}
}

function parseConfig(){

	if(!loadConfig()){
		
		showSplash();
		firstConfig();
	}
	else{

		var loopArr = [];
		var tempConf = loadFile(CONF_FILE);
		for(var i = 0; i < tempConf.length; i++){
			loopArr = JSON.parse(tempConf[i], null, 2);
			if(loopArr["mode"] === "ir"){

				IRMenu.push({file: loopArr["file"], name: loopArr["name"], mode: loopArr["mode"]});
			}
			else{

				subGHzMenu.push({file: loopArr["file"], name: loopArr["name"], mode: loopArr["mode"]});
			}
		}
		return true;
	}
}

function selectEditTool(){

	var selectionSet = {};
	if(selectedMenu.length > 0){

		selectionSet = {"Add new one": "add_new", "Modify selected": "modify", "Reposition": "reposition", "Delete it": "delete"}
	}
	else{

		selectionSet = {"Add new one": "add_new"};
	}
	var selectedTool = dialog.choice(selectionSet);
	if(selectedTool === "add_new"){

		addNewItem();
	}
	else if(selectedTool === "modify"){

		modifyItem();
	}
	else if(selectedTool === "reposition"){
	 
		repositionItem();
	}
	else if(selectedTool === "delete"){

		removeProperOne(selectedMode);
		saveFullConfig();
	}
	else{


	}
	bUpdatedIndex = true;
	bIsEditing = false;
	display.fill(BRUCE_BGCOLOR);
}

function modifyItem(){

	var tmpFile = dialog.pickFile();
	var tmpExt = tmpFile.split(".")[1];
	var tmpCommand = "";
	if(tmpExt === "ir"){

		var tmpTmp = parseIRFile(tmpFile);
		tmpFile = tmpTmp[0];
		tmpCommand = tmpTmp[1];
	}
	else if(tmpExt === "sub"){

		tmpCommand = selectedMenu[selectedIndex]["name"];
	}
	else{
		
		dialog.error("Wrong file: " + tmpFile);
		return;
	}
	var tmpName = dialog.prompt(tmpCommand, 14, "Input user-friendly name for the file");
	selectedMode.splice(selectedIndex, 1);
	putInProperPlace(tmpFile, tmpName, tmpExt);
	saveFullConfig();
}

function addNewItem(){

	var addFile = dialog.pickFile();
	var addExt = addFile.split(".")[1];
	var addCommand = "";
	if(addExt === "ir"){

		var addReturn = parseIRFile(addFile);
		addFile = addReturn[0];
		addCommand = addReturn[1];
	}
	else if(addExt === "sub"){

		addCommand = selectedMenu[selectedIndex]["name"];
	}
	else{

		dialog.error("Wrong file: " + addFile);
		return;
	}
	var addName = dialog.prompt(addCommand, 14, "Input user-friendly name for the file");
	putInProperPlace(addFile, addName, addExt);
	addItemToConfig(addFile, addName, addExt);
}

function repositionItem(){

	var itemToMove = selectedMenu.splice(selectedIndex, 1)[0];
	var chosenIndex = keyboard.numKeyboard("", 8, "Enter position");
	if(Number(chosenIndex) > selectedMenu.length) chosenIndex = selectedMenu.length;
	reorderProperArray(chosenIndex, itemToMove);
	saveFullConfig();
}

function reorderProperArray(index, item){

	if(item["mode"] === "ir"){

		IRMenu.splice(index, 0, item);
	}
	else{
		
		subGHzMenu.splice(index, 0, item);
	}
}

function removeProperOne(removeMode){

	if(removeMode === "ir"){
	
		IRMenu.splice(selectedIndex, 1);
	}
	else{

		subGHzMenu.splice(selectedIndex, 1);
	}
}

function putInProperPlace(placeFile, placeName, placeMode){

	if(placeMode === "ir"){

		IRMenu.push({file: placeFile, name: placeName, mode: placeMode});
	}
	else{

		subGHzMenu.push({file: placeFile, name: placeName, mode: placeMode});
	}
}

function firstConfig(){

	var firstFile = dialog.pickFile();
	var firstExt = firstFile.split(".")[1];
	var firstCommand = "";
	if(firstExt === "ir"){

		var firstTemp = parseIRFile(firstFile)
		firstFile = firstTemp[0];
		firstCommand = firstTemp[1];
	}
	else if(firstExt === "sub"){

	}
	else{

		dialog.error("Wrong file: " + firstFile);
		return;
	}
	var firstName = dialog.prompt(firstCommand, 14, "Input user-friendly name for the file");
	putInProperPlace(firstFile, firstName, firstExt);
	addItemToConfig(firstFile, firstName, firstExt);
}

function saveFullConfig(){

	var saveArr = [];
	var saveStr = "";
	for(var i = 0; i < IRMenu.length; i++){

		if(saveArr[i] !== {}){

			saveArr.push(JSON.stringify(IRMenu[i], null, 2));
		}
	}
	for(var i = 0; i < subGHzMenu.length; i++){
		if(saveArr[i] !== {}){
			
			saveArr.push(JSON.stringify(subGHzMenu[i], null, 2));
		}
	}
	saveStr = saveArr.join("\n");
	storage.write(CONF_FILE, saveStr, "write");
}

function addItemToConfig(fileName, friendlyName, whatMode){

	var tempObj = {file: fileName, name: friendlyName, mode: whatMode};
	var tempStr = JSON.stringify(tempObj, null, 2);
	storage.write(CONF_FILE, "\n" + tempStr, "append");
}

function loadFile(name){

	var raw = storage.read(name);
	raw = raw.replace(/\r/g, "");
	var lined = raw.split("\n");
	lined = lined.filter(function(line){

		return line !== "";
	});
	return lined;
}

function drawGrid(items){

	display.setTextSize(0);

	var selectedRow = Math.floor(selectedIndex / cols);
	var rowHeight = buttonH + padding * 2;
	var visibleRows = Math.floor(DISP_HEIGHT / rowHeight);
	if(selectedRow * rowHeight - scrollOffset < 0){

		scrollOffset = selectedRow * rowHeight;
		display.fill(BRUCE_BGCOLOR);
	}
	if((selectedRow + 1) * rowHeight - scrollOffset > visibleRows * rowHeight){
		
		scrollOffset = (selectedRow + 1) * rowHeight - visibleRows * rowHeight;
		display.fill(BRUCE_BGCOLOR);
	}
	if(scrollOffset < 0){
		
		scrollOffset = 0;
		display.fill(BRUCE_BGCOLOR);
	}
	for(var i = 0; i < items.length; i++){

		var col = i % cols;
		var row = Math.floor(i / cols);
		var x = col * (buttonW + padding * 2) + 1;
		var y = row * (buttonH + padding * 2);
		var textOffset = Math.abs(items[i]["name"].length - 14);
		y -= scrollOffset;
		if(y < -buttonH || y > 170){

			continue;
		}
		if(i === selectedIndex){

			display.drawFillRoundRect(x - 1 + padding, y - 2 + padding, buttonW + 2, buttonH + 2, radius, BRUCE_SECCOLOR);
			display.drawRoundRect(x - 1 + padding, y - 2 + padding, buttonW + 2, buttonH + 2, radius, BRUCE_PRICOLOR);
			display.setTextColor(~BRUCE_PRICOLOR);
		}
		else{

			display.drawFillRoundRect(x - 1 + padding, y  - 2 + padding, buttonW + 2, buttonH + 2, radius, BRUCE_BGCOLOR);
			display.drawFillRoundRect(x + padding, y + padding, buttonW, buttonH, radius, BRUCE_SECCOLOR);
			display.setTextColor(BRUCE_PRICOLOR);
		}
		display.drawText(items[i]["name"], x + (textOffset * 6 / 2) + 10, y + buttonH / 2 - 1);
	}
	bUpdatedIndex = false;
	bInMenu = true;
}

function main(){

	display.setTextSize(0);
	parseConfig();
	selectMenuType();
	while(bDoRun){

		handleInput();
		if(bUpdatedIndex){

			drawGrid(selectedMenu);
		}
	}
}

function parseIRFile(originalFile){

	var result = [];
	var header = [];
	var names = [];
	var IRContents = storage.read(originalFile);
	IRContents = IRContents.replace(/\r/g, "");
	var IRBlocks = IRContents.split("#");
	for(var i = 0; i < IRBlocks.length; i++){

		var block = IRBlocks[i].trim();
		if(block !== "" && block.indexOf("name") === 0){

			result.push(block);
			block = block.split("\n");
			var extractedName = block[0].split(": ");
			names.push(extractedName[1]);
		}
		else{
			
			header.push(block);
		}
	}
	var selectedIRCommand = dialog.choice(names);
	header = header.join("\r\n#");
	var readyForSave = header + "\r\n#\r\n";
	for(var i = 0; i < result.length; i++){

		if(result[i].indexOf("name: " + selectedIRCommand) === 0){

			readyForSave += result[i];
			break;
		}
	}
	var IRFileName = originalFile.split("/").pop();
	var newFilePath = IR_CACHE + selectedIRCommand + "_" + IRFileName;
	storage.write({fs: "sd", path: newFilePath}, readyForSave, "write");
	return [newFilePath, selectedIRCommand];
}
main();
