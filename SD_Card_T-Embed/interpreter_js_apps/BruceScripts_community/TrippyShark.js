/*
	Just a small script that displays a screen full of pixels. One pixel at a time.
	At least the last time I tried - it looked pretty nice. Or maybe I'm seeing things.

	by gib
*/
const w = display.width();
const h = display.height();

var o = true;

function d(){

	var x = random(0, w / 2);
	var y = random(0, h / 2);
	var c = random(0, 65535);
	display.drawPixel(x * 2, y * 2, c);
}

while(o){

	if(keyboard.getEscPress()) o = false;
	d();
}