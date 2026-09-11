/*
	This app allows you to connect to your Lumix camera and dontrol it remotely (still and start/stop recording)
	It displays some basic information and has all the connectivity tidbits baked in to allow for hassleless
	operation, no matter your setting. It creates a conf file for ease of repeated uses.

	It even allows you to download the full-resolution files directly to your device!

	MAC address might be completely useless, might probe useful later. Still need to figure out rest of the APIs
	One thing for sure - the wifi pass is just lower-case MAC with 'a' as a prefix. That's it. So might be useful
	Anywho most of the tinkering is done, time to sniff more for the desktop app

	by gib
*/

const display = require('display');
const keyboard = require('keyboard');
const wifi = require('wifi');
const dialog = require('dialog');
const storage = require('storage');

const settingsLocation = {fs: "sd", path: "/config/LumixControl.conf"};
const recModeCommands = ["Capture photo", "Start recording", "Playback"];
const playModeCommands = ["Download file", "Go back"];
const displayWidth = display.width();
const displayHeight = display.height();

var cameraIP = "";
var cameraMAC = "";
var directSSID = "";
var directPass = "";
var networkSSID = "";
var networkPass = "";

var bDoRun = true;
var bAddFlare = false;
var bCmdChanged = true;
var bIsRecording = false;
var bSelectedPlay = false;
var lastMode = "rec";
var lastRec = "";
var lastTemp = "";
var lastBatt = "";
var shotsLeft = "";
var selectedRec = 0;
var lastPollTime = 0;
var pollInterval = 2000;
var totalImages = 0;
var currentImage = 0;
var imgArrayIndex = 0;
var currentFullPath = "";

var savedIPs = [];
var savedMACs = [];
var savedSSIDs = [];
var savedPasses = [];
var fileNamesDict = {};
var thumbnailArray = [];
var filesReadFromDir = [];

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);
storage.mkdir("/config/");
storage.mkdir("/downloads/cache/");

function generateBody(startingIndex, amount){

	return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n" +
			"<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\">\r\n" +
			"  <s:Body>\r\n" +
			"    <u:Browse xmlns:u=\"urn:schemas-upnp-org:service:ContentDirectory:1\" xmlns:pana=\"urn:schemas-panasonic-com:pana\">\r\n" +
			"      <ObjectID>0</ObjectID>\r\n" +
			"      <BrowseFlag>BrowseDirectChildren</BrowseFlag>\r\n" +
			"      <Filter>*</Filter>\r\n" +
			"      <StartingIndex>" + startingIndex + "</StartingIndex>\r\n" +
			"      <RequestedCount>" + amount + "</RequestedCount>\r\n" +
			"      <SortCriteria></SortCriteria>\r\n" +
			"      <pana:X_FromCP>LumixLink2.0</pana:X_FromCP>\r\n" +
			"    </u:Browse>\r\n" +
			"  </s:Body>\r\n" +
			"</s:Envelope>";
}

function getImageNames(amount){

	bAddFlare = random(0, 100) > 88 ? true : false;
	var response = wifi.httpFetch("http://" + cameraIP + "/cam.cgi?mode=get_content_info");
	if(lastMode === "rec"){

		fetchCommand("/cam.cgi?mode=camcmd&value=playmode");
	}
	try{

		totalImages = Number(parseValue(response.body, "total_content_number"));
		var filesInDirectory = storage.readdir("/downloads/cache/", {withFileTypes: true});
		for(var i = 0; i < filesInDirectory.length; i++){

			filesReadFromDir.push(filesInDirectory[i].name);
		}
		filesReadFromDir = removeDupes(filesReadFromDir);
	}
	catch(ergin){

		dialog.error("getImageNames: " + ergin, true);
	}
	try{

		var negativePrevention = 0;
		if(totalImages - amount < 0){

			negativePrevention = 0;
			amount = totalImages;
		}
		else{

			negativePrevention = totalImages - amount;
		}
		var POSTBody = generateBody(negativePrevention, amount);
		var response = wifi.httpFetch("http://" + cameraIP + ":60606/Server0/CDS_control", {

			method: "POST",
			body: POSTBody,
			headers: { "Host": cameraIP + ":60606",
						"Content-Type": "text/xml; charset=\"utf-8\"",
						"User-Agent": "Panasonic Android/1 DM-CP",
						"SOAPACTION": "\"urn:schemas-upnp-org:service:ContentDirectory:1#Browse\"",
						"Content-Length": to_string(POSTBody.length)
						}});
		var imageNames = parseImageNames(response.body);
		populateObject(imageNames);
		imgArrayIndex = thumbnailArray.length - 1;
		return imageNames;
	}
	catch(erpb){

		dialog.error("POST error: " + erpb, false);
	}
}

