/* 
	LunarLander for BruceFW. The goal is to land sofly. Steering is intuitive.
	As usual - next/prev  to rotate, sel to fire thrusters and esc to quit.
	Coming soon: Difficulity level selection, scores, more suff to display

	by gib
*/

const DISPLAY_WIDTH = display.width();
const DISPLAY_HEIGHT = display.height();
const GRAVITY = 0.02;
const THRUST = 0.5;
const ROTATE_BY = 0.1;
const MAX_V_X = 0.75;
const MAX_V_Y = 0.75;
const MAIN_COLOR = BRUCE_PRICOLOR;
const PAD_COLOR = ~BRUCE_PRICOLOR;
const BAR_COLOR = display.color(255, 255, 0);
const SEGMENT_WIDTH = 10;
const BURN_RATE = 4;
const CHAR_W = 10;
const CHAR_H = 16;

var terrain = [];
var lastShipUpd = 0;
var pad = {x: 0, y: 0, w: 30};
var ship = {
	
	x: DISPLAY_WIDTH * 0.5,
	y: 20,
	oldX: DISPLAY_WIDTH * 0.5,
	oldY: 20,
	velX: 0,
	velY: 0,
	rotation: 0,
	oldHUD: [0, 0, 0],
	fuel: 100,
	thrusting: false,
	startTime: 0,
	gameOver: false,
	status: ["alive", ""]
};


var failScreen = {

	particles: [],

	spawn: function(){

		var x = random(10, DISPLAY_WIDTH - 10);
		var s = 0.6 + random(0, 100) * 0.01;
		this.particles.push({x: x, y: -10, vy: 1.2 + random(0, 80) * 0.01, s: s});
	},

	update: function(dt){

		var t = dt * 60;
		if(random(0, 100) < 6) this.spawn();

		for(var i = this.particles.length - 1; i >= 0; i--){

			var p = this.particles[i];
			p.y = p.y + p.vy * t;
			if(p.y > DISPLAY_HEIGHT + 20){

				this.particles.splice(i, 1);
			}
		}
	},

	draw: function(){

		for(var i = 0; i < this.particles.length; i++){

			var p = this.particles[i];
			var x = p.x;
			var y = p.y;
			var s = p.s;
			display.drawFillCircle(x, y - s * 5, s * 4, 63488);
		}
	}
};

var winScreen = {

	particles: [],
	randomBrightColor: function(){

		var r = random(0, 255);
		var g = random(0, 255);
		var b = random(0, 255);
		var max = Math.max(r, g, b);
		r = r * 255 / max;
		g = g * 255 / max;
		b = b * 255 / max;
		r = (r + 255) * 0.5;
		g = (g + 255) * 0.5;
		b = (b + 255) * 0.5;
		return display.color(r, g, b);
	},

	spawnFirework: function(){

		var startX = random(20, DISPLAY_WIDTH - 20);
		this.particles.push({x: startX, y: DISPLAY_HEIGHT, velX: random(-20, 20) * 0.01, velY: -(2.5 + random(0, 20) * 0.1),
			color: this.randomBrightColor(), targetY: random(20, DISPLAY_HEIGHT * 0.6), rocket: true, life: 999});
	},

	explosion: function(x, y, color){

		var count = 32 + random(0, 30);
		for(var i = 0; i < count; i++){

			var a = Math.PI * 2 * i / count;
			var s = 1 + random(0, 40) * 0.1;
			this.particles.push({x: x, y: y, velX: Math.cos(a) * s, velY: Math.sin(a) * s, color: color, rocket: false, life: 40 + random(0, 60)});
		}
	},

	update: function(dt){

		var delta = dt * 60;
		if(random(0, 100) < 4) this.spawnFirework();

		for(var i = this.particles.length - 1; i >= 0; i--){

			var particle = this.particles[i];
			if(particle.rocket){

				particle.x += particle.velX * delta;
				particle.y += particle.velY * delta;
				if(particle.y <= particle.targetY){

					this.explosion(particle.x, particle.y, particle.color);
					this.particles.splice(i, 1);
				}
				continue;
			}
			particle.velY += 0.04 * delta;
			particle.x += particle.velX * delta;
			particle.y += particle.velY * delta;
			particle.life -= delta;
			if(particle.life <= 0){

				this.particles.splice(i, 1);
			}
		}
	},

	draw: function(){

		display.fill(BRUCE_BGCOLOR);
		for(var i = 0; i < this.particles.length; i++){

			var particle = this.particles[i];
			if(particle.rocket){

				display.drawFillCircle(particle.x, particle.y, 2, particle.color);
			}
			else{

				display.drawFillCircle(particle.x, particle.y, 1, particle.color);
			}
		}
	}
}

