// ============================================================================
//  Breakout  -  Bruce / LilyGO T-Embed CC1101
//  Rotary control: rotate = move paddle, click = launch / pause, ESC = menu.
//  Levels change layout + color + speed. Power-ups (Expand / Multi / Slow /
//  Life) drop from bricks. Persistent top-5 high scores on the SD.
// ============================================================================

// --- UI ---------------------------------------------------------------------
function C(r,g,b){ return display.color(r,g,b); }
var CW=C(255,255,255), CGY=C(140,140,140), CB=C(80,160,255), CY=C(255,200,0),
    CG=C(0,255,90), CR=C(255,70,70), BG=C(0,0,0), HUDBG=C(18,20,34), PAD=C(90,200,255);
function W(){ return display.width(); }
function H(){ return display.height(); }
function clear(){ display.fill(BG); }
function at(x,y,t,col){ display.setTextColor(col); display.drawString(""+t,x,y); }
function purgeKeys(){ for (var i=0;i<6;i++){ keyboard.getAnyPress(); delay(8); } }
function clampf(v,a,b){ return v<a?a:(v>b?b:v); }

// --- geometry ---------------------------------------------------------------
var HUD=13, COLS=10, ROWS=6;
var BW=Math.floor(W()/COLS), BH=9, BTOP=HUD+6;
var PADY=H()-9, PADH=4, BASEPW=36, BALLR=2;
var ROWCOL=[C(255,70,70),C(255,140,0),C(255,210,0),C(0,220,90),C(0,200,255),C(180,120,255)];

// --- persistent scores ------------------------------------------------------
var SFILE="/breakout_scores.json";
function loadScores(){ try { var t=storage.read(SFILE); var a=JSON.parse(""+t); return (a&&a.length)?a:[]; } catch(e){ return []; } }
function saveScores(a){ try { storage.write(SFILE, JSON.stringify(a), "write"); } catch(e){} }  // "write"=overwrite
function bestScore(s){ return s.length? s[0].score : 0; }

// --- drawing ----------------------------------------------------------------
function drawHUD(score, lives, level, best){
  display.drawFillRect(0,0,W(),HUD-1,HUDBG);
  at(3,3,"SC "+score,CW); at(96,3,"LV "+level,CY);
  at(150,3,"best "+best,CGY);
  for (var i=0;i<lives;i++) display.drawFillCircle(W()-10-i*10,6,3,CR);
}
function brickRect(r,c){ return {x:c*BW+1, y:BTOP+r*BH+1, w:BW-2, h:BH-2}; }
function drawBrick(r,c,st){ var q=brickRect(r,c), col=ROWCOL[r%ROWCOL.length];
  display.drawFillRect(q.x,q.y,q.w,q.h,col); if (st>1) display.drawRect(q.x,q.y,q.w,q.h,CW); }
function eraseBrick(r,c){ var q=brickRect(r,c); display.drawFillRect(q.x-1,q.y-1,q.w+2,q.h+2,BG); }

// --- level layout -----------------------------------------------------------
function makeLevel(level){
  var g=[], pat=level%4;
  for (var r=0;r<ROWS;r++){ g.push([]);
    for (var c=0;c<COLS;c++){
      var on=true;
      if (pat===1) on=((r+c)%2===0);                 // checker
      else if (pat===2) on=(c>=r && c<COLS-r);        // pyramid
      else if (pat===3) on=(r%2===0)||(c%3!==0);      // stripes+gaps
      var st = (on && level>=3 && r<2 && Math.random()<0.4) ? 2 : (on?1:0);   // tough bricks up top
      g[r].push(st);
    }
  }
  return g;
}
function countBricks(g){ var n=0; for (var r=0;r<ROWS;r++) for (var c=0;c<COLS;c++) if (g[r][c]>0) n++; return n; }

