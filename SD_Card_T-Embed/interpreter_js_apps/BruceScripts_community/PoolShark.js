/*
	Yes, it's a tiny little billiards game!
	Having had the physics it was just begging to be written - so I wrote it
	It's not perfect by any means but basic stuff works. With time I might even
	make it into a multiplayer one, who knows

	by gib
*/

const display = require("display");
const keyboard = require("keyboard");

const SCREEN_WIDTH = display.width();
const SCREEN_HEIGHT = display.height();

var bDoRun = true;
var lastTime = now();

var balls = [];
var pockets = [];

var gameState = "AIMING";
var cueBall = null;

var aimAngle = 0;
var aimPower = 0;

var maxPower = 1000;

function Pocket(x, y, radius){

	this.x = x;
	this.y = y;
	this.radius = radius;
	pockets.push(this);
}

Pocket.prototype.draw = function(){

	display.drawFillCircle(this.x, this.y, this.radius, 0);
};

function Ball(x, y, radius, color, isCue){

	this.x = x || 0;
	this.y = y || 0;
	this.radius = radius || 8;
	this.color = color || 65535;
	this.isCue = isCue || false;
	this.mass = this.radius * this.radius;
	this.xVel = 0;
	this.yVel = 0;
	this.xAccel = 0;
	this.yAccel = 0;
	this.bounce = 0.92;
	this.friction = 0.985;
	balls.push(this);
}

Ball.prototype.update = function(deltaTime){

	var steps = 4;
	var stepDT = deltaTime / steps;
	for(var s = 0; s < steps; s++){

		this.xVel += this.xAccel * stepDT;
		this.yVel += this.yAccel * stepDT;
		this.xVel *= this.friction;
		this.yVel *= this.friction;
		this.x += this.xVel * stepDT;
		this.y += this.yVel * stepDT;
		if(this.x < this.radius){

			this.x = this.radius;
			this.xVel *= -this.bounce;
		}
		if(this.x > SCREEN_WIDTH - this.radius){

			this.x = SCREEN_WIDTH - this.radius;
			this.xVel *= -this.bounce;
		}
		if(this.y < this.radius){

			this.y = this.radius;
			this.yVel *= -this.bounce;
		}
		if(this.y > SCREEN_HEIGHT - this.radius){

			this.y = SCREEN_HEIGHT - this.radius;
			this.yVel *= -this.bounce;
		}
	}
	if(Math.abs(this.xVel) < 1){

		this.xVel = 0;
	}
	if(Math.abs(this.yVel) < 1){

		this.yVel = 0;
	}
};

Ball.prototype.draw = function(){

	display.drawFillCircle(this.x, this.y, this.radius, this.color);
};

function createTable(){

	var r = 16;
	new Pocket(0, 0, r);
	new Pocket(SCREEN_WIDTH / 2, 0, r);
	new Pocket(SCREEN_WIDTH, 0, r);
	new Pocket(0, SCREEN_HEIGHT, r);
	new Pocket(SCREEN_WIDTH / 2, SCREEN_HEIGHT, r);
	new Pocket(SCREEN_WIDTH, SCREEN_HEIGHT, r);
}

function addBallAt(x, y, r, color, isCue){

	var ball = new Ball(x, y, r, color, isCue);
	if(isCue) cueBall = ball;

	return ball;
}

function checkBallCollision(a, b){

	var dx = b.x - a.x;
	var dy = b.y - a.y;
	var distSq = dx * dx + dy * dy;
	var minDist = a.radius + b.radius;
	return distSq <= minDist * minDist;
}

function resolveBallCollision(a, b){

	if(!checkBallCollision(a, b)) return;

	var dx = b.x - a.x;
	var dy = b.y - a.y;
	var dist = Math.sqrt(dx * dx + dy * dy);
	if(dist === 0){

		dx = 0.01;
		dy = 0.01;
		dist = 0.01;
	}
	var nx = dx / dist;
	var ny = dy / dist;
	var overlap = (a.radius + b.radius) - dist;
	if(overlap > 0){

		a.x -= nx * overlap * 0.5;
		a.y -= ny * overlap * 0.5;
		b.x += nx * overlap * 0.5;
		b.y += ny * overlap * 0.5;
	}
	var rvx = b.xVel - a.xVel;
	var rvy = b.yVel - a.yVel;
	var velAlongNormal = rvx * nx + rvy * ny;
	if(velAlongNormal > 0) return;

	var restitution = 0.96;
	var j = -(1 + restitution) * velAlongNormal;
	j /= (1 / a.mass) + (1 / b.mass);
	var impulseX = j * nx;
	var impulseY = j * ny;
	a.xVel -= impulseX / a.mass;
	a.yVel -= impulseY / a.mass;
	b.xVel += impulseX / b.mass;
	b.yVel += impulseY / b.mass;
}