function drawCentredMultiline(str, y, color){

	var lines = str.split("\n");
	var maxW = 0;
	for(var i = 0; i < lines.length; i++){

		var w = lines[i].length * CHAR_W;

		if(w > maxW) maxW = w;
	}
	var startY = y - (lines.length * CHAR_H) / 2;
	for(var j = 0; j < lines.length; j++){

		var line = lines[j];
		var x = (DISPLAY_WIDTH - line.length * CHAR_W) / 2;
		var ly = startY + j * CHAR_H;
		display.setCursor(x, ly);
		display.setTextColor(color);
		display.println(line);
	}
}

function genTerrain(){

	terrain = [];
	var x  =  0;
	var y = DISPLAY_HEIGHT * 0.95 + random(-20, 20);
	while(x < DISPLAY_WIDTH){

		y += random(-20, 20);
		if(y < DISPLAY_HEIGHT * 0.55) y = DISPLAY_HEIGHT * 0.55;
		if(y > DISPLAY_HEIGHT - 20) y = DISPLAY_HEIGHT - 20;

		terrain.push({x: x, y: y});
		x += SEGMENT_WIDTH;
	}
	var last = terrain[terrain.length - 1];
	if(last.x !== DISPLAY_WIDTH){

		terrain.push({x: DISPLAY_WIDTH, y: last.y});
	}
	var p = 2 + random(0, terrain.length - 4);
	pad.x = terrain[p].x;
	pad.y = terrain[p].y;
	for(var i = p; i < p + 3; i++) terrain[i].y = pad.y;

	pad.w = terrain[p + 2].x - terrain[p].x;
	
}

function drawTerrain(){

	display.fill(BRUCE_BGCOLOR);
	for(var i = 0; i < terrain.length - 1; i++){

		display.drawLine(terrain[i].x, terrain[i].y, terrain[i + 1].x, terrain[i + 1].y, MAIN_COLOR);
	}
	display.drawFastHLine(pad.x, pad.y, pad.w, PAD_COLOR);
}

function reset(){

	ship.x = DISPLAY_WIDTH / 2;
	ship.y = 20;
	ship.oldX = ship.x;
	ship.oldY = ship.y;
	ship.velX = 0;
	ship.velY = 0;
	ship.rotation = 0;
	ship.oldHUD = [0, 0, 0];
	ship.fuel = 100;
	ship.thrusting = false;
	ship.startTime = now();
	ship.gameOver = false;
	ship.status = ["alive", ""];
	genTerrain();
	drawTerrain();
}

function groundY(x){

	for(var i = 0; i < terrain.length - 1; i++){

		var a = terrain[i];
		var b = terrain[i + 1];
		if(x >= a.x && x <= b.x){

			var t = (x - a.x) / (b.x - a.x);
			return a.y + (b.y - a.y) * t;
		}
	}
	return DISPLAY_HEIGHT;
}

function drawLocalTerrain(x, y, w, h){

	for(var i = 0; i < terrain.length - 1; i++){

		var x1 = terrain[i].x;
		var x2 = terrain[i + 1].x;
		if(x2 < x || x1 > x + w) continue;

		display.drawLine(terrain[i].x, terrain[i].y, terrain[i + 1].x, terrain[i + 1].y, MAIN_COLOR);
	}
	if(pad.x + pad.w >= x && pad.x <= x + w){

		display.drawFastHLine(pad.x, pad.y, pad.w, PAD_COLOR);
	}
}

function eraseShip(){

	display.drawFillRect(ship.oldX - 12, ship.oldY - 12, 24, 24, BRUCE_BGCOLOR);
	drawLocalTerrain(ship.oldX - 12, ship.oldY - 12, 24, 24);
}

function drawHud(){

	display.drawFillRect(5, 5, 50, 12, BRUCE_BGCOLOR);
	display.drawRect(4, 4, 52, 6, MAIN_COLOR);
	display.drawFillRect(5, 5, ship.fuel >> 1, 4, BAR_COLOR);
}

function drawShip(){

	var posX = ship.x;
	var posY = ship.y;
	var shipSin = Math.sin(ship.rotation);
	var shipCos = Math.cos(ship.rotation);
	var shipX1 = posX + shipSin * 6;
	var shipY1 = posY - shipCos * 6;
	var shipX2 = posX - shipCos * 4 - shipSin * 4;
	var shipY2 = posY - shipSin * 4 + shipCos * 4;
	var shipX3 = posX + shipCos * 4 - shipSin * 4;
	var shipY3 = posY + shipSin * 4 + shipCos * 4;
	var currVel = [Math.floor(ship.velX * 10) / 10, Math.floor(ship.velY * 10) / 10];
	var currRot = Math.floor(ship.rotation * 10) / 10;
	display.drawTriangle(shipX1, shipY1, shipX2, shipY2, shipX3, shipY3, MAIN_COLOR);
	if(ship.oldHUD[0] !== currVel[0] || ship.oldHUD[1] !== currVel[1] || ship.oldHUD[2] !== currRot){

		var hudText = "V: " + currVel[0] + "x" + currVel[1] + " R: " + currRot;
		var hudX = DISPLAY_WIDTH / 2 - ((hudText.length * CHAR_W) / 2 );
		display.drawFillRect(0, 0, DISPLAY_WIDTH, 14, BRUCE_BGCOLOR);
		ship.oldHUD = [currVel[0], currVel[1], currRot];
		display.setCursor(hudX, 0);
		display.println(hudText);
		drawHud();
	}
}