// --- game -------------------------------------------------------------------
function playGame(scores){
  var best=bestScore(scores), score=0, lives=3, level=1;
  var grid, alive, px, pw, balls, tokens, slowUntil, speed;

  function newLevel(){
    grid=makeLevel(level); alive=countBricks(grid);
    speed=2.0 + (level-1)*0.35;
    pw=BASEPW; px=Math.round((W()-pw)/2);
    balls=[ serveBall() ]; tokens=[]; slowUntil=0;
    clear(); drawHUD(score,lives,level,best);
    for (var r=0;r<ROWS;r++) for (var c=0;c<COLS;c++) if (grid[r][c]>0) drawBrick(r,c,grid[r][c]);
    drawPaddle();
  }
  function serveBall(){ return { x:px+pw/2, y:PADY-BALLR-1, vx:0, vy:0, stuck:true }; }
  function drawPaddle(){ display.drawFillRoundRect(px,PADY,pw,PADH,2,PAD); }
  function erasePaddle(){ display.drawFillRect(px-1,PADY-1,pw+2,PADH+2,BG); }
  function drawBall(b){ display.drawFillCircle(Math.round(b.x),Math.round(b.y),BALLR,CW); }
  function eraseBall(b){ display.drawFillRect(Math.round(b.x)-BALLR-1,Math.round(b.y)-BALLR-1,2*BALLR+3,2*BALLR+3,BG); }

  var TOKCOL={E:CG,M:CY,S:CB,L:C(255,90,200)};
  function drawTok(t){ display.drawFillRect(t.x-4,Math.round(t.y)-4,9,9,TOKCOL[t.k]); at(t.x-3,Math.round(t.y)-3,t.k,C(0,0,0)); }
  function eraseTok(t){ display.drawFillRect(t.x-5,Math.round(t.y)-5,11,11,BG); }

  function launch(){ for (var i=0;i<balls.length;i++){ var b=balls[i]; if (b.stuck){ b.stuck=false; b.vx=speed*0.4; b.vy=-speed; } } }
  function hitBrick(b){
    if (b.y<BTOP || b.y>BTOP+ROWS*BH) return false;
    var c=Math.floor(b.x/BW), r=Math.floor((b.y-BTOP)/BH);
    if (r<0||r>=ROWS||c<0||c>=COLS) return false;
    if (grid[r][c]<=0) return false;
    grid[r][c]--;
    if (grid[r][c]<=0){ eraseBrick(r,c); alive--; score+=10*level; drawHUD(score,lives,level,best);
      if (Math.random()<0.12){ var ks="EMSL", k=ks.charAt(Math.floor(Math.random()*4)); tokens.push({x:c*BW+Math.floor(BW/2), y:BTOP+r*BH, k:k}); }
    } else { drawBrick(r,c,grid[r][c]); }
    b.vy=-b.vy; return true;
  }
  function applyTok(k){
    if (k==="E"){ erasePaddle(); pw=Math.min(70,pw+14); px=clampf(px,0,W()-pw); drawPaddle(); }
    else if (k==="L"){ lives++; drawHUD(score,lives,level,best); }
    else if (k==="S"){ slowUntil=Date.now()+8000; }
    else if (k==="M"){ var add=[]; for (var i=0;i<balls.length && balls.length+add.length<3;i++){ var b=balls[i]; if(!b.stuck) add.push({x:b.x,y:b.y,vx:-b.vx,vy:b.vy,stuck:false}); } for (var j=0;j<add.length;j++) balls.push(add[j]); }
  }

  newLevel(); purgeKeys();
  var last=Date.now(), paused=false;

  while(true){
    // ---- input ----
    if (keyboard.getPrevPress()){ erasePaddle(); px=clampf(px-12,0,W()-pw); drawPaddle(); }
    else if (keyboard.getNextPress()){ erasePaddle(); px=clampf(px+12,0,W()-pw); drawPaddle(); }
    else if (keyboard.getSelPress()){ launch(); }
    else if (keyboard.getEscPress()){ return {score:score, quit:true}; }

    var now=Date.now();
    if (now-last < 16){ delay(4); continue; }
    last=now;
    var sf=(now<slowUntil)?0.6:1.0;

    // ---- move balls ----
    for (var bi=balls.length-1; bi>=0; bi--){
      var b=balls[bi];
      if (b.stuck){ eraseBall(b); b.x=px+pw/2; b.y=PADY-BALLR-1; drawBall(b); continue; }  // follow paddle
      eraseBall(b);
      var steps=Math.max(1, Math.ceil(Math.max(Math.abs(b.vx),Math.abs(b.vy))*sf));
      var dead=false;
      for (var s=0;s<steps && !dead;s++){
        b.x+=b.vx*sf/steps; b.y+=b.vy*sf/steps;
        if (b.x<BALLR){ b.x=BALLR; b.vx=-b.vx; }
        else if (b.x>W()-BALLR){ b.x=W()-BALLR; b.vx=-b.vx; }
        if (b.y<HUD+BALLR){ b.y=HUD+BALLR; b.vy=-b.vy; }
        // paddle
        if (b.vy>0 && b.y+BALLR>=PADY && b.y<PADY+PADH && b.x>=px-2 && b.x<=px+pw+2){
          b.y=PADY-BALLR; var rel=(b.x-(px+pw/2))/(pw/2); b.vy=-Math.abs(b.vy); b.vx=clampf(rel,-1,1)*speed;
          var sp=Math.sqrt(b.vx*b.vx+b.vy*b.vy)||1; b.vx=b.vx/sp*speed; b.vy=b.vy/sp*speed;
        }
        hitBrick(b);
        if (b.y>H()+4){ dead=true; }
      }
      if (dead){ balls.splice(bi,1); continue; }
      drawBall(b);
    }

    // ---- move tokens ----
    for (var ti=tokens.length-1; ti>=0; ti--){
      var t=tokens[ti]; eraseTok(t); t.y+=1.6;
      if (t.y>=PADY-2 && t.y<=PADY+PADH+4 && t.x>=px-4 && t.x<=px+pw+4){ applyTok(t.k); tokens.splice(ti,1); continue; }
      if (t.y>H()){ tokens.splice(ti,1); continue; }
      drawTok(t);
    }

    // ---- states ----
    if (balls.length===0){
      lives--; drawHUD(score,lives,level,best);
      if (lives<=0) return {score:score, quit:false};
      erasePaddle();                                   // erase the OLD paddle first
      pw=BASEPW; px=Math.round((W()-pw)/2);
      drawPaddle(); balls=[serveBall()]; drawBall(balls[0]);
      delay(400); purgeKeys();
    }
    if (alive<=0){
      level++; flash("LEVEL "+level, CG); newLevel(); purgeKeys();
    }
  }
}
function flash(msg,col){ display.drawFillRect(W()/2-52,H()/2-12,104,24,C(0,0,0)); display.drawRect(W()/2-52,H()/2-12,104,24,col);
  display.setTextSize(2); at(W()/2-46,H()/2-6,msg,col); display.setTextSize(1); delay(700); }

