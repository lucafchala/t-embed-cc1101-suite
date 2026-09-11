// ============================================================================
//  Snake  -  Bruce / LilyGO T-Embed CC1101
//  Rotary control: rotate = turn left/right (relative), click = pause, ESC = menu.
//  Levels change the snake color + speed and add obstacles. Persistent top-5
//  high scores saved to /snake_scores.json.
// ============================================================================

// --- UI ---------------------------------------------------------------------
function C(r,g,b){ return display.color(r,g,b); }
var CW=C(255,255,255), CGY=C(140,140,140), CB=C(80,160,255), CY=C(255,200,0),
    CG=C(0,255,90), CR=C(255,60,60), BG=C(0,0,0), HUDBG=C(18,20,34);
function W(){ return display.width(); }
function H(){ return display.height(); }
function clear(){ display.fill(BG); }
function at(x,y,t,col){ display.setTextColor(col); display.drawString(""+t,x,y); }
function purgeKeys(){ for (var i=0;i<6;i++){ keyboard.getAnyPress(); delay(8); } }

var SNAKE_COLORS=[C(0,255,90),C(0,220,255),C(255,220,0),C(255,90,220),
                  C(255,140,0),C(150,120,255),C(255,70,70),C(140,255,140)];

// --- grid geometry ----------------------------------------------------------
var CELL=8, GY=15;
var COLS=Math.floor(W()/CELL), ROWS=Math.floor((H()-GY)/CELL);

// --- persistent scores ------------------------------------------------------
var SCORE_FILE="/snake_scores.json";
function loadScores(){
  try { var t=storage.read(SCORE_FILE); var a=JSON.parse(""+t); return (a&&a.length)?a:[]; }
  catch(e){ return []; }
}
function saveScores(a){ try { storage.write(SCORE_FILE, JSON.stringify(a), "write"); } catch(e){} }  // "write" = overwrite!
function bestScore(sc){ return (sc.length? sc[0].score : 0); }

// --- drawing helpers --------------------------------------------------------
function cellRect(cx,cy,col){ display.drawFillRect(cx*CELL+1, GY+cy*CELL+1, CELL-2, CELL-2, col); }
function cellClear(cx,cy){ display.drawFillRect(cx*CELL, GY+cy*CELL, CELL, CELL, BG); }
function drawFood(f,col){ display.drawFillCircle(f.x*CELL+Math.floor(CELL/2), GY+f.y*CELL+Math.floor(CELL/2), Math.floor(CELL/2)-1, col); }
function drawObst(o){ display.drawFillRect(o.x*CELL, GY+o.y*CELL, CELL, CELL, C(90,90,110)); }

function drawHUD(score, level, best, speed){
  display.drawFillRect(0,0,W(),GY-1,HUDBG);
  at(4,4,"SCORE "+score, CW);
  at(120,4,"LV "+level, CY);
  at(W()-96,4,"best "+best, CGY);
}

// --- game -------------------------------------------------------------------
function occupied(snake, x, y){
  for (var i=0;i<snake.length;i++) if (snake[i].x===x && snake[i].y===y) return true;
  return false;
}
function isObst(obst, x, y){
  for (var i=0;i<obst.length;i++) if (obst[i].x===x && obst[i].y===y) return true;
  return false;
}
function randFree(snake, obst, food){
  for (var tries=0; tries<400; tries++){
    var x=Math.floor(Math.random()*COLS), y=Math.floor(Math.random()*ROWS);
    if (occupied(snake,x,y)) continue;
    if (isObst(obst,x,y)) continue;
    if (food && food.x===x && food.y===y) continue;
    return {x:x, y:y};
  }
  return {x:0, y:0};
}

function playGame(scores){
  var snake=[{x:Math.floor(COLS/2), y:Math.floor(ROWS/2)}];
  var dir=1, turnQ=[];                      // 0=up 1=right 2=down 3=left
  var DX=[0,1,0,-1], DY=[-1,0,1,0];
  var obst=[], food, score=0, level=1, apples=0;
  var speed=180, best=bestScore(scores);
  var FOOD_PER_LEVEL=4;
  food=randFree(snake,obst,null);

  function color(){ return SNAKE_COLORS[(level-1)%SNAKE_COLORS.length]; }
  function addObstacles(target){
    while (obst.length<target){ var c=randFree(snake,obst,food); obst.push(c); drawObst(c); }
  }
  function redraw(){
    clear();
    for (var i=0;i<obst.length;i++) drawObst(obst[i]);
    var col=color();
    for (var s=0;s<snake.length;s++) cellRect(snake[s].x, snake[s].y, col);
    drawFood(food, CR);
    drawHUD(score, level, best, speed);
  }
  function levelToast(){
    display.drawFillRect(W()/2-46, H()/2-14, 92, 28, C(0,0,0));
    display.drawRect(W()/2-46, H()/2-14, 92, 28, color());
    display.setTextSize(2); at(W()/2-40, H()/2-8, "LEVEL "+level, color()); display.setTextSize(1);
    delay(650);
  }

  redraw();
  purgeKeys();
  var last=Date.now(), paused=false;

  while (true){
    // ---- input ----
    if (keyboard.getPrevPress()){ if (turnQ.length<3) turnQ.push(-1); }
    else if (keyboard.getNextPress()){ if (turnQ.length<3) turnQ.push(1); }
    else if (keyboard.getSelPress()){
      paused=!paused;
      if (paused){ display.setTextSize(2); at(W()/2-42, H()/2-8, "PAUSED", CW); display.setTextSize(1); }
      else redraw();
    }
    else if (keyboard.getEscPress()){ return {score:score, quit:true}; }

    if (paused){ delay(40); continue; }

    // ---- tick ----
    var now=Date.now();
    if (now-last >= speed){
      last=now;
      if (turnQ.length) dir=(dir + turnQ.shift() + 4) % 4;
      var nx=snake[0].x+DX[dir], ny=snake[0].y+DY[dir];

      // collision: wall / obstacle / self (tail moves away unless eating)
      var eating=(nx===food.x && ny===food.y);
      var hitSelf=false;
      for (var i=0;i<snake.length-(eating?0:1);i++) if (snake[i].x===nx && snake[i].y===ny){ hitSelf=true; break; }
      if (nx<0||nx>=COLS||ny<0||ny>=ROWS || isObst(obst,nx,ny) || hitSelf){
        return {score:score, quit:false};
      }

      snake.unshift({x:nx, y:ny});
      cellRect(nx, ny, color());
      if (eating){
        score+=10; apples++;
        food=randFree(snake,obst,null); drawFood(food, CR);
        drawHUD(score, level, best, speed);
        if (apples % FOOD_PER_LEVEL === 0){
          level++; speed=Math.max(60, 180-(level-1)*15);
          if (level>=3) addObstacles(Math.min(14,(level-2)*2));
          levelToast(); redraw();
        }
      } else {
        var tail=snake.pop(); cellClear(tail.x, tail.y);
      }
    }
    delay(12);
  }
}

