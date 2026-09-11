/*
	Quick little project that came about just because, like most of the things
	It just displays sixteen bits. Value display and randomizer can be disabled
	Simple concept, fun little late afternoon project. Napme plays on words
	BitS Play. I guess "Y" should also be capitalised. Oh well.

	by gib
*/

const dialog = require("dialog");
const display = require("display");

const doRandoms = true;
const showVal = true;

var do_run = true;
var didChange = true;
var number = 65535;


display.setTextAlign("right");

function drawBits(num, x, y, size, gap){

	if(x === undefined) x = 0;
	if(y === undefined) y = 0;
	if(size === undefined) size = 4;
	if(gap === undefined) gap = 2;

	for(var i = 0; i < 16; i++){

		var bit = (num >>> (15 - i)) & 1;
		var xDiag = x + i * (size + gap);
		var yDiag = y = xDiag * 170 / 320;
		if(bit){

			display.drawFillCircle(xDiag, yDiag, size, BRUCE_PRICOLOR);
		}
		else{

			display.drawCircle(xDiag, yDiag, size, BRUCE_PRICOLOR);
		}
	}
}

function handleInput(){

	if(keyboard.getEscPress()){

		do_run = false;
	}
	if(keyboard.getNextPress()){

		number++;
		if(number > 65535) number = 0;
		didChange = true;
	}
	if(keyboard.getPrevPress()){

		number--;
		if(number < 0) number = 65535;
		didChange = true;
	}
	if(keyboard.getSelPress() && !didChange){

		var promptedVal = keyboard.numKeyboard(to_string(doRandoms ? random(0, 65535) : number), 8, "Give me a number!");
		number = Number(promptedVal);
		didChange = true;
	}
}

function main(){

	while(do_run){

		handleInput();
		if(didChange){

			display.fill(BRUCE_BGCOLOR);
			// Tinker more later. Good for now
			drawBits(number, 8, 50, 12, 8);
			if(showVal){

				display.setCursor(320 - (to_string(number).length * 12), 0);
				display.println(to_string(number));
			}
			delay(100);
			didChange = false;
		}
	}
}
main();