function fetchFullFile(name){

	display.fill(BRUCE_BGCOLOR);
	delay(10);
	var doWeDownload = dialog.message("Do you want to download\n" + name + "?", {left: "No", right: "Yes"});
	if(doWeDownload === "right"){

		fetchBinaryFile(name, "", true);
		display.fill(BRUCE_BGCOLOR);
	}
	displayImage(imgArrayIndex);
}

function downloadFile(url, destination, displayDialog){

	if(destination === undefined) destination = "/downloads/" + url.split('/').pop();
	if(displayDialog === undefined) displayDialog = false;
	var headResp = wifi.httpFetch(url, {method: "HEAD"});
	var isOk = to_string(headResp.status);
	if(isOk.indexOf("2") === 0){

		try{

			storage.remove({fs: "sd", path: destination});
		}
		catch(erdf){

		}
		var size = Number(headResp.headers["X-FILE_SIZE"]);
		var chunkSize = 64 * 1024;
		var offset = 0;
		if(displayDialog) dialog.info(size + " bytes");
		while(offset < size){

			var end = Math.min(offset + chunkSize - 1, size - 1);
			var chunkResp = wifi.httpFetch(url, {"headers": {"Connection": "Keep-Alive", "Range": "bytes=" + offset + "-" + end}});
			storage.write({fs: "sd", path: destination}, chunkResp.body, "append");
			offset += chunkSize;
			autoPoll();
			if(displayDialog){

				var percent = Math.floor(offset / size * 100);
				percent = percent < 100 ? percent : 100;
				dialog.info("Downloading: " + percent + "%");
			}
		}
		return true;
	}
	else return false;
}


function fetchBinaryFile(name, destination, override){

	if(override === undefined) override = false;
	try{

		if(!override){
			var bDidWeFindIt = false;
			for(var i = 0; i < filesReadFromDir.length; i++){

				if(filesReadFromDir[i] === name){

					bDidWeFindIt = true;
					break;
				}
			}
		}
		if(!bDidWeFindIt || override){

			downloadFile("http://" + cameraIP + ":50001/" + name, "/downloads/" + destination + name, override);
			filesReadFromDir.push(name);
		}
	}
	catch(erfbf){
		
		dialog.error("Error fetching img: " + erfbf, true);
	}
}

function fetchCommand(command){

	if(!cameraIP || !command) return null;
	try{

		return wifi.httpFetch("http://" + cameraIP + command);
	}
	catch(erfc){

	}
}

