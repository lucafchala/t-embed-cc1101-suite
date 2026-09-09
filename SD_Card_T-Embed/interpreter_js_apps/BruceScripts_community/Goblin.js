/*
	A part of it is done with the help of GePeTto. It is beatable. And replayable
	Goal is to push chaos to 20+ and nest to 5+. Good luck!
	
	by gib
*/
const keyboard = require('keyboard');
const display = require('display');
const dialog = require('dialog');

const ESC_KEY = keyboard.getEscPress;

const DISP_WIDTH = display.width();

const HOLD_TIMEOUT = 200;
const CHARGE_TIME = 2000;
const EASY_ACTION_MS = 3000;


var doRun = true;
var dirty = true;
var mode = false;

display.setTextColor(BRUCE_PRICOLOR);
display.fill(BRUCE_BGCOLOR);

var game = {
    day: 1,
    hp: 10,
    food: 6,
    scrap: 0,
    noise: 0,
    chaos: 0,
    heat: 0,
    nest: 0,
    rot: 0,
    brain: 5,
    thirst: 7,
    stink: 0,
    fungus: 0,
    suspicion: 0,
	buildingState: 0,
    location: 0,
    msg: "",
    sel: 0,
	diffLevel: 0,
	selAction: false,
	showHints: true,
    over: false
};

function restart(){

	initGame(game.diffLevel);
	for(var i = 0; i < mutations.length; i++){

		mutations[i].gained = false;
	}
	dirty = true;
}

var events = [
	"PIPES WHISPER",
	"SOMETHING MOVES BELOW",
	"LIGHTS FLICKER",
	"THE WALLS ARE WET",
	"YOU HEAR TINY SCREAMS",
	"AIR TASTES ELECTRIC"
];

var locations = [
	{
		name: "WALLS",
		actions: ["CHEW CABLES", "HIDE IN WALLS", "SCREAM AT NIGHT"]
	},
	{
		name: "KITCHEN",
		actions: ["STEAL FOOD", "EAT MOLD"]
	},
	{
		name: "BASEMENT",
		actions: ["LICK BATTERY", "DIG TUNNEL"]
	},
	{
		name: "VENTS",
		actions: ["SPY ON HUMANS", "SPREAD FILTH"]
	},
	{
		name: "BATHROOM",
		actions: ["DRINK DIRTY WATER", "LICK TILE", "HIDE IN WALLS", "STARE INTO MIRROR"]
	},
	{
		name: "ATTIC",
		actions: ["HOARD TRASH", "SPY ON HUMANS", "SLEEP IN INSULATION", "GROW FUNGUS"]
	},
	{
		name: "GARAGE",
		actions: ["LICK BATTERY", "CHEW BONES", "RUB AGAINST WIRES", "SLEEP UNDER ENGINE"]
	},
	{
		name: "BEDROOM",
		actions: ["WATCH TV THROUGH WINDOW", "BITE HUMAN", "STEAL FOOD", "SCREAM AT NIGHT"]
	},
	{
		name: "SEWERS",
		actions: ["EAT BUGS", "BUILD NEST", "GROW FUNGUS", "SCRATCH SYMBOLS"]
	}
];

