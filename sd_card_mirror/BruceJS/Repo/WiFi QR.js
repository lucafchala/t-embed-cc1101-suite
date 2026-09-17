// ============================================================================
//  WiFi QR  -  Bruce / LilyGO T-Embed CC1101
//  Connect to a Wi-Fi network, then display a scannable QR code of it.
//  QR encoder (byte mode + Reed-Solomon) ported from Nayuki qrcodegen (MIT),
//  verified on PC against the jsQR decoder. No native QR/PNG needed.
// ============================================================================
// QR Code generator (byte mode), ES5 — ported from Nayuki qrcodegen (MIT).
// QRGEN.encode(text, "L"|"M"|"Q"|"H") -> 2D array of booleans (true=dark).
var QRGEN = (function(){
  var ECL = { L:0, M:1, Q:2, H:3 };
  var FMT = [1,0,3,2];   // format bits for L,M,Q,H

  var ECC_CW = [
    // index by version 1..40 (0 unused)
    [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30], // L
    [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28], // M
    [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30], // Q
    [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]  // H
  ];
  var ECC_BLOCKS = [
    [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],   // L
    [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49], // M
    [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68], // Q
    [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]  // H
  ];

  function rsMul(x,y){ var z=0; for (var i=7;i>=0;i--){ z=(z<<1)^((z>>>7)*0x11D); z^=((y>>>i)&1)*x; } return z & 0xFF; }
  function rsDivisor(degree){
    var result=[]; var i; for (i=0;i<degree;i++) result.push(0);
    result[degree-1]=1; var root=1;
    for (i=0;i<degree;i++){
      for (var j=0;j<result.length;j++){ result[j]=rsMul(result[j],root); if (j+1<result.length) result[j]^=result[j+1]; }
      root=rsMul(root,0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor){
    var result=[]; var i; for (i=0;i<divisor.length;i++) result.push(0);
    for (i=0;i<data.length;i++){
      var factor = data[i]^result.shift(); result.push(0);
      for (var j=0;j<divisor.length;j++) result[j]^=rsMul(divisor[j],factor);
    }
    return result;
  }

  function utf8(str){
    var out=[]; for (var i=0;i<str.length;i++){
      var c=str.charCodeAt(i);
      if (c<0x80) out.push(c);
      else if (c<0x800){ out.push(0xC0|(c>>6), 0x80|(c&0x3F)); }
      else { out.push(0xE0|(c>>12), 0x80|((c>>6)&0x3F), 0x80|(c&0x3F)); }
    }
    return out;
  }
  function numRawDataModules(v){
    var result=(16*v+128)*v+64;
    if (v>=2){ var numAlign=Math.floor(v/7)+2; result-=(25*numAlign-10)*numAlign-55; if (v>=7) result-=36; }
    return result;
  }
  function numDataCodewords(v,ecl){
    return Math.floor(numRawDataModules(v)/8) - ECC_CW[ecl][v]*ECC_BLOCKS[ecl][v];
  }

  function make2d(size){ var m=[]; for (var i=0;i<size;i++){ var r=[]; for (var j=0;j<size;j++) r.push(false); m.push(r);} return m; }

  function alignPositions(v){
    if (v===1) return [];
    var num=Math.floor(v/7)+2, step=(v===32)?26:Math.ceil((v*4+4)/(num*2-2))*2;
    var pos=[6], p=v*4+10;
    for (var i=num-1;i>=1;i--){ pos.push(p); p-=step; }
    // reorder ascending
    pos.sort(function(a,b){return a-b;});
    return pos;
  }

  function encode(text, eclName){
    var ecl = ECL[eclName||"M"];
    var bytes = utf8(text);
    var version=-1, i, v;
    for (v=1; v<=40; v++){
      var cc0=(v<=9)?8:16;
      var need = 4 + cc0 + bytes.length*8;
      if (need <= numDataCodewords(v,ecl)*8){ version=v; break; }
    }
    if (version<0) throw "QR: data too long";

    // bit buffer
    var bb=[];
    function appendBits(val,len){ for (var k=len-1;k>=0;k--) bb.push((val>>>k)&1); }
    appendBits(4,4);                             // byte mode
    appendBits(bytes.length, (version<=9)?8:16);
    for (i=0;i<bytes.length;i++) appendBits(bytes[i],8);
    var capBits = numDataCodewords(version,ecl)*8;
    appendBits(0, Math.min(4, capBits-bb.length));
    appendBits(0, (8 - bb.length%8)%8);
    for (var pad=0xEC; bb.length<capBits; pad^=0xEC^0x11) appendBits(pad,8);

    var dataCw=[]; for (i=0;i<bb.length;i+=8){ var b=0; for (var j=0;j<8;j++) b=(b<<1)|bb[i+j]; dataCw.push(b); }

    // ECC + interleave
    var numBlocks=ECC_BLOCKS[ecl][version], eccLen=ECC_CW[ecl][version];
    var rawCw=Math.floor(numRawDataModules(version)/8);
    var numShort=numBlocks - rawCw%numBlocks;
    var shortLen=Math.floor(rawCw/numBlocks);
    var blocks=[], divisor=rsDivisor(eccLen), k=0;
    for (i=0;i<numBlocks;i++){
      var datLen=shortLen-eccLen+(i<numShort?0:1);
      var dat=dataCw.slice(k,k+datLen); k+=datLen;
      var ecc=rsRemainder(dat,divisor);
      if (i<numShort) dat.push(0); // pad for interleave alignment (short blocks)
      blocks.push({dat:dat, ecc:ecc, real:datLen});
    }
    var result=[];
    for (i=0;i<shortLen-eccLen+1;i++){
      for (var bkt=0;bkt<blocks.length;bkt++){
        if (i<blocks[bkt].real || (i===blocks[bkt].dat.length-1 && bkt>=numShort)) {
          // handled below more simply
        }
      }
    }
    // simpler interleave: data
    var out=[];
    var maxDat=0; for (i=0;i<blocks.length;i++) if (blocks[i].real>maxDat) maxDat=blocks[i].real;
    for (i=0;i<maxDat;i++){
      for (var bk=0;bk<blocks.length;bk++){
        if (i<blocks[bk].real) out.push(blocks[bk].dat[i]);
      }
    }
    for (i=0;i<eccLen;i++){
      for (var bk2=0;bk2<blocks.length;bk2++) out.push(blocks[bk2].ecc[i]);
    }
    var allCw=out;

    // draw
    var size=version*4+17;
    var mod=make2d(size), fn=make2d(size);

    function setFinder(x,y){
      for (var dy=-4;dy<=4;dy++) for (var dx=-4;dx<=4;dx++){
        var xx=x+dx, yy=y+dy; if (xx<0||xx>=size||yy<0||yy>=size) continue;
        var dist=Math.max(Math.abs(dx),Math.abs(dy));
        mod[yy][xx]=(dist!==2 && dist!==4); fn[yy][xx]=true;
      }
    }
    // timing
    for (i=0;i<size;i++){ mod[6][i]=(i%2===0); fn[6][i]=true; mod[i][6]=(i%2===0); fn[i][6]=true; }
    setFinder(3,3); setFinder(size-4,3); setFinder(3,size-4);
    // alignment
    var ap=alignPositions(version);
    for (i=0;i<ap.length;i++) for (var jj=0;jj<ap.length;jj++){
      if ((i===0&&jj===0)||(i===0&&jj===ap.length-1)||(i===ap.length-1&&jj===0)) continue;
      var ax=ap[i], ay=ap[jj];
      for (var dy2=-2;dy2<=2;dy2++) for (var dx2=-2;dx2<=2;dx2++){
        mod[ay+dy2][ax+dx2]=(Math.max(Math.abs(dx2),Math.abs(dy2))!==1); fn[ay+dy2][ax+dx2]=true;
      }
    }
    // reserve format
    for (i=0;i<=8;i++){ if (i!==6){ fn[8][i]=true; fn[i][8]=true; } }
    for (i=0;i<8;i++){ fn[8][size-1-i]=true; fn[size-1-i][8]=true; }
    fn[size-8][8]=true; mod[size-8][8]=true; // dark module
    // reserve version (v>=7)
    if (version>=7){
      for (i=0;i<6;i++) for (var t=0;t<3;t++){ fn[size-11+t][i]=true; fn[i][size-11+t]=true; }
    }

    // place codewords
    var bitIdx=0, totalBits=allCw.length*8;
    for (var right=size-1; right>=1; right-=2){
      if (right===6) right=5;
      for (var vert=0; vert<size; vert++){
        for (var c=0;c<2;c++){
          var xx=right-c;
          var upward=((right+1)&2)===0;
          var yy=upward?(size-1-vert):vert;
          if (!fn[yy][xx] && bitIdx<totalBits){
            mod[yy][xx]=((allCw[bitIdx>>>3]>>>(7-(bitIdx&7)))&1)!==0; bitIdx++;
          }
        }
      }
    }

    function maskFn(m,x,y){
      switch(m){
        case 0: return (x+y)%2===0;
        case 1: return y%2===0;
        case 2: return x%3===0;
        case 3: return (x+y)%3===0;
        case 4: return (Math.floor(x/3)+Math.floor(y/2))%2===0;
        case 5: return (x*y)%2+(x*y)%3===0;
        case 6: return ((x*y)%2+(x*y)%3)%2===0;
        case 7: return ((x+y)%2+(x*y)%3)%2===0;
      }
    }
    function applyMask(m){
      for (var y=0;y<size;y++) for (var x=0;x<size;x++) if (!fn[y][x] && maskFn(m,x,y)) mod[y][x]=!mod[y][x];
    }
    function drawFormat(m){
      var data=(FMT[ecl]<<3)|m, rem=data;
      for (i=0;i<10;i++) rem=(rem<<1)^((rem>>>9)*0x537);
      var bits=((data<<10)|rem)^0x5412;
      for (i=0;i<=5;i++) mod[i][8]=((bits>>>i)&1)!==0;
      mod[7][8]=((bits>>>6)&1)!==0; mod[8][8]=((bits>>>7)&1)!==0; mod[8][7]=((bits>>>8)&1)!==0;
      for (i=9;i<15;i++) mod[8][14-i]=((bits>>>i)&1)!==0;
      for (i=0;i<8;i++) mod[8][size-1-i]=((bits>>>i)&1)!==0;
      for (i=8;i<15;i++) mod[size-15+i][8]=((bits>>>i)&1)!==0;
      mod[size-8][8]=true;
    }
    function drawVersion(){
      if (version<7) return;
      var rem=version;
      for (i=0;i<12;i++) rem=(rem<<1)^((rem>>>11)*0x1F25);
      var bits=(version<<12)|rem;
      for (i=0;i<18;i++){ var bit=((bits>>>i)&1)!==0; var a=size-11+i%3, b=Math.floor(i/3); mod[b][a]=bit; mod[a][b]=bit; }
    }
    function penalty(){
      var p=0, x, y;
      for (y=0;y<size;y++){ var run=1; for (x=1;x<size;x++){ if (mod[y][x]===mod[y][x-1]){ run++; if (run===5) p+=3; else if (run>5) p++; } else run=1; } }
      for (x=0;x<size;x++){ var run2=1; for (y=1;y<size;y++){ if (mod[y][x]===mod[y-1][x]){ run2++; if (run2===5) p+=3; else if (run2>5) p++; } else run2=1; } }
      for (y=0;y<size-1;y++) for (x=0;x<size-1;x++){ var col=mod[y][x]; if (col===mod[y][x+1]&&col===mod[y+1][x]&&col===mod[y+1][x+1]) p+=3; }
      var dark=0; for (y=0;y<size;y++) for (x=0;x<size;x++) if (mod[y][x]) dark++;
      var total=size*size; var k5=0; while (dark*20 < (9-k5)*total || dark*20 > (11+k5)*total) k5++; p+=k5*10;
      return p;
    }

    drawVersion();
    var bestM=0, minP=Infinity;
    for (var m=0;m<8;m++){
      applyMask(m); drawFormat(m);
      var pen=penalty();
      if (pen<minP){ minP=pen; bestM=m; }
      applyMask(m); // undo
    }
    applyMask(bestM); drawFormat(bestM);
    return mod;
  }

  return { encode: encode };
})();


// ============================================================================
//  App: connect to WiFi, then show a scannable QR of that network.
//  WiFi passwords are read from Bruce's own config (/bruce.conf, key "wifi").
// ============================================================================
function C(r,g,b){ return display.color(r,g,b); }
var CW=C(255,255,255), CG=C(0,255,90), CY=C(255,200,0), CB=C(80,160,255), CGY=C(140,140,140);
function W(){ return display.width(); }
function H(){ return display.height(); }
function clear(){ display.fill(C(0,0,0)); }
function at(x,y,t,col){ display.setTextColor(col); display.drawString(""+t,x,y); }
function header(t){ clear(); display.setTextSize(2); at(6,4,t,CB); display.setTextSize(1); display.drawFastHLine(0,26,W(),CGY); }
function purgeKeys(){ for (var i=0;i<6;i++){ keyboard.getAnyPress(); delay(8); } }

// --- read saved WiFi creds from /bruce.conf ---------------------------------
function readSavedWifi(){
  var txt=null, paths=["/bruce.conf","/bak.bruce.conf"];
  for (var i=0;i<paths.length && !txt;i++){ try { txt=storage.read(paths[i]); } catch(e1){} }
  if (!txt) return {};
  try { var j=JSON.parse(""+txt); return (j && j.wifi) ? j.wifi : {}; } catch(e){ return {}; }
}

// --- WIFI: payload (escape \ ; , : ") ---------------------------------------
function esc(s){
  var o="", sp="\\;,:\"", x=""+s;
  for (var i=0;i<x.length;i++){ var c=x.charAt(i); if (sp.indexOf(c)>=0) o+="\\"; o+=c; }
  return o;
}
function wifiPayload(ssid, pwd){
  if (pwd && pwd.length) return "WIFI:T:WPA;S:"+esc(ssid)+";P:"+esc(pwd)+";;";
  return "WIFI:T:nopass;S:"+esc(ssid)+";;";
}

// --- simple list picker -> index or -1 --------------------------------------
function pick(title, labels){
  var LH=14, top0=30, per=Math.floor((H()-top0-12)/LH); if (per<1) per=1;
  var sel=0, top=0, dirty=true; purgeKeys();
  while(true){
    if (dirty){
      header(title);
      for (var i=0;i<per;i++){ var idx=top+i, y=top0+i*LH; if (idx>=labels.length) break;
        if (idx===sel){ display.drawFillRect(2,y-1,W()-6,LH-1,CB); at(6,y,labels[idx],C(0,0,0)); }
        else at(6,y,labels[idx],CW);
      }
      at(6,H()-11,"rotate=move  OK=ok  ESC=back",CGY); dirty=false;
    }
    if (keyboard.getPrevPress()){ if (sel>0){ sel--; if (sel<top) top=sel; dirty=true; } }
    else if (keyboard.getNextPress()){ if (sel<labels.length-1){ sel++; if (sel>=top+per) top=sel-per+1; dirty=true; } }
    else if (keyboard.getSelPress()) return sel;
    else if (keyboard.getEscPress()) return -1;
    delay(40);
  }
}

// --- render the QR (white bg + quiet zone, dark modules) --------------------
function showQR(ssid, pwd){
  var payload=wifiPayload(ssid, pwd), m;
  try { m=QRGEN.encode(payload,"L"); } catch(e){ msgScreen("WiFi QR","Payload too long","",CY); return; }
  var n=m.length, quiet=4;
  var avail=Math.min(H()-22, W());
  var scale=Math.floor(avail/(n+2*quiet)); if (scale<2) scale=2;
  var qpx=(n+2*quiet)*scale, x0=Math.round((W()-qpx)/2), y0=2, black=C(0,0,0), white=C(255,255,255);
  clear();
  display.drawFillRect(x0,y0,qpx,qpx,white);
  for (var y=0;y<n;y++) for (var x=0;x<n;x++){
    if (m[y][x]) display.drawFillRect(x0+(x+quiet)*scale, y0+(y+quiet)*scale, scale, scale, black);
  }
  var cap=ssid.length>30?ssid.substring(0,30):ssid;
  at(Math.round(W()/2)-cap.length*3, H()-11, cap, CW);
  purgeKeys(); while(true){ if (keyboard.getAnyPress()) break; delay(80); }
}

// --- guess the currently-connected SSID (best effort) -----------------------
function guessConnected(saved){
  var nets=[]; try { nets=wifi.scan(); } catch(e){ return null; }
  var vis=[];
  for (var i=0;i<nets.length;i++){ var s=nets[i].SSID; if (s && saved[s]!=null && vis.indexOf(s)<0) vis.push(s); }
  return vis.length===1 ? vis[0] : null;
}

// --- blocking message screen ------------------------------------------------
function msgScreen(title, l1, l2, col){
  header(title);
  at(6,44,l1,col||CW);
  if (l2) at(6,64,l2,CGY);
  at(6,H()-12,"press any key",CGY);
  purgeKeys(); while(true){ if (keyboard.getAnyPress()) break; delay(80); }
}

// --- connect flow: scan -> pick -> connect -> QR (retry on failure) ---------
function connectFlow(saved){
  while(true){
    header("WiFi QR"); at(6,34,"scanning Wi-Fi...",CY);
    var nets=[]; try { nets=wifi.scan(); } catch(e2){}
    if (!nets || !nets.length){ msgScreen("WiFi QR","No network found.","move closer / retry",CY); return; }
    nets.sort(function(a,b){ return (b.RSSI||-999)-(a.RSSI||-999); });
    var labels=[], seen={}, uniq=[];
    for (var i=0;i<nets.length;i++){ var s=nets[i].SSID; if (!s||seen[s]) continue; seen[s]=1; uniq.push(nets[i]);
      labels.push(s + (saved[s]!=null?"  [saved]":"")); }
    if (!labels.length){ msgScreen("WiFi QR","No named network.","",CY); return; }
    var k=pick("Connect to", labels);
    if (k<0) return;                                   // ESC -> quit
    var ssid=uniq[k].SSID;
    var pwd=(saved[ssid]!=null) ? saved[ssid] : keyboard.keyboard("", 63, "Password: "+ssid);
    header("WiFi QR"); at(6,34,"connecting to",CY); at(6,52,ssid,CW); at(6,76,"please wait (~15s)...",CGY);
    var ok=false; try { ok=wifi.connect(ssid, 15, pwd); } catch(e){}   // returns bool
    if (ok){ showQR(ssid, pwd); return; }
    msgScreen("WiFi QR","Connection failed.","wrong password? retry",CY);
    // loop back to the network list to retry
  }
}

// --- intro splash -----------------------------------------------------------
function qrIcon(cx, cy, s, col){                 // stylized QR finder pattern
  display.drawRect(cx-s, cy-s, 2*s, 2*s, col);
  display.drawRect(cx-s+2, cy-s+2, 2*s-4, 2*s-4, col);
  display.drawFillRect(cx-s+5, cy-s+5, 2*s-10, 2*s-10, col);
}
function splashScreen(){
  clear();
  var cx=Math.round(W()/2), cy=48;
  qrIcon(cx, cy, 20, CW);
  display.drawFillRect(cx+30, cy-18, 6, 6, CG);    // scattered "modules"
  display.drawFillRect(cx+38, cy-4, 6, 6, CG);
  display.drawFillRect(cx-42, cy+10, 6, 6, CG);
  display.drawFillRect(cx+32, cy+16, 6, 6, CG);
  display.setTextSize(2);
  var t="WiFi QR"; at(cx - t.length*6, 90, t, CB);
  display.setTextSize(1);
  at(cx - 66, 116, "share your Wi-Fi via QR code", CGY);
  delay(1200);
}

// --- main -------------------------------------------------------------------
function main(){
  splashScreen();
  var saved=readSavedWifi();
  if (wifi.connected()){
    var g=guessConnected(saved);
    if (g!=null && saved[g]!=null){ showQR(g, saved[g]); return; }   // connected & known -> QR now
  }
  connectFlow(saved);                                                // else connect first
}

main();
