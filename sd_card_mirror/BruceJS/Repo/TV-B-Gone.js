// ============================================================
//  TV-B-Gone — eteint (presque) n'importe quelle TV (Bruce)
//  Base de codes POWER IR multi-marques, envoyes un par un,
//  avec anneau de progression + % + marque en cours.
//  Mode "toutes marques" OU "un modele precis".
//  Necessite "tvbgone.ir" (a cote du script / /scripts / racine).
//  Pour rire / usage responsable. Auteur: koua29
// ============================================================

var PASSES = 3;
var CANDIDATES = ["/scripts/tvbgone.ir","/BruceScripts/tvbgone.ir","/BruceJS/tvbgone.ir","/tvbgone.ir","tvbgone.ir"];
var TMP = "/_tvbg.ir";
var HDR = "Filetype: IR signals file\nVersion: 1\n#\n";

function C(r,g,b){ return display.color(r,g,b); }
var BLACK=C(0,0,0), WHITE=C(235,240,238), GREY=C(120,130,128), RED=C(255,70,60), GREEN=C(40,225,90), DIM=C(60,28,22);

function head(t){ display.fill(BLACK); display.setTextColor(RED); display.setTextSize(3); display.drawString(t,12,10); display.setTextColor(WHITE); display.setTextSize(1); }
function fileExists(p){ try { var d = storage.read(p); return (typeof d==="string" ? d.length>0 : !!d); } catch(e){ return false; } }
function bye(msg){ display.fill(BLACK); display.setTextSize(2); display.setTextColor(WHITE); display.drawString(msg,120,74); }

function parseSignals(raw){
  var lines = String(raw).split("\n"), out=[], cur=null;
  for (var i=0;i<lines.length;i++){
    var ln = lines[i];
    if (ln.indexOf("name:")===0){
      if (cur) out.push(cur);
      var b = ln.substring(5).replace("Pwr","").replace("Power","").trim();
      cur = { brand: b || "TV", text: ln };
    } else if (cur && ln.indexOf("#")!==0 && ln.trim().length){
      cur.text += "\n" + ln;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function progress(passLabel, done, total, brand){
  display.fill(BLACK);
  display.setTextColor(RED); display.setTextSize(2); display.drawString("TV-B-GONE", 84, 8);
  display.setTextColor(WHITE); display.setTextSize(1); display.drawString(passLabel, 96, 32);
  var cx=62, cy=102, R=50;
  display.drawCircle(cx,cy,R,DIM); display.drawCircle(cx,cy,R-14,DIM);
  var deg = Math.round(360*done/total);
  if (deg>0) display.drawArc(cx,cy,R,R-14,0,deg,RED,BLACK);
  var pct = Math.round(100*done/total);
  display.setTextSize(2); display.drawString(pct+"%", cx-(pct>=100?26:18), cy-8); display.setTextSize(1);
  display.drawString("Envoi:", 128, 66);
  display.setTextColor(GREEN); display.drawString(brand.substring(0,16), 128, 80); display.setTextColor(WHITE);
  display.drawString("code " + done + "/" + total, 128, 104);
  display.setTextColor(GREY); display.drawString("Vise la TV. ESC = stop", 96, 156); display.setTextColor(WHITE);
}

// ---- trouver le fichier ----
head("TV-B-GONE"); display.drawString("recherche tvbgone.ir...", 12, 46);
var IR=null;
for (var i=0;i<CANDIDATES.length;i++){ if (fileExists(CANDIDATES[i])){ IR=CANDIDATES[i]; break; } }

if (!IR){
  head("ERREUR"); display.drawString("tvbgone.ir introuvable.",12,46);
  display.drawString("Mets-le dans /scripts.",12,62); delay(3500); bye("Fin.");
} else {
  var sigs = parseSignals(storage.read(IR));
  var total = sigs.length;

  // marques uniques
  var brands=[], seen={};
  for (var bi=0;bi<total;bi++){ var bn=sigs[bi].brand; if(!seen[bn]){ seen[bn]=1; brands.push(bn); } }

  if (total===0){ bye("0 code"); }
  else {
    var go = dialog.choice([
      ["FEU ! toutes marques","all"],
      ["Choisir un modele","one"],
      ["Boucle (toutes)","loop"],
      ["Quitter","quit"]
    ]);

    var work=null, loop=false;
    if (go==="all"){ work=sigs; }
    else if (go==="loop"){ work=sigs; loop=true; }
    else if (go==="one"){
      var b = dialog.choice(brands);      // liste des marques
      if (b){ work=[]; for (var wi=0;wi<total;wi++) if (sigs[wi].brand===b) work.push(sigs[wi]); }
    }

    if (!work || !work.length){ bye("Fin."); }
    else {
      keyboard.getEscPress();
      var wtotal=work.length, pass=0, stop=false;
      var maxPass = (wtotal > 40) ? 1 : PASSES;   // grosse base (NA/EU/toutes) = 1 passe
      do {
        pass++;
        var lbl = loop ? ("boucle - passe "+pass) : ("passe "+pass+"/"+maxPass);
        for (var k=0;k<wtotal;k++){
          if (keyboard.getEscPress()){ stop=true; break; }
          storage.write(TMP, HDR + work[k].text + "\n#\n", "write");   // 1 code + terminateur "#" (sinon txIrFile n'emet pas !)
          ir.transmitFile(TMP, true);                                   // ...envoye
          progress(lbl, k+1, wtotal, work[k].brand);          // anneau + % + marque
        }
        if (stop) break;
      } while (loop || pass < maxPass);

      try { storage.remove(TMP); } catch(e){}
      head(stop ? "STOP" : "TERMINE");
      display.setTextColor(stop?WHITE:GREEN);
      display.drawString(stop ? "arrete" : ("fini - "+pass+" passe(s)"), 12, 50);
      display.setTextColor(WHITE); delay(1500);
      bye("Bye TV");
    }
  }
}