var actions = [
	{
		name: "LICK TILE",
		hint: "ROT+1 BRAIN+1",
		run: function(){

			game.rot += 1;
			game.brain += 1;
			game.msg += "TASTES LIKE SOAP" ;
		}
	},
	{
		name: "STARE INTO MIRROR",
		hint: "CHAOS+2 | 0",
		run: function(){
				
			game.brain += 2;
			if(Math.random() < 0.3){

			game.chaos += 2;
			game.msg += "REFLECTION MOVED FIRST ";
			}
			else{

			game.msg += "UGLY CREATURE ";
			}
		}
	},
	{
		name: "SLEEP IN INSULATION",
		hint: "HP+2 HEAT+2",
		run: function(){
			
			game.hp += 2;
			game.heat += 2;
			game.msg += "SOFT NEST ";
		}
	},
	{
		name: "CHEW CABLES",
		hint: "FOOD+1 SCRAP+1 NOISE+2 CHAOS+1",
		run: function(){

			game.food += 1;
			game.scrap += 1;
			game.noise += 2;
			game.chaos += 1;
			game.msg += "SPARKS EVERYWHERE ";
		}
	},
	{
		name: "STEAL FOOD",
		hint: "FOOD+3 | SUSPICION+2 NOISE+1",
		run: function(){
			if(Math.random() < 0.4){

				game.food += 3;
				game.msg += "FOUND OLD MEAT ";
			}
			else{

				game.suspicion += 2;
				game.noise += 1;
				game.msg += "HUMAN SAW A SHADOW ";
			}
		}
	},
	{
			name: "HIDE IN WALLS",
			hint: "NOISE-3 HEAT-1",
			run: function(){

				game.noise -= 3;
				game.heat -= 1;
				if(game.noise < 0) game.noise = 0;
				if(game.heat < 0) game.heat = 0;
				game.msg += "IT'S SAFE INSIDE THE WALL ";
			}
	},
	{
		name: "BUILD NEST",
		hint: "SCRAP-2 NEST+1 | 0",
		run: function(){

			if(game.scrap >= 2){
				
				game.scrap -= 2;
				game.nest += 1;
				game.msg += "NEST GROWS ";
			}
			else{

				game.msg += "NEED MORE SCRAP ";
			}
		}
	},
	{
		name: "LICK BATTERY",
		hint: "HP+1 CHAOS+2 HEAT+1",
		run: function(){

			game.hp += 1;
			game.chaos += 2;
			game.heat += 1;
			game.msg += "BRAIN VIBRATING ";
		}
	},
	{
		name: "SCREAM AT NIGHT",
		hint: "CHAOS+3 NOISE+4",
		run: function(){

			game.chaos += 3;
			game.noise += 4;
			game.msg += "THE BUILDING TREMBLES ";
		}
	},
	{
		name: "EAT MOLD",
		hint: "FOOD+2 | HP-1",
		run: function(){
			if(Math.random() < 0.5){

				game.food += 2;
				game.msg += "GOOD MOLD ";
			}
			else{

				game.hp -= 1;
				game.msg += "BAD MOLD ";
			}
		}
	},
	{
		name: "DIG TUNNEL",
		hint: "SCRAP+1 NEST+1 NOISE+1 | HP+1 | 0",
		run: function(){

			game.scrap += 1;
			game.nest += 1;
			game.noise += 1;
			
			if(Math.random() < 0.3){

				game.msg += "FOUND SECRET SPACE ";
				game.hp += 1;
			}
			else{
				game.msg += "DIRT EVERYWHERE ";
			}
		}
	},
	{
		name: "SPY ON HUMANS",
		hint: "FOOD+2 | SUSPICION+1",
		run: function(){

			if(Math.random() < 0.5){

				game.food += 2;
				game.msg += "LEARNED FOOD TIMES ";
			}
			else{

				game.suspicion += 1;
				game.msg += "HUMAN SAW EYES ";
			}
		}
	},
	{
		name: "SPREAD FILTH",
		hint: "CHAOS+2 NOISE+1",
		run: function(){

			game.chaos += 2;
			game.noise += 1;
			if(Math.random() < 0.4){

				game.msg += "HUMANS BECOME SICK ";
			}
			else{

				game.msg += "SMELLS POWERFUL ";
			}
		}
	},
	{
		name: "DRINK DIRTY WATER",
		hint: "THIRST+3 ROT+1",
		run: function(){

			game.thirst += 3;
			game.rot += 1;
			game.msg += "TASTES LIKE METAL ";
		}
	},
	{
		name: "EAT BUGS",
		hint: "FOOD+2",
		run: function(){

			game.food += 2;
			game.msg += "CRUNCHY ";
		}
	},
	{
		name: "HOARD TRASH",
		hint: "SCRAP+3 STINK+2",
		run: function(){

			game.scrap += 3;
			game.stink += 2;
			game.msg += "PRECIOUS FILTH ";
		}
	},
	{
		name: "RUB AGAINST WIRES",
		hint: "HEAT+2 BRAIN+1",
		run: function(){

			game.heat += 2;
			game.brain += 1;
			game.msg += "STATIC INSIDE SKULL ";
		}
	},
	{
		name: "CHEW BONES",
		hint: "FOOD+1 HP+1",
		run: function(){

			game.food += 1;
			game.hp += 1;
			game.msg += "OLD TASTE ";
		}
	},
	{

		name: "WATCH TV THROUGH WINDOW ",
		hint: "BRAIN+2 CHAOS+1",
		run: function(){

			game.brain += 2;
			game.chaos += 1;
			game.msg += "HUMANS ARE WEAK ";
		}
	},
	{
		name: "GROW FUNGUS",
		hint: "FUNGUS+2 STINK+1",
		run: function(){

			game.fungus += 2;
			game.stink += 1;
			game.msg += "WALLS BECOME SOFT ";
		}
	},
	{
		name: "SCRATCH SYMBOLS",
		hint: "CHAOS+2 BRAIN+1",
		run: function(){
			
			game.chaos += 2;
			game.brain += 1;
			game.msg += "THE SYMBOLS MOVE ";
		}
	},
	{
		name: "BITE HUMAN",
		hint: "FOOD+4 CHAOS+3 | HP-2 SUSPICION+3",
		run: function(){

			if(Math.random() < 0.5){
				
				game.food += 4;
				game.chaos += 3;
				game.msg += "WARM BLOOD ";
			}
			else{

				game.hp -= 2;
				game.suspicion += 3;
				game.msg += "HUMAN FOUGHT BACK ";
			}
		}
		},
		{
			name: "SLEEP UNDER ENGINE",
			hint: "HP+2 HEAT+3",
			run: function(){

				game.hp += 2;
				game.heat += 3;
				game.msg += "LOUD SAFE WARM ";
			}
	}
];

