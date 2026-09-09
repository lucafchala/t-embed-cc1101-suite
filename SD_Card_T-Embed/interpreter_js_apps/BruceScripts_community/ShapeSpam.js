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
const shapes = 9;
const colors = 65535 + 1;

display.fill(BRUCE_BGCOLOR);
display.setTextColor(BRUCE_PRICOLOR);
display.setTextSize(3);

var b_run = true;
var b_chaos = false;
var selected = 0;

function drawShape(shape, x, y, width, height, radius, color0, color1, direction){

	if (shape === undefined) shape = random(0, shapes);
	if (x === undefined) x = random(0, displayWidth / 2);
	if (y === undefined) y = random(0, displayHeight / 2);
	if (width === undefined) width = random(0, displayWidth);
	if (height === undefined) height = random(0, displayHeight);
	if (radius === undefined) radius = random(0, displayHeight / 4);
	if (color0 === undefined) color0 = random(0, colors);
	if (color1 === undefined) color1 = random(0, colors);
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

		b_chaos = !b_chaos;
	}
}

function main(){

	while(b_run){

		handleInput();
		if(b_chaos){

			drawShape();
		}
		else{

			drawShape(selected);
		}
	}
}
main();