function handleInput(){

	if(keyboard.getEscPress()){

		if(lastMode === "play"){

			bSelectedPlay = !bSelectedPlay;
			bCmdChanged = true;
			drawGUI();
		}
		else{

			bDoRun = false;
		}
	}
	if(keyboard.getNextPress()){

		if(lastMode === "rec"){

			selectedRec++;
			if(selectedRec >= recModeCommands.length) selectedRec = 0;
			bCmdChanged = true;
		}
		else{

			imgArrayIndex++;
			if(imgArrayIndex >= thumbnailArray.length) imgArrayIndex = 0;
			displayImage(imgArrayIndex);
			bSelectedPlay = false;
		}
	}
	if(keyboard.getPrevPress()){
		
		if(lastMode === "rec"){

			selectedRec--;
			if(selectedRec < 0) selectedRec = recModeCommands.length - 1;
			bCmdChanged = true;
		}
		else{

			imgArrayIndex--;
			if(imgArrayIndex < 0) imgArrayIndex = thumbnailArray.length - 1;
			displayImage(imgArrayIndex);
			bSelectedPlay = false;
		}
	}
	if(keyboard.getSelPress()){

		if(lastMode === "rec"){

			recCommands(selectedRec);
		}
		else if(bSelectedPlay){

			playCommands(Number(bSelectedPlay));
		}
		else{

			var tmpChoice = dialog.choice(fileNamesDict[thumbnailArray[imgArrayIndex]], true);
			fetchFullFile(tmpChoice);
		}
	}
}

function playCommands(index){

	switch(index){

		case 0:
			imgArrayIndex = thumbnailArray.length - 1;
			displayImage(imgArrayIndex);
			break;
		case 1:

			selectedRec = 0;
			fetchCommand("/cam.cgi?mode=camcmd&value=recmode");
			break;
		
		default:

			dialog.error("Something went wrong " + index);
			break;
	}
}

function recCommands(index){

	switch(index){

		case 0:

			var bDidSnap = fetchCommand("/cam.cgi?mode=camcmd&value=capture");
			if(bDidSnap.ok){
				
				var bButDidItReally = parseValue(bDidSnap.body, "result");
				display.setCursor(110, 150);
				if(bButDidItReally) display.println("  DONE  ");
			}
			break;
		case 1:

			var startStop = bIsRecording ? "video_recstop" : "video_recstart";
			fetchCommand("/cam.cgi?mode=camcmd&value=" + startStop);
			bIsRecording = !bIsRecording;
			drawGUI();
			break;
		case 2:

			bSelectedPlay = false;
			fetchCommand("/cam.cgi?mode=camcmd&value=playmode");
			lastMode = "play";
			getImageNames(50);
			displayImage(imgArrayIndex);
			break;
		default:

			dialog.error("Something went wrong " + index, true);
			break;
	}
}

function populateObject(data){

	var dtMap = {};
	for(var i = 0; i < data.length; i++){

		var tmpFile = data[i];
		var prefix = tmpFile.substr(0, 2);
		var dot = tmpFile.indexOf(".");
		if(dot === -1) continue;
		var tmpID = tmpFile.substring(2, dot);

		if (prefix === "DT") {

			thumbnailArray.push(tmpFile);
			if(!fileNamesDict[tmpFile]){

				fileNamesDict[tmpFile] = [];
			}
			dtMap[tmpID] = tmpFile;
		}
	}
	for(var i = 0; i < data.length; i++){

		var tmpFile2 = data[j];
		var prefix2 = tmpFile2.substr(0, 2);
		var dot2 = tmpFile2.indexOf(".");
		if(dot2 === -1) continue;
		if(prefix2 === "DT") continue;

		var tmpID2 = tmpFile2.substring(2, dot2);
		var dtFile = dtMap[tmpID2];
		if(dtFile){

			if(!fileNamesDict[dtFile]){
				fileNamesDict[dtFile] = [];
			}
			fileNamesDict[dtFile].push(tmpFile2);
			var noDUpes = removeDupes(fileNamesDict[dtFile]);
			fileNamesDict[dtFile] = noDUpes.concat();
		}
	}
	var tempArray = removeDupes(thumbnailArray);
	thumbnailArray = tempArray.concat();
}