var mutations = [
	{
		name: "LONG TEETH",
		gained: false,
		check: function(){

			return game.chaos >= 6;
		},
		apply: function(){

			game.food += 2;
			game.msg += "TEETH KEEP GROWING ";
		}
	},
	{
		name: "NIGHT EYES",
		gained: false,
		check: function(){

			return game.nest >= 3;
		},
		apply: function(){

			game.noise -= 2;
			if(game.noise < 0) game.noise = 0;
			game.msg += "YOU SEE EVERYTHING ";
		}
	},
	{
		name: "METAL STOMACH",
		gained: false,
		check: function(){

			return game.scrap >= 10;
		},
		apply: function(){

			game.hp += 3;
			game.msg += "CAN EAT NAILS NOW ";
		}
	},
	{
		name: "MANY EYES",
		gained: false,
		check: function(){

			return game.brain >= 15;
		},
		apply: function(){

			game.hp += 1;
			game.msg += "SEE THROUGH WALLS ";
		}
	},
	{
		name: "PIPE LUNGS",
		gained: false,
		check: function(){

			return game.rot >= 10;
		},
		apply: function(){

			game.thirst += 5;
			game.msg += "BREATHE WATER ";
		}
	},
	{
		name: "MOLD SKIN",
		gained: false,
		check: function(){

			return game.fungus >= 12;
		},
		apply: function(){

			game.hp += 3;
			game.msg += "SKIN BECOMES CARPET ";
		}
	},
	{
		name: "HOT BLOOD",
		gained: false,
		check: function(){

			return game.heat >= 10;
		},
		apply: function(){

			game.brain += 3;
			game.msg += "HEART GLOWS ";
		}
	},
	{
		name: "HOLLOW STOMACH",
		gained: false,
		check: function(){

			return game.food <= 0 && game.day > 10;
		},
		apply: function(){

			game.hp += 2;
			game.msg += "NO LONGER NEED FOOD ";
		}
	}
];

function randomEvent(){

	var r = Math.random();
	if(r < 0.1){

		game.hp--;
		game.msg += " EXTERMINATOR GAS ";
	}
	else if(r < 0.2){

		game.food += 3;
		game.msg += " TRASH OVERFLOW ";
	}
	else if(r < 0.3){

		game.noise += 2;
		game.msg += " RIVAL GOBLIN SHRIEKS ";
	}
	else if(r < 0.4){

		game.chaos += 2;
		game.msg += " POWER GRID FAILING ";
	}
}

function checkMutations(){

	for(var i = 0; i < mutations.length; i++){

		var m = mutations[i];
		if(!m.gained && m.check()){

		m.gained = true;
		m.apply();
		}
	}
}

function drawMutations(){

	var s = "           ";
	for(var i = 0; i < mutations.length; i++){

		if(mutations[i].gained){
		
		s += "[" + mutations[i].name + "] ";
		}
	}
	s += "\n";
	return s;
}

function moveLocation(dir){

	game.location += dir;
	if(game.location < 0){

		game.location = locations.length - 1;
	}
	if(game.location >= locations.length){

		game.location = 0;
	}
	dirty = true;
	game.sel = 0;
}

function availableLocations(){

	var s = [];
	s.push(locations[game.location + 1 % locations.length]);
	s.push(locations[game.location - 1 % locations.length]);
	return s;
}