// --- game over --------------------------------------------------------------
function gameOver(score, scores){
  var qualifies = score>0 && (scores.length<5 || score>scores[scores.length-1].score);
  var isBest = score>0 && score>bestScore(scores);
  if (qualifies){
    var nm=keyboard.keyboard("",3,"New high score! Initials");
    nm=(nm&&nm.length)?(""+nm).substring(0,3).toUpperCase():"YOU";
    scores.push({name:nm,score:score}); scores.sort(function(a,b){return b.score-a.score;});
    if (scores.length>5) scores.length=5; saveScores(scores);
  }
  clear();
  display.setTextSize(3); at(W()/2-84,26,"GAME OVER",CR); display.setTextSize(1);
  display.setTextSize(2); at(W()/2-54,70,"Score "+score,CW);
  if (isBest) at(W()/2-60,96,"NEW BEST!",CY); display.setTextSize(1);
  at(W()/2-78,H()-15,"click = retry    ESC = menu",CGY);
  purgeKeys(); while(true){ if (keyboard.getSelPress()) return "retry"; if (keyboard.getEscPress()) return "menu"; delay(40); }
}

// --- high scores ------------------------------------------------------------
function showScores(scores){
  clear(); display.setTextSize(2); at(6,6,"High Scores",CB); display.setTextSize(1);
  display.drawFastHLine(0,28,W(),CGY);
  if (!scores.length) at(6,44,"no scores yet - go play!",CGY);
  else for (var i=0;i<scores.length;i++){ var y=40+i*20; at(20,y,(i+1)+".",CY); at(60,y,scores[i].name,CW); at(W()-120,y,""+scores[i].score,CG); }
  at(6,H()-14,"any key = back",CGY);
  purgeKeys(); while(!keyboard.getAnyPress()) delay(60);
}

// --- menu -------------------------------------------------------------------
function icoPlay(x,y,col){ display.drawFillTriangle(x+1,y,x+1,y+12,x+12,y+6,col); }
function icoTrophy(x,y,col){ display.drawFillRect(x+2,y,9,6,col); display.drawFastVLine(x+6,y+6,3,col); display.drawFastHLine(x+2,y+10,9,col); }
function icoQuit(x,y,col){ display.drawCircle(x+6,y+7,5,col); display.drawFastVLine(x+6,y+1,6,col); }
function drawIcon(k,x,y,col){ if(k==="play")icoPlay(x,y,col); else if(k==="trophy")icoTrophy(x,y,col); else icoQuit(x,y,col); }
function menu(scores){
  var rows=[{ic:"play",s:"Play"},{ic:"trophy",s:"High Scores"},{ic:"quit",s:"Quit"}];
  var sel=0, dirty=true; purgeKeys();
  while(true){
    if (dirty){
      clear(); display.setTextSize(3); at(W()/2-72,12,"BREAKOUT",CB); display.setTextSize(1);
      at(W()/2-48,46,"best: "+bestScore(scores),CGY);
      // decorative bricks
      for (var c=0;c<10;c++) display.drawFillRect(c*32+2,58,28,7,ROWCOL[c%ROWCOL.length]);
      for (var i=0;i<rows.length;i++){ var y=78+i*22;
        if (i===sel){ display.drawFillRoundRect(W()/2-80,y-3,160,20,3,CB); drawIcon(rows[i].ic,W()/2-72,y,C(0,0,0)); at(W()/2-52,y+2,rows[i].s,C(0,0,0)); }
        else { drawIcon(rows[i].ic,W()/2-72,y,CW); at(W()/2-52,y+2,rows[i].s,CW); }
      }
      at(6,H()-11,"rotate=move  OK=select  ESC=quit",CGY); dirty=false;
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
  while(true){
    var m=menu(scores);
    if (m===2) return;
    if (m===1){ showScores(scores); continue; }
    while(true){
      var r=playGame(scores);
      var next=gameOver(r.score, scores);
      if (next==="menu") break;
    }
  }
}
main();