function displayImage(index){

	try{

		display.fill(BRUCE_BGCOLOR);
		currentImage = thumbnailArray[index];
		fetchBinaryFile(currentImage, "cache/", false);
		currentFullPath = {fs: "sd", path: "/downloads/cache/" + currentImage};
		dialog.drawStatusBar();
		display.drawJpg(currentFullPath, 80, 30);
		display.setCursor(83, 150);
		display.setTextColor(BRUCE_PRICOLOR);
		display.setTextSize(2.5);
		display.println(currentImage);
	}
	catch(erdi){

		display.error("image error: " + erdi);
	}
}

function parseImageNames(names){

	var re = /:50001\/(D[^<\s]+)(?:&lt;\/res&gt;)/g;
	var out = [];
	var tmp;

	while((tmp = re.exec(names)) !== null){

		out.push(tmp[1]);
	}
	return out;
}

function parseValue(data, tag) {

	try{

		return data.match(new RegExp("<" + tag + ">(.*?)</" + tag + ">"))[1];
	}
	catch(evv){

		return null;
	}
}

function drawShape(shape, x, y, width, height, radius, color0, color1, direction){

	if (shape === undefined) shape = random(0, 9);
	if (x === undefined) x = random(0, displayWidth / 2);
	if (y === undefined) y = random(0, displayHeight / 2);
	if (width === undefined) width = random(0, displayWidth);
	if (height === undefined) height = random(0, displayHeight);
	if (radius === undefined) radius = random(0, displayHeight / 4);
	if (color0 === undefined) color0 = random(0, 65535);
	if (color1 === undefined) color1 = random(0, 65535);
	if (direction === undefined) direction = (random(0, 1) < 0.5 ? "horizontal" : "vertical");

	switch(shape){

		case 0:
			display.drawPixel(x * 2, y * 2, color0);
			break;
		case 1:
			display.drawLine(x * 2, y * 2, width, height, color0);
			break;
		case 2:
			display.drawRect(x, y, width, height, color0);
			break;
		case 3:
			display.drawFillRect(x, y, width, height, color0);
			break;
		case 4:
			display.drawFillRectGradient(x, y, width, height, color0, color1, direction);
			break;
		case 5:
			display.drawRoundRect(x, y, width, height, radius, color0);
			break;
		case 6:
			display.drawFillRoundRect(x, y, width, height, radius, color0);
			break;
		case 7:
			display.drawCircle(x * 2, y * 2, radius, color0);
			break;
		case 8:
			display.drawFillCircle(x * 2, y * 2, radius, color0);
			break;
	}
}

function removeDupes(data){

	var seen = {};
	var result = [];
	for(var i = 0; i < data.length; i++){

		if(!seen[data[i]] && data[i].trim() !== ""){
			seen[data[i]] = true;
			result.push(data[i]);
		}
	}
	return result;
}

function autoPoll(){

	var nowTime = now();
	if(nowTime - lastPollTime > pollInterval){
		
		lastPollTime = nowTime;
		try{

			var response = fetchCommand("/cam.cgi?mode=getstate");
		}
		catch(erap){

			display.println("Error polling: " + erap);
		}
		if(response.body){

			var currentMode = parseValue(response.body, "cammode");
			var currentRec = parseValue(response.body, "rec");
			var currentTemp = parseValue(response.body, "temperature");
			var currentBatt = parseValue(response.body, "batt");
			var currentShots = parseValue(response.body, "remaincapacity");

			if(currentMode !== lastMode || currentRec !== lastRec || currentTemp !== lastTemp || currentShots !== shotsLeft || currentBatt !== lastBatt){

				lastMode = currentMode;
				lastRec = currentRec;
				lastTemp = currentTemp;
				lastBatt = currentBatt;
				shotsLeft = currentShots;
				if(lastMode !== "play") drawGUI();
			}
		}
	}
}