function availableActions(){

	var location = locations[game.location];
	var names = location.actions;
	var list = [];
	for(var i = 0; i < actions.length; i++){

		if(names.indexOf(actions[i].name) !== -1){
		list.push(actions[i]);
		}
	}
	return list;
}

function next(){

	var list = availableActions();
	game.sel++;
	if(game.sel >= list.length){

		game.sel = 0;
	}
	dirty = true;
}

function prev(){

	var list = availableActions();
	game.sel--;
	if(game.sel < 0){

		game.sel = list.length - 1;
	}
	dirty = true;
}

function ok(){

	if(game.over){

		restart();
		return;
	}
	var list = availableActions();
	list[game.sel].run();
	game.day++;
	if(random(0, 100) < 40){

		randomEvent();
	}
	survivalTick();
	checkMutations();
	updateBuildingState();
	if(game.hp <= 0){
		
		game.over = true;
		// display.setCursor(0, 0);
		display.fill(BRUCE_BGCOLOR);
	}
	display.setTextSize(3);
	checkWinLose();
	dirty = true;
}

function drawBar(v, max){
	
	var s = "";
	for(var i = 0; i < max; i++){
		
		s += i < v ? "#" : "-";
	}
	return s;
}

function drawMode(){

	display.setCursor(280, 0);
	display.setTextSize(2);
	if(game.selAction) display.println("ACT");
	else display.println("MOV");
}

function draw(isItEasy){
	
	display.fill(BRUCE_BGCOLOR);
	drawMode();
	display.setCursor(0, 0);
	display.setTextColor(BRUCE_PRICOLOR);
	var s = "";
	var list = availableActions();
	display.setTextSize(2);
	s += " DAY " + game.day + " ";
	s += "[" + locations[game.location].name + "]\n\n";
	display.println(s);
	display.setTextSize(1);
	display.setCursor(0, 20);
	var mutation = drawMutations();
	// s = "";
	s =  "   HP     " + drawBar(game.hp, 10) + game.hp + (game.hp > 9 ? "" : " ") + " |      | HEAT   " + drawBar(game.heat, 10) + game.heat + "\n";
	s += "   FOOD   " + drawBar(game.food, 10) + game.food + (game.food > 9 ? "" : " ") + " |DANGER| ROT    " + drawBar(game.rot, 10) + game.rot + "\n";
	s += "   WATER  " + drawBar(game.thirst, 10) + game.thirst + (game.thirst > 9 ? "" : " ") + " |      | STINK  " + drawBar(game.stink, 10) + game.stink + "\n";;
	s += "   BRAIN  " + drawBar(game.brain, 10) + game.brain + (game.brain > 9 ? "" : " ") + " | ";
	display.print(s);
	switch(game.buildingState){
		
		case 0:
				
			display.setTextColor(2016);
			display.print("#");
			display.setTextColor(65535);
			display.print("###");
			break;
			
		case 1:
			
			display.setTextColor(19666);
			display.print("##");
			display.setTextColor(65535);
			display.print("##");
			break;
			
		case 2:
			
			display.setTextColor(65504);
			display.print("###");
			display.setTextColor(65535);
			display.print("#");
			break;

		case 3:
			
			display.setTextColor(63488);
			display.print("####");
			break;
	}
	display.setTextColor(BRUCE_PRICOLOR);
	s = " | CHAOS  " + drawBar(game.chaos / 2, 10) + game.chaos + "\n";
	s += "   SCRAP  " + drawBar(game.scrap, 10) + game.scrap + (game.scrap > 9 ? "" : " ") + " |      | NOISE  " + drawBar(game.noise, 10) + game.noise + "\n";
	s += "   NEST   " + drawBar(game.nest, 10) + game.nest + (game.nest > 9 ? "" : " ") + " |      | FUNGUS " + drawBar(game.fungus, 10) + game.fungus + "\n";
	if(mutation) s += mutation;
	else s += "\n";
	display.println(s);
	display.setTextSize(1);
	s = "";
	for(var i = 0; i < list.length; i++){
		
		s += (i === game.sel ? " > " : "   ");
		s += ((isItEasy && i === game.sel) ? list[i].hint : list[i].name) + "\n";
	}
	display.println(s);
	s = "\n";	
	if(!game.over){

		s += "\n" + game.msg;
		game.msg = "";
	}
	else{
		
		display.setTextSize(2);
		
		s = "   GOBLIN DIES";
	}
	display.setTextSize(1);
	display.setCursor(20, 125);
	display.println(s);
	dirty = false;
}

