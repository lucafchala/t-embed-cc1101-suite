// ============================================================
//  Launcher — favorites menu for your JS scripts (Bruce)
//  1) Pick a FOLDER (BruceJS by default, another one, all, or
//     browse the SD)  2) category (sub-folders)  3) script.
//  Runs it via load(). Great for App Store scripts stored in
//  sub-folders (which don't show up in the Interpreter menu).
//
//  Put this file at the ROOT of /BruceJS (or /scripts).
//  Tip: set it as "Startup App" (Config) = menu on boot.
//  Author: koua29
// ============================================================

var ROOTS = ["/BruceJS", "/scripts", "/BruceScripts"];
var MAX_DEPTH = 4;                       // search depth
var SELF = ["launcher.js"];              // don't list myself

function C(r,g,b){ return display.color(r,g,b); }
var BLACK=C(0,0,0), WHITE=C(235,240,238), GREY=C(120,130,128), CYAN=C(90,200,255), GREEN=C(40,225,90), RED=C(255,70,60);

function head(t){ display.fill(BLACK); display.setTextColor(CYAN); display.setTextSize(2); display.drawString(t,12,10); display.setTextColor(WHITE); display.setTextSize(1); }
function info(l1,l2,col){ head("Launcher"); display.setTextColor(col||WHITE); if(l1)display.drawString(l1,12,44); if(l2)display.drawString(l2,12,62); display.setTextColor(WHITE); }

function isJs(n){ n=String(n).toLowerCase(); return n.length>3 && n.substring(n.length-3)===".js"; }
function join(dir,name){ return (dir==="/") ? ("/"+name) : (dir+"/"+name); }
function parentOf(p){ var i=p.lastIndexOf("/"); return i<=0 ? "/" : p.substring(0,i); }

// list a folder -> [{name,isDirectory}] (empty on error/missing)
function ls(dir){
  try { var e = storage.readdir(dir, {withFileTypes:true}); return e && e.length ? e : []; }
  catch(err){ return []; }
}
function dirExists(p){ try { storage.readdir(p); return true; } catch(e){ return false; } }

// recursive scan of a BASE -> found[] {label, path, group}
var found = [];
function scan(dir, group, depth){
  if (depth > MAX_DEPTH) return;
  var entries = ls(dir);
  for (var i=0;i<entries.length;i++){
    var e = entries[i], name = e.name || e;
    if (!name || name.charAt(0)===".") continue;
    var full = join(dir, name);
    if (e.isDirectory){
      scan(full, (group==="" ? name : group), depth+1);   // 1st level under base = category
    } else if (isJs(name)){
      var low = name.toLowerCase(), skip=false;
      for (var s=0;s<SELF.length;s++) if (low===SELF[s]) skip=true;
      if (skip) continue;
      found.push({ label: name, path: full, group: (group===""?"(root)":group) });
    }
  }
}

// interactive SD browser -> returns a folder path or null
function browse(){
  var cur = "/";
  while (true){
    var dirs = [];
    var entries = ls(cur);
    for (var i=0;i<entries.length;i++){ var e=entries[i], n=e.name||e; if (e.isDirectory && n.charAt(0)!==".") dirs.push(n); }
    dirs.sort();
    var menu = [["[ Pick HERE ] "+cur.substring(0,16), "__pick__"]];
    if (cur!=="/") menu.push([".. (up)", "__up__"]);
    for (var d=0; d<dirs.length; d++) menu.push([dirs[d].substring(0,24)+"/", "d:"+dirs[d]]);
    menu.push(["Cancel", "__cancel__"]);
    var p = dialog.choice(menu);
    if (!p || p==="__cancel__") return null;
    if (p==="__pick__") return cur;
    if (p==="__up__"){ cur = parentOf(cur); continue; }
    if (p.indexOf("d:")===0) cur = join(cur, p.substring(2));
  }
}

// ---- main loop ----
var app = true;
while (app){
  // ---- 1) PICK FOLDER ----
  var rmenu = [];
  for (var r=0;r<ROOTS.length;r++) if (dirExists(ROOTS[r])) rmenu.push([ROOTS[r], "b:"+ROOTS[r]]);
  rmenu.push(["* All (every folder)", "__all__"]);
  rmenu.push(["Browse SD...", "__browse__"]);
  rmenu.push(["Quit", "__quit__"]);

  var choice = dialog.choice(rmenu);
  if (!choice || choice==="__quit__"){ app=false; break; }

  // which bases to scan
  var bases = [];
  if (choice==="__all__"){ for (var i=0;i<ROOTS.length;i++) if (dirExists(ROOTS[i])) bases.push(ROOTS[i]); }
  else if (choice==="__browse__"){ var b = browse(); if (!b){ continue; } bases.push(b); }
  else if (choice.indexOf("b:")===0){ bases.push(choice.substring(2)); }

  // ---- SCAN ----
  found = [];
  info("scanning...", bases.join(" "));
  var seen={};
  for (var bi=0;bi<bases.length;bi++){ if(seen[bases[bi]])continue; seen[bases[bi]]=1; scan(bases[bi], "", 1); }

  if (found.length===0){ info("No .js script here", "another folder ?", RED); delay(1800); continue; }

  found.sort(function(a,b){ if(a.group!==b.group) return a.group<b.group?-1:1; return a.label<b.label?-1:(a.label>b.label?1:0); });

  // groups
  var groups=[], gseen={};
  for (var f=0;f<found.length;f++){ var g=found[f].group; if(!gseen[g]){ gseen[g]=0; groups.push(g);} gseen[g]++; }

  // ---- 2) CATEGORY menu ----
  var inFolder = true;
  while (inFolder){
    var gmenu = [];
    gmenu.push(["* All (A-Z)  ["+found.length+"]", "__gall__"]);
    for (var gi=0; gi<groups.length; gi++) gmenu.push([groups[gi]+"  ["+gseen[groups[gi]]+"]", "g:"+groups[gi]]);
    gmenu.push(["< Change folder", "__gback__"]);
    var gpick = dialog.choice(gmenu);
    if (!gpick || gpick==="__gback__"){ inFolder=false; break; }

    var showAll = (gpick==="__gall__");
    var gname = showAll ? "" : gpick.substring(2);
    var list = [];
    for (var li=0; li<found.length; li++) if (showAll || found[li].group===gname) list.push(found[li]);

    // ---- 3) SCRIPT menu ----
    var back=false;
    while (!back){
      var smenu=[];
      for (var m=0;m<list.length;m++){
        var lab = showAll ? (list[m].group+"/"+list[m].label) : list[m].label;
        smenu.push([lab.substring(0,26), m+""]);
      }
      smenu.push(["< Back", "__back__"]);
      var spick = dialog.choice(smenu);
      if (spick===undefined || spick==="" || spick==="__back__"){ back=true; break; }

      var sel = list[parseInt(spick)];
      // ---- 4) LAUNCH ----
      info("Launching:", sel.label.substring(0,24), GREEN); delay(500);
      try { load(sel.path); } catch(e){ /* exit() or error -> back to menu */ }
      // the script may have redrawn: our menu is shown again next round
    }
  }
}

display.fill(BLACK); display.setTextColor(WHITE); display.setTextSize(2); display.drawString("Bye.", 128, 74);