function drawGUI(){

	display.fill(BRUCE_BGCOLOR);
	dialog.drawStatusBar();
	display.setCursor(0, 30);
	display.setTextColor(BRUCE_PRICOLOR);
	display.setTextSize(2.5);
	if(bAddFlare) drawShape();
	if(lastMode === "rec"){

		for(var i = 0; i < recModeCommands.length; i++){

			if((i === selectedRec && !bIsRecording)){

				display.println("> " + recModeCommands[i]);
			}
			else if(i === selectedRec && bIsRecording && recModeCommands[i] === "Start recording"){

				display.println("> Stop recording");
			}
			else if(recModeCommands[i] === "Start recording" && bIsRecording){

				display.println("  Stop recording");
			}
			else if(i === selectedRec){

				display.println("> " + recModeCommands[i]);
			}
			else if(recModeCommands === undefined || selectedRec >= recModeCommands.length){

				dialog.error("GUI ERROR: " + recModeCommands.length + " " + selectedRec);
			}
			else{

				display.println("  " + recModeCommands[i]);
			}
		}
	}
	else{

		for(var i = 0; i < playModeCommands.length; i++){

			if(i === (bSelectedPlay ? 1 : 0)){

				display.println("> " + playModeCommands[i]);
			}
			else{

				display.println("  " + playModeCommands[i]);
			}
		}
	}
	bCmdChanged = false;
	display.println("\nMode: " + lastMode + "  Temp: " + lastTemp + (lastMode === "play" ? "" : "\nRec: " + lastRec + " Shots left: " + shotsLeft));
	display.println("Battery: " + lastBatt);
	if(lastMode === "play"){

		display.setCursor(230, 30);
		display.println(thumbnailArray.length + "/" + totalImages);
	}
}

function saveSettings(){

	savedIPs.push(cameraIP);
	savedMACs.push(cameraMAC);
	savedSSIDs.push(networkSSID);
	savedPasses.push(networkPass);
	savedIPs = removeDupes(savedIPs);
	savedMACs = removeDupes(savedMACs);
	savedSSIDs = removeDupes(savedSSIDs);
	savedPasses = removeDupes(savedPasses);
	var result = savedIPs.join(",") + "\n" + savedMACs.join(",") + "\n" + savedSSIDs.join(",") + "\n" + savedPasses.join(",") + "\n" + directSSID + "\n" + directPass;
	result = result.replace(/\r/g, "");
	storage.write(settingsLocation, result, "write");
}

function loadSettings(location){

	var raw = storage.read(location);
	raw = raw.replace(/\r/g, "");
	var lines = raw.split("\n");
	savedIPs = lines[0].split(",");
	savedMACs = lines[1].split(",");
	savedSSIDs = lines[2].split(",");
	savedPasses = lines[3].split(",");
	directSSID = lines[4];
	directPass = lines[5];
}

function tryConnecting(ssid, pass){

	if(ssid !== "" && pass !== ""){

		try{

			dialog.info("Connecting to " + ssid);
			wifi.connect(ssid, 10, pass);
			display.fill(BRUCE_BGCOLOR);
		}
		catch(ertc){

			dialog.error("Failed connecting to " + ertc);
		}
	}
}

function debugDisplay(debugData, bWaitForEsc){

	display.fill(BRUCE_BGCOLOR);
	display.setTextColor(BRUCE_PRICOLOR);
	display.setCursor(0, 0);
	display.setTextSize(2);
	display.println(debugData);
	if(!bWaitForEsc){

		while(true){
 
			if(keyboard.getAnyPress()){

				break;
			}
		}
	}
}

function getSSID(){

	var SSIDList = [];
	var scanResults = wifi.scan();
	for(var i = 0; i < scanResults.length; i++){

		SSIDList.push(scanResults[i]["SSID"]);
	}
	SSIDList.push("hidden");
	var chosenSSID = dialog.choice(SSIDList);
	if(chosenSSID === "hidden"){

		var chosenSSID = keyboard.keyboard("", 32, "SSID");
	}
}

