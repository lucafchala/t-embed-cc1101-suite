/*
	This script downloads a large file in manageable chunks.
	Yes, it's not bulletproof but worked for what I needed it.
	Saving separately for future reference, might be useful.

	by gib
*/

const keyboard = require('keyboard');
const storage = require('storage');
const dialog = require('dialog');
const wifi = require('wifi');

function downloadFile(url, destination, displayDialog){

	if(destination === undefined) destination = "/" + url.split('/').pop();
	if(displayDialog === undefined) displayDialog = false;
	var headResp = wifi.httpFetch(url, {method: "HEAD"});
	var isOk = to_string(headResp.status);
	if(isOk.indexOf("2") === 0){

		try{storage.remove(destination);}
		catch(erdf){}
		if(displayDialog) dialog.info("Downloading " + size + " bytes");
		var size = Number(headResp.headers["Content-Length"]);
		var chunkSize = 64 * 1024;
		var offset = 0;
		while(offset < size){

			var end = Math.min(offset + chunkSize - 1, size - 1);
			var chunkResp = wifi.httpFetch(url, {headers: {Connection: "Keep-Alive", Range: "bytes=" + offset + "-" + end}});
			storage.write({fs: "sd", path: destination}, chunkResp.body, "append");
			offset += chunkSize;
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
downloadFile("https://sample-files.com/downloads/images/jpg/exif_rich_3000x2000_3.81mb.jpg", "/downloaded.jpg", true);