// --- game over + high score entry -------------------------------------------
function gameOver(score, scores){
  var qualifies = score>0 && (scores.length<5 || score>scores[scores.length-1].score);
  var isBest = score>0 && score>bestScore(scores);
  if (qualifies){
    var nm = keyboard.keyboard("", 3, "New high score! Initials");
    nm = (nm && nm.length)? (""+nm).substring(0,3).toUpperCase() : "YOU";
    scores.push({name:nm, score:score});
    scores.sort(function(a,b){ return b.score-a.score; });
    if (scores.length>5) scores.length=5;
    saveScores(scores);
  }
  clear();
  display.setTextSize(3); at(W()/2-84, 24, "GAME OVER", CR); display.setTextSize(1);
  display.setTextSize(2);
  at(W()/2-54, 66, "Score "+score, CW);
  if (isBest) at(W()/2-60, 92, "NEW BEST!", CY);
  display.setTextSize(1);
  at(W()/2-78, H()-16, "click = retry    ESC = menu", CGY);
  purgeKeys();
  while (true){
    if (keyboard.getSelPress()) return "retry";
    if (keyboard.getEscPress()) return "menu";
    delay(40);
  }
}

// --- high scores screen -----------------------------------------------------
function showScores(scores){
  clear();
  display.setTextSize(2); at(6,6,"High Scores",CB); display.setTextSize(1);
  display.drawFastHLine(0,28,W(),CGY);
  if (!scores.length) at(6,44,"no scores yet - go play!",CGY);
  else for (var i=0;i<scores.length;i++){
    var y=40+i*20;
    at(20,y, (i+1)+".", CY);
    at(60,y, scores[i].name, CW);
    at(W()-120,y, ""+scores[i].score, CG);
  }
  at(6,H()-14,"any key = back",CGY);
  purgeKeys(); while(true){ if (keyboard.getAnyPress()) break; delay(60); }
}

// --- menu -------------------------------------------------------------------
function icoPlay(x,y,col){ display.drawFillTriangle(x+1,y,x+1,y+12,x+12,y+6,col); }
function icoTrophy(x,y,col){ display.drawFillRect(x+2,y,9,6,col); display.drawFastVLine(x+6,y+6,3,col); display.drawFastHLine(x+2,y+10,9,col); }
function icoQuit(x,y,col){ display.drawCircle(x+6,y+7,5,col); display.drawFastVLine(x+6,y+1,6,col); }
function drawIcon(k,x,y,col){ if(k==="play")icoPlay(x,y,col); else if(k==="trophy")icoTrophy(x,y,col); else if(k==="quit")icoQuit(x,y,col); }

function menu(scores){
  var rows=[{ic:"play",s:"Play"},{ic:"trophy",s:"High Scores"},{ic:"quit",s:"Quit"}];
  var sel=0, dirty=true; purgeKeys();
  while(true){
    if (dirty){
      clear();
      display.setTextSize(3); at(W()/2-60,14,"SNAKE",CG); display.setTextSize(1);
      at(W()/2-48,48,"best: "+bestScore(scores),CGY);
      for (var i=0;i<rows.length;i++){
        var y=76+i*22;
        if (i===sel){ display.drawFillRoundRect(W()/2-80,y-3,160,20,3,CB); drawIcon(rows[i].ic,W()/2-72,y,C(0,0,0)); at(W()/2-52,y+2,rows[i].s,C(0,0,0)); }
        else { drawIcon(rows[i].ic,W()/2-72,y,CW); at(W()/2-52,y+2,rows[i].s,CW); }
      }
      at(6,H()-12,"rotate=move  OK=select  ESC=quit",CGY);
      dirty=false;
    }
    if (keyboard.getPrevPress()){ sel=(sel+rows.length-1)%rows.length; dirty=true; }
    else if (keyboard.getNextPress()){ sel=(sel+1)%rows.length; dirty=true; }
    else if (keyboard.getSelPress()) return sel;
    else if (keyboard.getEscPress()) return 2;
    delay(40);
  }
}

// --- main -------------------------------------------------------------------
function main(){
  var scores=loadScores();
  while (true){
    var m=menu(scores);
    if (m===2) return;                       // Quit
    if (m===1){ showScores(scores); continue; }
    // Play (with retry loop)
    while (true){
      var r=playGame(scores);
      var next=gameOver(r.score, scores);
      if (next==="menu") break;              // back to menu
      // "retry" -> loop again
    }
  }
}

main();