function survivalTick(){

	game.food--;
	game.thirst--;
	if(game.food <= 0){

		game.food = 0;
		game.hp--;
		game.msg += "HUNGRY ";
	}
	if(game.thirst <= 0){

		game.thirst = 0;
		game.hp--;
		game.msg += "DRY MOUTH ";
	}
	if(game.heat >= 8){

		game.hp--;
		game.brain++;
		game.msg += "FEVER VISIONS ";
	}
	if(game.rot >= 10){

		game.hp--;
		game.msg += "ORGANS ITCH ";
	}
	if(game.stink >= 8){

		game.suspicion += 2;
		game.msg += "HUMANS SMELL YOU ";
	}
	if(game.brain >= 12){

		game.chaos += 2;
		game.msg += "TOO MANY THOUGHTS ";
	}
	if(game.fungus >= 10){

		game.hp++;
		game.msg += "FUNGUS LOVES YOU ";
	}
}

function checkWinLose(){

	if(game.hp <= 0){

		game.over = true;
		game.msg = "GOBLIN DIES";
		return;
	}
	if(game.food >= 0 && game.chaos >= 20 && game.nest >= 5 && game.buildingState === 3){

		game.over = true;
		game.msg = "THE BUILDING COLLAPSES. YOU ESCAPE.";
		return;
	}
	if(game.buildingState === 2 && game.suspicion >= 10){

		game.hp -= 2;
		game.msg = "LOCKDOWN. HUNTERS CLOSE IN.";
	}
	if(game.buildingState === 3 && Math.random() < 0.3){

		game.hp -= 1;
		game.msg = "STRUCTURE FAILING AROUND YOU";
	}
}

function updateBuildingState(){

	var score = game.chaos + Math.floor(game.noise / 2) + game.suspicion;
	if (score >= 25) game.buildingState = 3;
	else if (score >= 18) game.buildingState = 2;
	else if (score >= 10) game.buildingState = 1;
	else game.buildingState = 0;
}

function handleInput(){
    
    if(ESC_KEY()){
        
		if(checkIfHeld(ESC_KEY, true)) doRun = false;
		else if(game.over) ok();
		else game.selAction = !game.selAction;
		dirty = true;
    }
    if(keyboard.getNextPress()){
        
		if(!game.over){
			
			if(game.selAction){

				next();
			}
			else{
		
				moveLocation(1);
			}
		}
	}
    if(keyboard.getPrevPress()){
		
		if(!game.over){
			
			if(game.selAction){

				prev();
			}
			else{

				moveLocation(-1);
			}
		}
    }
    if(keyboard.getSelPress()){
        
        ok();
    }
}

function checkIfHeld(whatKey, showTimer){

	var start = now();
	var lastEvent = start;
	var lastUpdate = 0;
	var fireOnce = true;
	while(true){

		var held = lastEvent - start
		if(whatKey()){

			lastEvent = now();
		}

		if(now() - lastEvent > HOLD_TIMEOUT){

			break;
		}
		if(showTimer){

			if(fireOnce && held > 200){

				printWithRect("QUITTING3", 200, 0, DISP_WIDTH, 20);
				fireOnce = false;
			}
			var secondsElapsed = Math.floor(held/1000);
			if(secondsElapsed !== lastUpdate){
				
				printWithRect(-(secondsElapsed - 3), 300, 0, 200, 0, DISP_WIDTH, 20);
				lastUpdate += 1;
			}
			if(held >= CHARGE_TIME) break;
		}
	}
	var total = lastEvent - start;
	if(total >= CHARGE_TIME) return true;
	else return false;
}

function printWithRect(what, curX, curY, x, y, w, h, c, t){

	if(t === undefined) t = 2;
	if(c === undefined) c = BRUCE_BGCOLOR;
	display.setCursor(curX, curY);
	display.setTextSize(t);
	display.drawFillRect(x, y,w, h, c);
	display.println(what);
}