function newWanConnection(){

	var selectedSSID = getSSID();
	var selectedPass = keyboard.keyboard("", 64, "Password");
	savedSSIDs.push(selectedSSID);
	savedPasses.push(selectedPass);
	savedSSIDs = removeDupes(savedSSIDs);
	savedPasses = removeDupes(savedPasses);
	tryConnecting(selectedSSID, selectedPass);
}

function directMode(){

	if(wifi.connected()) wifi.disconnect();
	if(directSSID === ""){

		directSSID = getSSID();
		directPass = keyboard.keyboard("", 64, "Password");
	}
	tryConnecting(directSSID, directPass);
}

function wanMode(){

	if(!wifi.connected()){

		if(savedSSIDs.length > 0 && savedSSIDs[0] !== ""){

			for(var i = 0; i < savedSSIDs.length; i++){
				
				tryConnecting(savedSSIDs[i], savedPasses[i]);
			}
		}
		else{

			newWanConnection();
		}
	}
	else checkIPs();
}

function chooseMode(){

	display.fill(BRUCE_BGCOLOR);

		// STUPID! Returns: "Direct" or "right"
		if(dialog.message("Choose mode of operation\nfor your camera,\nplease", {left: "Direct", right: "Use WAN"}) === "Direct"){

			directMode();
		}
		else{

			wanMode();
		}
}

function checkIPs(){

	if(wifi.connected()){

		if(savedIPs.length > 0){

			var bShookHand = false;
			for(var ip = 0; ip < savedIPs.length; ip++){

				cameraIP = savedIPs[ip];
				for(var mac = 0; mac < savedMACs.length; mac++){

					cameraMAC = savedMACs[mac];
					dialog.info("Trying IP: " + cameraIP + " MAC: " + cameraMAC);
					bShookHand = doTheHandshake();
					dialog.info(bShookHand, true);
					if(bShookHand) return bShookHand;
				}
			}
			return bShookHand;
		}
	}
	else return false;
}

function getCameraCreds(){

	display.fill(BRUCE_BGCOLOR);
	var IPManual = savedIPs.concat();
	var MACManual = savedMACs.concat();
	IPManual.push("enter new");
	MACManual.push("enter new");
	cameraIP = dialog.choice(IPManual);
	if(cameraIP === "enter new"){

		cameraIP = keyboard.numKeyboard("192.168.54.1", 16, "Camera IP");
	}
	cameraMAC = dialog.choice(MACManual);
	if(cameraMAC === "enter new"){

		cameraMAC = keyboard.keyboard("00AA11BB22CC", 16, "Camera MAC");
		cameraMAC = to_upper_case(cameraMAC);
	}
	savedIPs.push(cameraIP);
	savedMACs.push(cameraMAC);
}

function doTheHandshake(){

	try{
		fetchCommand(":60606/" + cameraMAC + "/Server0/ddd");
		var handshakeResponse = fetchCommand("/cam.cgi?mode=accctrl&type=req_acc&value=4D454930-0100-1000-8001-" + cameraMAC + "&value2=Brumix");
		if(handshakeResponse.body !== ""){

			fetchCommand("/cam.cgi?mode=camcmd&value=recmode");
			bDoRun = true;
			return true;
		}
		else{

			bDoRun = false;
			return false;
		}
	}
	catch(erhs){}
}

function tryRestoring(){

	try{
		
		loadSettings(settingsLocation);
	}
	catch(ertr){

		restoreFromFile();
	}
}

function restoreFromFile(){

	try{
		display.fill(BRUCE_BGCOLOR);
		dialog.drawStatusBar();
		var doLoadSettings = dialog.message("Config file not found.\nDo you have one?", {left: "No", right: "Yes"}); // STUPID! Returns: "No" or "right"
		if(doLoadSettings === "right"){

			var selectedPath = dialog.pickFile("/", "conf");
			loadSettings(selectedPath);
		}
	}
	catch(errff){

		dialog.error("restoreFromFile: " + selectedPath + " - " + errff);
	}
}