function crash(){

	if(ship.gameOver) return;

	ship.gameOver = true;
	failScreen.particles = [];
	if(ship.fuel !== 0) ship.status = ["YOU LOSE", "Try again!\nYou survived: " + ((now() - ship.startTime) / 1000) + "s"];
	else ship.status = ["YOU LOSE", "You ran out of fuel.\nYou survived: " + ((now() - ship.startTime) / 1000) + "s"];
}

function land(){

	if(ship.gameOver) return;

	ship.gameOver = true;
	winScreen.particles = [];
	ship.status = ["YOU WIN!", to_string(Math.round(ship.fuel)) + "% fuel left.\nYou landed in: " + to_string((now() - ship.startTime) / 1000) + "s"];
}

function endScreen(string, subString, winLoss, delta){

	if(winLoss){

		while(!handleInput()){

			winScreen.update(delta);
			winScreen.draw();
			drawFinalMessage(string, subString);
		}
	}
}

function drawFinalMessage(message){

	display.setTextSize(4);
	display.setCursor(DISPLAY_WIDTH / 2 - message[0].length * 20 / 2, DISPLAY_HEIGHT / 2 - 16);
	display.println(message[0]);
	display.setTextSize(2);
	drawCentredMultiline(message[1], DISPLAY_HEIGHT / 2 + 40, BRUCE_PRICOLOR);
}
function handleInput(){

	ship.thrusting = false;
	if(keyboard.getPrevPress() && !ship.gameOver) ship.rotation -= ROTATE_BY;
	if(keyboard.getNextPress() && !ship.gameOver) ship.rotation += ROTATE_BY;
	if(keyboard.getSelPress() && ship.fuel > 0 && !ship.gameOver){

		ship.thrusting = true;
		ship.velX += Math.sin(ship.rotation) * THRUST;
		ship.velY -= Math.cos(ship.rotation) * THRUST;
		ship.fuel -= BURN_RATE;
		drawHud();
	}
	if(keyboard.getEscPress()) return false;
	return true;
}

function update(dt){

	var delta = dt * 60;
	ship.oldX = ship.x;
	ship.oldY = ship.y;
	ship.velY += GRAVITY * delta;
	if(ship.velX > MAX_V_X)ship.velX = MAX_V_X;
	if(ship.velX < -MAX_V_X)ship.velX = -MAX_V_X;
	if(ship.velY > MAX_V_Y)ship.velY = MAX_V_Y;
	if(ship.velY < -MAX_V_Y)ship.velY = -MAX_V_Y;
	ship.x += ship.velX * delta;
	ship.y += ship.velY * delta;
	if(ship.x < 0) ship.x = DISPLAY_WIDTH - 1;
	if(ship.x >= DISPLAY_WIDTH) ship.x = 0;
	if(ship.y + 6 >= groundY(ship.x)){

		if(ship.x >= pad.x && ship.x <= pad.x + pad.w && Math.abs(ship.velX) < 0.5 && Math.abs (ship.velY) < 0.3 && Math.abs(ship.rotation) < 0.3) land();
		else if(now() - ship.startTime >= 1) crash();
	}
}

function main(){

	reset();
	drawShip();
	drawHud();
	var lastTime = now();
	var currentTime = lastTime;
	var deltaTime = (currentTime - lastTime) / 1000;
	while(true){
		
		currentTime = now();
		deltaTime = (currentTime - lastTime) / 1000;
		lastTime = currentTime;
		while(ship.status[0] !== "alive"){
			
			currentTime = now();
			deltaTime = (currentTime - lastTime) / 1000;
			lastTime = currentTime;
			if(ship.status[0] === "YOU WIN!"){
				
				winScreen.update(deltaTime);
				winScreen.draw();
			}
			else if(ship.status[0] === "YOU LOSE"){
				
				failScreen.update(deltaTime);
				failScreen.draw();
			}
			else dialog.error(ship.gameOver + " " + ship.status, true);
			drawFinalMessage(ship.status);
			if(!handleInput()){
				
				reset();
				break;
			}
		}
		if(ship.status[0] === "alive" && !ship.gameOver){
			
			update(deltaTime);
			if(ship.x !== ship.oldX || ship.y !== ship.oldY){
				
				drawShip();
				eraseShip();
			}
		}
		if(!handleInput()){
		
			reset();
			break;
		}
	}
}
main();