function splashScreen(){

	display.drawFillRect(0, 0, 320, 170, BRUCE_BGCOLOR);
	display.drawFillTriangle(55,65, 15,35, 55,100, 1024);
	display.drawFillTriangle(265,65, 305,35, 265,100, 1024);
	display.drawTriangle(55,65, 15,35, 55,100, 1536);
	display.drawTriangle(265,65, 305,35, 265,100, 1536);
	display.drawFillRoundRect(55, 25, 210, 110, 28, 1024);
	display.drawRoundRect(55, 25, 210, 110, 28, 49120);
	display.drawArc(110,55,18,16,200,340,0,1024,true);
	display.drawArc(160,50,20,18,200,340,0,1024,true);
	display.drawArc(210,55,18,16,200,340,0,1024,true);
	display.drawFillCircle(110,75,18,65535);
	display.drawFillCircle(210,75,18,65535);
	display.drawCircle(110,75,18,0);
	display.drawCircle(210,75,18,0);
	display.drawFillCircle(114,78,8,63488);
	display.drawFillCircle(214,78,8,63488);
	display.drawFillCircle(116,76,3,65535);
	display.drawFillCircle(216,76,3,65535);
	display.drawLine(82,58,128,68,0);
	display.drawLine(192,68,238,58,0);
	display.drawLine(82,59,128,69,0);
	display.drawLine(192,69,238,59,0);
	display.drawFillTriangle(160,82, 145,110, 175,110, 23488);
	display.drawTriangle(160,82, 145,110, 175,110, 0);
	display.drawFillCircle(152,108,2,0);
	display.drawFillCircle(168,108,2,0);
	display.drawArc(160,145,38,35,100,260,0,1024,true);
	display.drawFillTriangle(135,118, 143,118, 139,130, 65535);
	display.drawFillTriangle(177,118, 185,118, 181,130, 65535);
	display.drawTriangle(135,118, 143,118, 139,130, 0);
	display.drawTriangle(177,118, 185,118, 181,130, 0);
	display.drawLine(225,90,245,110,63488);
	display.drawLine(230,88,250,108,63488);
	display.drawFillCircle(85,108,4,23488);
	display.drawFillCircle(95,115,2,0);
	display.drawFillCircle(235,45,3,23488);
	display.drawPixel(236,44,0);
	display.setTextColor(BRUCE_PRICOLOR);
	while(true){

		if(keyboard.getAnyPress()) break;
	}
}

function modeChoice(){

	var modeChosen = dialog.choice({"EASY": "easy", "NORMAL": "normal", "RANDOM": "random"});
	if(modeChosen === "easy") return 0;
	else if(modeChosen === "normal") return 1;
	else if(modeChosen === "random") return 2;
	else doRun = false;
}

function initGame(modeChosen){

	if(modeChosen === 0){

		game.day = 1;
		game.showHints = true;
		game.hp = 9;
		game.food = 6;
		game.brain = 5;
		game.thirst = 6;
		game.diffLevel = 0;
		game.scrap = 0;
		game.noise = 0;
		game.chaos = 0;
		game.heat = 0;
		game.nest = 0;
		game.rot = 0;
		game.stink = 0;
		game.fungus = 0;
		game.buildingState = 0;
		game.suspicion = 0;
		game.msg = "";
		game.over = false;
	}
	else if(modeChosen === 1){
		
		game.day = 1;
		game.showHints = false;
		game.hp = 6;
		game.food = 5;
		game.brain = 4;
		game.thirst = 5;
		game.diffLevel = 1;
		game.scrap = 0;
		game.noise = 0;
		game.chaos = 0;
		game.heat = 0;
		game.nest = 0;
		game.rot = 0;
		game.stink = 0;
		game.fungus = 0;
		game.buildingState = 0;
		game.suspicion = 0;
		game.msg = "";
		game.over = false;
	}
	else if(modeChosen === 2){
		
		game.day = 1;
		game.showHints = false;
		game.hp = random(4, 9);
		game.food = random(4, 7);
		game.brain = random(4, 7);
		game.thirst = random(4, 7);
		game.scrap = random(0, 3);
		game.noise = random(0, 3);
		game.chaos = random(0, 3);
		game.heat = random(0, 3);
		game.nest = random(0, 3);
		game.rot = random(0, 3);
		game.brain = random(0, 3);
		game.stink = random(0, 3);
		game.fungus = random(0, 3);
		game.suspicion = random(0, 3);
		game.diffLevel = 2;
		game.buildingState = 0;
		game.msg = "";
		game.over = false;
	}
}

function main(){

	var lastUpdate = now();
	var easySwitcher = false;
	splashScreen();
	initGame(modeChoice());
	while(doRun){
		
		if(now() - lastUpdate >= EASY_ACTION_MS && game.showHints === true){

			lastUpdate = now();
			easySwitcher = !easySwitcher;
			dirty = true;
		}
		handleInput();
		if(dirty){
			
			draw(easySwitcher);
		}
	}
}
main();
splashScreen();