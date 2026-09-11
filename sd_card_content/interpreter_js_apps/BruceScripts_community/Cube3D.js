/*
	3D cube. Just a proof of concept, might be useful later on

	by gib
*/

const display = require("display");

const SCREEN_WIDTH = display.width();
const SCREEN_HEIGHT = display.height();

var bDoRun = true;
var lastTime = now();

function Mesh(vertices, edges){

	this.vertices = vertices || [];
	this.edges = edges || [];
	this.x = 0;
	this.y = 0;
	this.z = 0;
	this.rotX = 0;
	this.rotY = 0;
	this.rotZ = 0;
	this.color = BRUCE_PRICOLOR;
	this.rotationSpeedX = 0;
	this.rotationSpeedY = 0;
	this.rotationSpeedZ = 0;
}

Mesh.prototype.rotateX = function(x, y, z, angle){

	var cos = Math.cos(angle);
	var sin = Math.sin(angle);

	return {x: x, y: y * cos - z * sin, z: y * sin + z * cos};
};

Mesh.prototype.rotateY = function(x, y, z, angle){

	var cos = Math.cos(angle);
	var sin = Math.sin(angle);

	return {x: x * cos + z * sin, y: y, z: -x * sin + z * cos};
};

Mesh.prototype.rotateZ = function(x, y, z, angle){

	var cos = Math.cos(angle);
	var sin = Math.sin(angle);

	return {x: x * cos - y * sin, y: x * sin + y * cos, z: z };
};

Mesh.prototype.project = function(point){

	var distance = 200;
	var scale = distance / (distance + point.z);

	return {x: SCREEN_WIDTH / 2 + point.x * scale, y: SCREEN_HEIGHT / 2 + point.y * scale};
};

Mesh.prototype.update = function(dT){

	this.rotX += this.rotationSpeedX * dT;
	this.rotY += this.rotationSpeedY * dT;
	this.rotZ += this.rotationSpeedZ * dT;
};

Mesh.prototype.draw = function(){

	var projected = [];
	for(var i = 0; i < this.vertices.length; i++){

		var v = this.vertices[i];
		var p = {x: v.x + this.x, y: v.y + this.y, z: v.z + this.z};
		p = this.rotateX(p.x, p.y, p.z, this.rotX);
		p = this.rotateY(p.x, p.y, p.z, this.rotY);
		p = this.rotateZ(p.x, p.y, p.z, this.rotZ);
		projected.push(this.project(p));
	}
	for(var i = 0; i < this.edges.length; i++){

		var edge = this.edges[i];
		var a = projected[edge[0]];
		var b = projected[edge[1]];
		display.drawLine(a.x, a.y, b.x, b.y, this.color);
	}
};

function createCube(size){

	var s = size * 0.5;
	var vertices = [{ x: -s, y: -s, z: -s },
					{ x:  s, y: -s, z: -s },
					{ x:  s, y:  s, z: -s },
					{ x: -s, y:  s, z: -s },
					{ x: -s, y: -s, z:  s },
					{ x:  s, y: -s, z:  s },
					{ x:  s, y:  s, z:  s },
					{ x: -s, y:  s, z:  s }
	];
	var edges = [[0,1],
				[1,2],
				[2,3],
				[3,0],

				[4,5],
				[5,6],
				[6,7],
				[7,4],

				[0,4],
				[1,5],
				[2,6],
				[3,7]
	];
	return new Mesh(vertices, edges);
}

function handleInput(){

	if(keyboard.getAnyPress()){

		bDoRun = false;
	}
}

function main(){

	var cube = createCube(80);
	cube.rotationSpeedX = 0.01;
	cube.rotationSpeedY = 0.02;
	cube.z = 100;
	while(bDoRun){
		
		var currentTime = now();
		var deltaTime = (currentTime - lastTime) / 1000;
		lastTime = currentTime;
		handleInput();
		display.fill(BRUCE_BGCOLOR);
		cube.update(deltaTime);
		cube.draw();

		// ms - FPS: 6 ~ 165, 7 ~ 144, 8 ~ 120, 11 ~ 90, 16 ~ 60, 20 = 50, 21 ~ 48, 33 ~ 30, 40 = 25, 42 ~ 23.976, 66 ~ 15
		delay(16);
	}
}
main();