function drawSplash(){

	display.fill(BRUCE_BGCOLOR);
	for(var i = 0; i < displayHeight; i += 5){

		var c = display.color(10 + i / 3, 20 + i / 4, 40 + i / 2);
		display.drawFillRect(0, i, displayWidth, 5, c);
	}
	for(var i = 0; i < 120; i++){

		var sx = Math.floor(random() * displayWidth);
		var sy = Math.floor(random() * (displayHeight / 2));
		var sc = display.color(255, 255, 255);
		display.drawPixel(sx, sy, sc);
	}
	var sunX = displayWidth - 60;
	var sunY = 50;
	for(var i = 0; i < 25; i++){

		display.drawCircle(sunX, sunY, i * 2, display.color(255, 180 - i * 4, 20));
	}
	var baseY = displayHeight * 0.65;
	display.drawFillTriangle(0, baseY, displayWidth * 0.2, baseY - 90, displayWidth * 0.4, baseY, display.color(30, 60, 30));
	display.drawFillTriangle(displayWidth * 0.25, baseY, displayWidth * 0.5, baseY - 120, displayWidth * 0.75, baseY, display.color(25, 55, 25));
	display.drawFillTriangle(displayWidth * 0.6, baseY, displayWidth * 0.8, baseY - 80, displayWidth, baseY, display.color(35, 70, 35));
	display.drawFillTriangle(displayWidth * 0.22, baseY - 70, displayWidth * 0.2, baseY - 90, displayWidth * 0.18, baseY - 70, display.color(240, 240, 240));
	display.drawFillTriangle(displayWidth * 0.5, baseY - 100, displayWidth * 0.5, baseY - 120, displayWidth * 0.48, baseY - 100, display.color(240, 240, 240));
	display.drawFillTriangle(displayWidth * 0.78, baseY - 60, displayWidth * 0.8, baseY - 80, displayWidth * 0.82, baseY - 60, display.color(240, 240, 240));
	display.drawFillRect(0, baseY, displayWidth, displayHeight - baseY, display.color(20, 80, 30));
	for(var i = 0; i < displayHeight; i += 3){

		var rw = 40 + Math.sin(i / 10) * 20;
		display.drawFillRect(displayWidth * 0.45 - rw / 2, baseY + i / 2, rw, 3, display.color(30, 120, 180));
	}

	function tree(tx, ty){

		display.drawFillRect(tx, ty, 6, 20, display.color(80, 50, 20));
		display.drawFillCircle(tx + 3, ty - 5, 10, display.color(20, 100, 40));
		display.drawFillCircle(tx - 2, ty - 12, 10, display.color(20, 110, 50));
		display.drawFillCircle(tx + 8, ty - 12, 10, display.color(20, 90, 40));
	}
	for(var i = 0; i < 15; i++){

		var tx = Math.floor(random() * displayWidth);
		var ty = baseY + 10 + Math.floor(random() * (displayHeight - baseY - 30));
		tree(tx, ty);
	}
	display.drawRect(0, 0, displayWidth - 1, displayHeight - 1, display.color(200, 200, 200));
}

function initialise(){

	tryRestoring();
	var isDirect = chooseMode();
	var didItGoThrough = false;
	if(!checkIPs() && wifi.connected()){

		getCameraCreds();
		didItGoThrough = doTheHandshake();
	}
	if(!wifi.connected() && !didItGoThrough){

		dialog.error("Failed to connect. Check settings and try again", false);
	}
	else{

		saveSettings();
	}
}

function mainLoop(){

	drawSplash();
	delay(1000);
	initialise();
	try{
		while(bDoRun){

			handleInput();
			autoPoll();
			if(bCmdChanged){

				drawGUI();
			}
		}
	}
	catch(err){

		dialog.error("Mainloop Error: " + err, true);
	}
}
mainLoop();
