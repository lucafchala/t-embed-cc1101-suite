/*
	It's just another, bigger version. Not minified because it's a whole.
	Just another random project that got initiated because I needed to wind down.
	And what's the better way if not by some more coding? I was on a fence about
	putting this public but oh well, I'm pretty sure I'm not the only one who
	figured out it'd be funny to mess with some random colours and such.
	Anywho, I don't think I'll be prodding at it anymore, works good as it is.
	
	by gib
*/

const display = require("display");
const displayWidth = display.width();
const displayHeight = display.height();
const halfHeight = displayHeight / 2;
const halfWidth = displayWidth / 2;
const quarterHeight = displayHeight / 4;
const shapes = 34; //9;
const colors = 65535 + 1;

display.fill(BRUCE_BGCOLOR);
display.setTextColor(BRUCE_PRICOLOR);
display.setTextSize(3);

var b_run = true;
var b_chaos = false;
var selected = 0;

function drawShape(shape, x, y, width, height, radius, color0, color1, direction){

	if(shape === undefined) shape = random(0, shapes);
	if(x === undefined) x = random(0, halfWidth);
	if(y === undefined) y = random(0, halfHeight);
	if(width === undefined) width = random(0, displayWidth);
	if(height === undefined) height = random(0, displayHeight);
	if(radius === undefined) radius = random(0, quarterHeight);
	if(color0 === undefined) color0 = random(0, colors);
	if(color1 === undefined) color1 = random(0, colors);
	if(direction === undefined) direction = (random(0, 1) < 0.5 ? "horizontal" : "vertical");

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

function handleInput(){

	if(keyboard.getEscPress()){

		b_run = false;
	}
	if(keyboard.getNextPress() && !b_chaos){

		selected++;
		if(selected >= shapes) selected = 0;
	}
	if(keyboard.getPrevPress() && !b_chaos){

		selected--;
		if(selected < 0) selected = shapes - 1;
	}
	if(keyboard.getSelPress()){

		// b_chaos = !b_chaos;
		// var testVar = random(0, 160);
		// debugLine(d_tempGlobColor + " sel: " + selected);
		debugLine(c);
	}
}

function debugLine(inLine){

	drawShape(3, 30, 50, 240, 25, 0, 0, 0, 0);
		display.setCursor(31, 51);
		display.println(inLine);
}

var d_tempGlobColor = 0;
var c = 0;
function theLogic(){

	for(var y = 0; y <= displayHeight; y++){

		if(!b_run) break;

		handleInput();
		if(!b_run) break;

		display.drawLine(0, y, displayWidth, y, c);
		c++;
		debugLine(c);
		if(c >= colors){

			c = 0;
		}
		delay(5);
	}
}

function randSatColor(min){

	var r = random(min, 320) / 10;
	var g = random(min * 2, 640) / 10;
	var b = random(min, 320) / 10;
	return (r << 11) | (g << 5) | b;
}

function main(){

	while(b_run){


		handleInput();
		if(b_chaos){

		theLogic();
		  }
		  else{

			theLogic();
		}
	}
}
main();
