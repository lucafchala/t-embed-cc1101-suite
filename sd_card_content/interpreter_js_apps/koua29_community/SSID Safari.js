// ============================================================================
//  SSID Safari  -  Bruce / LilyGO T-Embed CC1101
//  Catch the real Wi-Fi networks around you like creatures.
//   - each AP (by BSSID) = a unique, deterministic monster (generative sprite)
//   - TYPE  = encryption (Open/WEP/WPA/WPA3/Enterprise/Hidden)
//   - FAMILY (shape) = vendor OUI of the BSSID (randomized MAC = "Nomad")
//   - RARITY / catch difficulty = signal (RSSI) + type
//   - rotary catch mini-game (lock the ring, throw), persistent Pokedex on SD.
//  Controls: rotate = move/aim, click = select/throw, ESC = back.
// ============================================================================

// --- UI ---------------------------------------------------------------------
function C(r,g,b){ return display.color(r,g,b); }
var CW=C(255,255,255), CGY=C(140,140,140), CB=C(80,160,255), CY=C(255,200,0),
    CG=C(0,255,90), CR=C(255,70,70), BG=C(0,0,0);
function W(){ return display.width(); }
function H(){ return display.height(); }
function clear(){ display.fill(BG); }
function at(x,y,t,col){ display.setTextColor(col); display.drawString(""+t,x,y); }
function header(t){ clear(); display.setTextSize(2); at(6,4,t,CB); display.setTextSize(1); display.drawFastHLine(0,26,W(),CGY); }
function purgeKeys(){ for (var i=0;i<6;i++){ keyboard.getAnyPress(); delay(8); } }
function clampf(v,a,b){ return v<a?a:(v>b?b:v); }