function checkPocket(ball){

	for(var i = 0; i < pockets.length; i++){

		var p = pockets[i];
		var dx = p.x - ball.x;
		var dy = p.y - ball.y;
		var dist = Math.sqrt(dx * dx + dy * dy);
		if(dist < p.radius + ball.radius * 0.3){

			if(ball.isCue){

				ball.x = SCREEN_WIDTH * 0.25;
				ball.y = SCREEN_HEIGHT * 0.5;
				ball.xVel = 0;
				ball.yVel = 0;
			}
			else{

				var index = balls.indexOf(ball);
				if(index !== -1) balls.splice(index, 1);
			}
			return true;
		}
	}
	return false;
}

function updateBalls(deltaTime){

	for(var i = 0; i < balls.length; i++){

		balls[i].update(deltaTime);
	}

	for(var k = 0; k < 4; k++){

		for(var i = 0; i < balls.length; i++){

			for(var j = i + 1; j < balls.length; j++){

				resolveBallCollision(balls[i], balls[j]);
			}
		}
	}
	for(var i = balls.length - 1; i >= 0; i--){

		checkPocket(balls[i]);
	}
}

function getAimDir(){

	return {x: Math.cos(aimAngle), y: Math.sin(aimAngle)};
}

function shoot(){

	var dir = getAimDir();
	cueBall.xVel += dir.x * aimPower;
	cueBall.yVel += dir.y * aimPower;
	aimPower = 0;
	gameState = "ROLLING";
}

function ballsStopped(){

	for(var i = 0; i < balls.length; i++){

		if( Math.abs(balls[i].xVel) > 1 || Math.abs(balls[i].yVel) > 1) return false;
	}
	return true;
}

function handleInput(){

	if(keyboard.getEscPress()){

		bDoRun = false;
	}

	if(gameState === "AIMING"){

		if(keyboard.getPrevPress()){

			aimAngle -= 0.02;
		}
		if(keyboard.getNextPress()){

			aimAngle += 0.02;
		}
		if(keyboard.getSelPress()){

			gameState = "POWER";
		}
	}
	else if(gameState === "POWER"){

		if(keyboard.getNextPress()){

			aimPower += 60;
		}
		if(keyboard.getPrevPress()){

			aimPower -= 60;
		}
		if(aimPower < 0){

			aimPower = 0;
		}
		if(aimPower > maxPower){

			aimPower = maxPower;
		}
		if(keyboard.getSelPress()){

			shoot();
		}
	}
}

function draw(){

	display.fill(BRUCE_BGCOLOR);
	for(var i = 0; i < pockets.length; i++){

		pockets[i].draw();
	}
	for(var i = 0; i < balls.length; i++){

		balls[i].draw();
	}
	if(gameState !== "ROLLING" && cueBall){

		var dir = getAimDir();
		display.drawLine(cueBall.x, cueBall.y, cueBall.x + dir.x * 80, cueBall.y + dir.y * 80, BRUCE_PRICOLOR);
		display.drawLine(cueBall.x - dir.x * (28 + aimPower * 0.03), cueBall.y - dir.y * (28 + aimPower * 0.03),
			cueBall.x - dir.x * 12, cueBall.y - dir.y * 12, 65535);
	}
	if(gameState === "POWER"){

		var barWidth = 120;
		var barHeight = 10;
		var x = (SCREEN_WIDTH - barWidth) / 2;
		var y = SCREEN_HEIGHT - 18;
		display.drawRect(x, y, barWidth, barHeight, BRUCE_PRICOLOR);
		display.drawFillRect(x + 1, y + 1, (aimPower / maxPower) * (barWidth - 2), barHeight - 2, BRUCE_PRICOLOR);
	}
}

function createRack(){

	var colors = [63488, 65504, 31, 2016, 63519, 64800, 65535];
	var startX = SCREEN_WIDTH * 0.72;
	var startY = SCREEN_HEIGHT * 0.5;
	var spacing = 19;
	var rows = 4;
	var colorIndex = 0;
	for(var row = 0; row < rows; row++){

		for(var col = 0; col <= row; col++){

			addBallAt(startX + row * spacing, startY - row * spacing * 0.5 + col * spacing, 8, colors[colorIndex % colors.length], false);
			colorIndex++;
		}
	}
}

function main(){

	createTable();
	addBallAt(SCREEN_WIDTH * 0.25, SCREEN_HEIGHT * 0.5, 8, 65535, true);
	createRack();
	while(bDoRun){

		var currentTime = now();
		var deltaTime = (currentTime - lastTime) / 1000;
		lastTime = currentTime;
		if(deltaTime > 0.03){

			deltaTime = 0.03;
		}
		handleInput();
		updateBalls(deltaTime);
		if(gameState === "ROLLING" && ballsStopped()){

			gameState = "AIMING";
		}
		draw();
		delay(16);
	}
}
main();