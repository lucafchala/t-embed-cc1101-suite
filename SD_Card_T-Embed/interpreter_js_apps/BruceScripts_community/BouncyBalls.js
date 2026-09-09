/*
	Bouncy balls! With physics! And mass! 
	Next/prev adds/removes balls
	select nudges random ball
	escape quits
	
	by gib
*/

const display = require("display");
const keyboard = require("keyboard");

const SCREEN_WIDTH = display.width();
const SCREEN_HEIGHT = display.height();

var bDoRun = true;
var lastTime = now();
var balls = [];

function Ball(x, y, radius, color){
	
	if(color === undefined) color = random(16, 65535);
	this.x = x || 0;
	this.y = y || 0;
	this.radius = radius || 8;
	this.color = color;
	this.mass = this.radius * this.radius;
	this.xVel = 0;
	this.yVel = 0;
	this.xAccel = 0;
	this.yAccel = 500;
	this.bounce = 0.8;
	this.friction = 0.99;
	balls.push(this);
}

Ball.prototype.update = function(deltaTime){

	this.xVel += this.xAccel * deltaTime;
	this.yVel += this.yAccel * deltaTime;
	this.xVel *= this.friction;
	this.yVel *= this.friction;
	this.x += this.xVel * deltaTime;
	this.y += this.yVel * deltaTime;
	if(this.x < this.radius){

		this.x = this.radius;
		this.xVel *= -this.bounce;
	}
	if(this.x > SCREEN_WIDTH - this.radius){

		this.x = SCREEN_WIDTH - this.radius;
		this.xVel *= -this.bounce;
	}
	if(this.y > SCREEN_HEIGHT - this.radius){

		this.y = SCREEN_HEIGHT - this.radius;
		this.yVel *= -this.bounce;
	}
	if(this.y < this.radius){

		this.y = this.radius;
		this.yVel *= -this.bounce;
	}
	if(Math.abs(this.xVel) < 0.5){

		this.xVel = 0;
	}
	if(Math.abs(this.yVel) < 0.5){

		this.yVel = 0;
	}
};

Ball.prototype.draw = function(){display.drawFillCircle(this.x, this.y, this.radius, this.color);};

function checkBallCollision(a, b){

	var dx = b.x - a.x;
	var dy = b.y - a.y;
	var distance = Math.sqrt(dx * dx + dy * dy);
	return distance < (a.radius + b.radius);
}

function resolveBallCollision(a, b){

	if(!checkBallCollision(a, b)) return;

	var dx = b.x - a.x;
	var dy = b.y - a.y;
	var dist = Math.sqrt(dx * dx + dy * dy);
	if (dist === 0) dist = 0.1;

	var nx = dx / dist;
	var ny = dy / dist;
	var rvx = b.xVel - a.xVel;
	var rvy = b.yVel - a.yVel;
	var velAlongNormal = rvx * nx + rvy * ny;
	if (velAlongNormal > 0) return;

	var restitution = 0.9;
	var m1 = a.mass;
	var m2 = b.mass;
	var j = - (1 + restitution) * velAlongNormal;
	j = j / (1 / m1 + 1 / m2);
	var impulseX = j * nx;
	var impulseY = j * ny;
	a.xVel -= impulseX / m1;
	a.yVel -= impulseY / m1;
	b.xVel += impulseX / m2;
	b.yVel += impulseY / m2;
	var overlap = (a.radius + b.radius) - dist;
	var correctionX = nx * overlap * 0.5;
	var correctionY = ny * overlap * 0.5;
	a.x -= correctionX;
	a.y -= correctionY;
	b.x += correctionX;
	b.y += correctionY;
}

function updateBalls(deltaTime){

	for(var i = 0; i < balls.length; i++){

		balls[i].update(deltaTime);
	}

	for(var i = 0; i < balls.length; i++){

		for(var j = i + 1; j < balls.length; j++){

			resolveBallCollision(balls[i], balls[j]);
		}
	}
}

function drawBalls(){

	display.fill(BRUCE_BGCOLOR);
	for(var i = 0; i < balls.length; i++){

		balls[i].draw();
	}
}

function handleInput(){

	if(keyboard.getEscPress()){

		bDoRun = false;
	}
	if(keyboard.getNextPress()){

		addBallAt();
	}
	if(keyboard.getPrevPress()){

		removeRandomBall();
	}
	if(keyboard.getSelPress()){

		nudgeRandomBall(1000);
	}
}

function removeRandomBall(){

	balls.splice(random(0, balls.length), 1);
}

function addRandomV(thisBall, amountV){

	thisBall.xVel = random(-amountV, amountV);
	thisBall.yVel = random(-amountV, amountV);
}

function addBallAt(x, y, r, addRandV, amountV){

	if(x === undefined) x = random(0, SCREEN_WIDTH);
	if(y === undefined) y = random(0, SCREEN_HEIGHT);
	if(r === undefined) r = random(2, SCREEN_HEIGHT / 8);
	if(addRandV === undefined) addRandV = true;
	if(amountV === undefined) amountV = 200;
	var ball = new Ball(x, y, r);
	if(addRandV){

		addRandomV(ball, amountV);
	}
}

function nudgeRandomBall(howHard){

	var chosenBall = balls[random(0, balls.length)];
	addRandomV(chosenBall, howHard);
}

function main(){

	while(bDoRun){

		var currentTime = now();
		var deltaTime = (currentTime - lastTime) / 1000;
		lastTime = currentTime;
		handleInput();
		updateBalls(deltaTime);
		drawBalls();

		// ms - FPS: 6 ~ 165, 7 ~ 144, 8 ~ 120, 11 ~ 90, 16 ~ 60, 20 = 50, 21 ~ 48, 33 ~ 30, 40 = 25, 42 ~ 23.976, 66 ~ 15
		delay(33);
	}
}

main();