// --- deterministic hash / rng ----------------------------------------------
function hash32(s){ var h=2166136261; for (var i=0;i<s.length;i++){ h=(h^s.charCodeAt(i))>>>0; h=(h*16777619)>>>0; } return h>>>0; }
function rng(seed){ var s=(seed>>>0)||1; return function(){ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

// --- taxonomy ---------------------------------------------------------------
var TYPES = {
  wild:   { name:"Wild",    r:40,g:220,b:110, rar:1, cat:1.25 },
  armor:  { name:"Armor",   r:70,g:150,b:255, rar:2, cat:1.00 },
  ghost:  { name:"Ghost",   r:150,g:150,b:180,rar:3, cat:0.80 },
  fossil: { name:"Fossil",  r:190,g:150,b:80, rar:4, cat:0.60 },
  crystal:{ name:"Crystal", r:200,g:120,b:255,rar:4, cat:0.55 },
  titan:  { name:"Titan",   r:255,g:80,b:80,  rar:5, cat:0.45 }
};
function typeOf(enc, ssid){
  if (!ssid || ssid.length===0) return "ghost";
  if (enc==="OPEN") return "wild";
  if (enc==="WEP") return "fossil";
  if (enc==="ENTERPRISE"||enc==="WPA2_ENTERPRISE"||enc==="WPA3_ENT_192") return "titan";
  if (enc.indexOf("WPA3")>=0) return "crystal";
  return "armor";
}
var FAMILIES = ["blob","spike","bot","bird","bug","golem"];
function isLocalMac(mac){ var b=parseInt(mac.substring(0,2),16); return !isNaN(b) && (b & 2)!==0; }
function familyOf(mac){
  if (isLocalMac(mac)) return "nomad";
  return FAMILIES[hash32(mac.substring(0,8)) % FAMILIES.length];
}
// vendor flavour (small, best-effort) from OUI
var VENDORS = { "Apple":["00:03:93","3C:15:C2","F0:18:98","A4:83:E7","AC:BC:32"],
  "Samsung":["00:12:FB","5C:0A:5B","E8:50:8B"], "TP-Link":["50:C7:BF","A4:2B:B0","EC:08:6B"],
  "Netgear":["20:4E:7F","A0:63:91"], "Free/Freebox":["68:A3:78","F4:CA:E5","8C:97:EA"],
  "Orange":["00:1A:2B","4C:09:B4","84:9C:A6"], "Huawei":["00:E0:FC","48:46:FB","D4:6E:0E"],
  "Cisco":["00:1A:A1","00:1B:D4"], "Xiaomi":["50:8F:4C","64:09:80"] };
function vendorOf(mac){
  var oui=mac.substring(0,8).toUpperCase();
  for (var v in VENDORS){ var a=VENDORS[v]; for (var i=0;i<a.length;i++) if (a[i]===oui) return v; }
  return isLocalMac(mac) ? "Phone hotspot" : "Unknown";
}

// build a creature record from a scan entry
function makeCreature(net){
  var mac=(""+net.MAC).toUpperCase(), ssid=""+(net.SSID||""), rssi=net.RSSI||-95;
  var seed=hash32(mac), t=typeOf(net.encryptionType, ssid), T=TYPES[t];
  var name = ssid.length? (ssid.length>16?ssid.substring(0,16):ssid) : ("Ghost-"+mac.substring(12).split(":").join(""));
  var cp = 40 + (seed % 900) + Math.max(0, rssi+95)*3;
  return { mac:mac, ssid:ssid, name:name, rssi:rssi, type:t, T:T, seed:seed,
           family:familyOf(mac), vendor:vendorOf(mac), cp:cp, rar:T.rar };
}
function catchRate(cr){
  var prox = clampf((cr.rssi+95)/55, 0, 1);        // -95..-40 -> 0..1
  return clampf((0.18 + prox*0.7) * cr.T.cat, 0.05, 0.95);
}

// --- generative creature sprite --------------------------------------------
function shade(T,f){ return C(clampf(T.r*f,0,255), clampf(T.g*f,0,255), clampf(T.b*f,0,255)); }
function tint(T,a){ return C(clampf(T.r+a,0,255), clampf(T.g+a,0,255), clampf(T.b+a,0,255)); }
function drawCreature(cx, cy, s, cr){
  var T=cr.T, R=rng(cr.seed), body=T? C(T.r,T.g,T.b):CW, dk=shade(T,0.55), lt=tint(T,70);
  var fam=cr.family, eyes=1+Math.floor(R()*3), horns=R()<0.5, spots=Math.floor(R()*4);
  function eye(ex,ey,er){ display.drawFillCircle(ex,ey,er,CW); display.drawFillCircle(ex+Math.round(er*0.25),ey,Math.max(1,Math.round(er*0.45)),C(0,0,0)); }
  // feet
  display.drawFillRect(cx-Math.round(s*0.5),cy+Math.round(s*0.7),Math.round(s*0.35),Math.round(s*0.35),dk);
  display.drawFillRect(cx+Math.round(s*0.18),cy+Math.round(s*0.7),Math.round(s*0.35),Math.round(s*0.35),dk);
  if (fam==="bot" || fam==="golem"){
    display.drawFillRect(cx-s,cy-s,2*s,2*s,body); display.drawRect(cx-s,cy-s,2*s,2*s,dk);
    if (fam==="bot"){ display.drawFastVLine(cx,cy-s-Math.round(s*0.5),Math.round(s*0.5),dk); display.drawFillCircle(cx,cy-s-Math.round(s*0.5),2,CY); }
  } else if (fam==="bird"){
    display.drawFillCircle(cx,cy,s,body);
    display.drawFillTriangle(cx-s,cy,cx-Math.round(s*1.7),cy-Math.round(s*0.3),cx-Math.round(s*1.6),cy+Math.round(s*0.4),dk);
    display.drawFillTriangle(cx+s,cy,cx+Math.round(s*1.7),cy-Math.round(s*0.3),cx+Math.round(s*1.6),cy+Math.round(s*0.4),dk);
    display.drawFillTriangle(cx,cy+Math.round(s*0.1),cx+Math.round(s*0.6),cy+Math.round(s*0.4),cx,cy+Math.round(s*0.7),CY); // beak
  } else if (fam==="bug"){
    display.drawFillCircle(cx,cy,s,body);
    for (var L=-1;L<=1;L+=2){ display.drawWideLine(cx+L*s,cy,cx+L*Math.round(s*1.6),cy-Math.round(s*0.5),2,dk); display.drawWideLine(cx+L*s,cy+Math.round(s*0.3),cx+L*Math.round(s*1.6),cy+Math.round(s*0.5),2,dk); }
    display.drawFastHLine(cx-s,cy,2*s,dk);
  } else if (fam==="nomad"){
    display.drawFillTriangle(cx,cy-s,cx-s,cy+s,cx+s,cy+s,body);   // diamond-ish
    for (var w=1;w<=2;w++){ display.drawCircle(cx,cy-Math.round(s*0.2),Math.round(s*(0.5*w)),lt); } // signal waves
  } else { // blob / spike
    display.drawFillCircle(cx,cy,s,body);
  }
  if (fam==="spike" || horns){
    for (var k=-1;k<=1;k++){ var hx=cx+k*Math.round(s*0.6); display.drawFillTriangle(hx-3,cy-s+2,hx+3,cy-s+2,hx,cy-s-Math.round(s*0.5),dk); }
  }
  // belly + spots
  if (fam!=="bot"&&fam!=="golem") display.drawFillCircle(cx,cy+Math.round(s*0.25),Math.round(s*0.55),lt);
  for (var p=0;p<spots;p++){ display.drawFillCircle(cx-s+Math.round(R()*2*s), cy-Math.round(s*0.3)+Math.round(R()*s), 2, dk); }
  // eyes
  var er=Math.max(2,Math.round(s*0.22)), ey=cy-Math.round(s*0.15);
  if (fam==="bot"||fam==="golem"){ if (eyes>=2){ display.drawFillRect(cx-Math.round(s*0.5),ey,er,er,CY); display.drawFillRect(cx+Math.round(s*0.2),ey,er,er,CY);} else display.drawFillRect(cx-er/2,ey,er,er,CY); }
  else if (eyes===1) eye(cx,ey,er+1);
  else if (eyes===2){ eye(cx-Math.round(s*0.35),ey,er); eye(cx+Math.round(s*0.35),ey,er); }
  else { eye(cx-Math.round(s*0.45),ey,er-1); eye(cx,ey-2,er-1); eye(cx+Math.round(s*0.45),ey,er-1); }
}

// --- Pokedex persistence ----------------------------------------------------
var DEX_FILE="/ssid_safari.json";
function loadDex(){ try { var t=storage.read(DEX_FILE); var j=JSON.parse(""+t); return (j&&j.caught)?j:{caught:{}}; } catch(e){ return {caught:{}}; } }
function saveDex(d){ try { storage.write(DEX_FILE, JSON.stringify(d), "write"); } catch(e){} }
function dexCount(d){ var n=0; for (var k in d.caught) n++; return n; }

// --- rarity stars -----------------------------------------------------------
function stars(n){ var s=""; for (var i=0;i<5;i++) s+= i<n?"*":"."; return s; }

// --- catch mini-game (rotary lock + throw) ---------------------------------
function ringPt(cx,cy,r,deg){ var a=deg*Math.PI/180; return {x:cx+Math.round(r*Math.cos(a)), y:cy+Math.round(r*Math.sin(a))}; }
function angDiff(a,b){ var d=Math.abs(a-b)%360; return d>180?360-d:d; }
function catchGame(cr){
  var cx=Math.round(W()*0.34), cy=Math.round(H()*0.48), R=46;
  var cursor=0, target=Math.floor(Math.random()*360);
  var tol=Math.max(14, 40-cr.rar*5), drift=(0.6+cr.rar*0.5)*(Math.random()<0.5?-1:1);
  var balls=3, base=catchRate(cr);
  var BX=cx-R-6, BY=cy-R-6, BW=2*R+12, BH=2*R+12;

  function panel(){
    var X=Math.round(W()*0.66);
    display.drawFillRect(X-4,0,W()-(X-4),H()-16,BG);
    at(X,10,cr.name,C(cr.T.r,cr.T.g,cr.T.b)); at(X,26,cr.T.name+" "+stars(cr.rar),CGY);
    at(X,42,"CP "+cr.cp,CW);
    for (var b=0;b<balls;b++) display.drawFillCircle(X+8+b*14,64,5,CR);
    at(X,84,"rotate=aim",CGY); at(X,98,"OK=throw",CGY); at(X,112,"ESC=flee",CGY);
  }
  function ring(){                                   // clear only the ring bbox, redraw
    display.drawFillRect(BX,BY,BW,BH,BG);
    display.drawCircle(cx,cy,R,CGY);
    for (var g=-tol; g<=tol; g+=5){ var p=ringPt(cx,cy,R,target+g); display.drawFillCircle(p.x,p.y,2,CG); }
    var c=ringPt(cx,cy,R,cursor); display.drawFillCircle(c.x,c.y,4,CY);
    drawCreature(cx,cy,22,cr);
  }
  function msg(m,col){ display.drawFillRect(0,H()-16,W(),16,BG); at(6,H()-12,m,col||CY); }

  clear(); panel(); ring(); msg("lock the green zone & throw");
  purgeKeys();
  while(true){
    if (keyboard.getPrevPress()){ cursor=(cursor+351)%360; ring(); }
    else if (keyboard.getNextPress()){ cursor=(cursor+9)%360; ring(); }
    else if (keyboard.getEscPress()){ return false; }
    else if (keyboard.getSelPress()){
      var d=angDiff(cursor,target);
      var aim = d<=tol ? (1.5 - 0.6*(d/tol)) : 0.45;
      msg(d<=tol*0.34?"EXCELLENT throw!": d<=tol?"nice throw":"just missed...", d<=tol?CG:CY);
      var sx=Math.round(W()*0.5), sy=H()-14;         // throw animation
      for (var f=0;f<6;f++){ ring(); display.drawFillCircle(Math.round(sx+(cx-sx)*f/5), Math.round(sy+(cy-sy)*f/5), 4, CW); delay(45); }
      var caught = Math.random() < clampf(base*aim, 0.03, 0.98);
      for (var wob=0; wob<(caught?3:2); wob++){ display.drawFillCircle(cx,cy,7,CR); delay(220); display.drawFillCircle(cx,cy,7,CW); delay(110); }
      if (caught) return true;
      balls--; panel();
      if (balls<=0) return false;
      msg("it broke free! "+balls+" left",CR);
      target=Math.floor(Math.random()*360); ring(); delay(500);
    }
    target=(target+drift+360)%360;                   // target drifts (rarer = faster)
    ring();
    delay(30);
  }
}

// --- creature detail (before catch) ----------------------------------------
function creatureDetail(cr, caught){
  clear();
  drawCreature(Math.round(W()*0.28), Math.round(H()*0.5), 30, cr);
  var X=Math.round(W()*0.55);
  display.setTextSize(2); at(X,10,cr.name,C(cr.T.r,cr.T.g,cr.T.b)); display.setTextSize(1);
  at(X,36,"Type: "+cr.T.name,CW);
  at(X,52,"Rarity "+stars(cr.rar),CY);
  at(X,68,"CP "+cr.cp,CW);
  at(X,84,cr.vendor,CGY);
  at(X,100,"signal "+cr.rssi+"dBm",CGY);
  at(6,H()-13, caught? "already caught - OK=catch again  ESC=back" : "OK = CATCH!   ESC = back", caught?CGY:CG);
  purgeKeys();
  while(true){
    if (keyboard.getSelPress()) return true;
    if (keyboard.getEscPress()) return false;
    delay(40);
  }
}

// --- scan / encounter list --------------------------------------------------
function encounter(dex){
  header("Scanning..."); at(6,34,"looking for signals",CY);
  var nets=[]; try { nets=wifi.scan(); } catch(e){}
  var list=[], seen={};
  for (var i=0;i<nets.length;i++){ var m=(""+nets[i].MAC).toUpperCase(); if (seen[m]) continue; seen[m]=1; list.push(makeCreature(nets[i])); }
  if (!list.length){ header("SSID Safari"); at(6,40,"No creatures nearby.",CY); at(6,60,"move around & retry.",CGY); at(6,H()-12,"any key = back",CGY); purgeKeys(); while(!keyboard.getAnyPress()) delay(60); return; }
  list.sort(function(a,b){ return b.rssi-a.rssi; });
  var sel=0, top=0, per=4, dirty=true; purgeKeys();
  while(true){
    if (dirty){
      header("Wild ("+list.length+")");
      for (var r=0;r<per;r++){ var idx=top+r, y=30+r*32; if (idx>=list.length) break;
        var cr=list[idx], got=!!dex.caught[cr.mac];
        if (idx===sel) display.drawFillRoundRect(2,y-2,W()-4,30,3,C(22,30,48));
        drawCreature(24,y+13,11,cr);
        at(46,y, cr.name, C(cr.T.r,cr.T.g,cr.T.b));
        at(46,y+14, cr.T.name+" "+stars(cr.rar)+"  CP"+cr.cp, CGY);
        at(W()-30,y, got?"OK":cr.rssi, got?CG:CGY);
      }
      at(6,H()-11,"rotate=move  OK=engage  ESC=menu",CGY);
      dirty=false;
    }
    if (keyboard.getPrevPress()){ if (sel>0){ sel--; if (sel<top) top=sel; dirty=true; } }
    else if (keyboard.getNextPress()){ if (sel<list.length-1){ sel++; if (sel>=top+per) top=sel-per+1; dirty=true; } }
    else if (keyboard.getEscPress()){ return; }
    else if (keyboard.getSelPress()){
      var cr=list[sel];
      if (creatureDetail(cr, !!dex.caught[cr.mac])){
        var ok=catchGame(cr);
        if (ok){ dex.caught[cr.mac]={ssid:cr.ssid,name:cr.name,type:cr.type,rar:cr.rar,cp:cr.cp,vendor:cr.vendor}; saveDex(dex);
          resultScreen(cr,true); } else resultScreen(cr,false);
      }
      dirty=true; purgeKeys();
    }
    delay(40);
  }
}
function resultScreen(cr, ok){
  clear();
  drawCreature(Math.round(W()/2), 60, 30, cr);
  display.setTextSize(2);
  if (ok) at(W()/2-90, 108, cr.name+" caught!", CG);
  else at(W()/2-54, 108, "It fled...", CR);
  display.setTextSize(1); at(W()/2-40,H()-14,"any key = ok",CGY);
  purgeKeys(); while(!keyboard.getAnyPress()) delay(50);
}

// --- Pokedex browser --------------------------------------------------------
function pokedex(dex){
  var keys=[]; for (var k in dex.caught) keys.push(k);
  if (!keys.length){ header("Pokedex"); at(6,44,"empty - go catch some!",CGY); at(6,H()-12,"any key=back",CGY); purgeKeys(); while(!keyboard.getAnyPress()) delay(60); return; }
  var sel=0, top=0, per=4, dirty=true; purgeKeys();
  while(true){
    if (dirty){
      header("Pokedex "+keys.length);
      for (var r=0;r<per;r++){ var idx=top+r, y=30+r*32; if (idx>=keys.length) break;
        var e=dex.caught[keys[idx]], T=TYPES[e.type]||TYPES.armor;
        var cr={seed:hash32(keys[idx]),T:T,type:e.type,family:familyOf(keys[idx]),mac:keys[idx]};
        if (idx===sel) display.drawFillRoundRect(2,y-2,W()-4,30,3,C(22,30,48));
        drawCreature(24,y+13,11,cr);
        at(46,y, e.name, C(T.r,T.g,T.b));
        at(46,y+14, T.name+" "+stars(e.rar)+"  CP"+e.cp, CGY);
      }
      at(6,H()-11,"rotate=move  ESC=back",CGY);
      dirty=false;
    }
    if (keyboard.getPrevPress()){ if (sel>0){ sel--; if (sel<top) top=sel; dirty=true; } }
    else if (keyboard.getNextPress()){ if (sel<keys.length-1){ sel++; if (sel>=top+per) top=sel-per+1; dirty=true; } }
    else if (keyboard.getEscPress()){ return; }
    delay(40);
  }
}

// --- menu -------------------------------------------------------------------
function splash(){
  clear(); var cx=Math.round(W()/2);
  drawCreature(cx-40,54,20,{seed:12345,T:TYPES.wild,family:"blob",mac:"x"});
  drawCreature(cx+42,54,18,{seed:99,T:TYPES.crystal,family:"spike",mac:"y"});
  display.setTextSize(2); at(cx-64,92,"SSID Safari",CG); display.setTextSize(1);
  at(cx-70,118,"catch the Wi-Fi around you",CGY); delay(1300);
}
function menu(dex){
  var rows=["Explore (scan)","Pokedex ("+dexCount(dex)+")","Quit"];
  var sel=0, dirty=true; purgeKeys();
  while(true){
    if (dirty){
      header("SSID Safari");
      for (var i=0;i<rows.length;i++){ var y=44+i*24;
        if (i===sel){ display.drawFillRoundRect(W()/2-90,y-3,180,20,3,CB); at(W()/2-80,y+2,rows[i],C(0,0,0)); }
        else at(W()/2-80,y+2,rows[i],CW);
      }
      at(6,H()-11,"rotate=move  OK=select  ESC=quit",CGY);
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
  splash();
  var dex=loadDex();
  while(true){
    var m=menu(dex);
    if (m===2) return;
    if (m===0) encounter(dex);
    else if (m===1) pokedex(dex);
  }
}
main();
