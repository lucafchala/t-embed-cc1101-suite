#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Theme "Wheel" pour Bruce (T-Embed CC1101). Image 320x140 (reco T-Embed),
# centree par le firmware -> pas de coupe. Roue a gauche (picto actif en
# surbrillance par inversion) + titre Anton a droite. 2 variantes monochromes.
import math, os, json, shutil
from PIL import Image, ImageDraw, ImageFont

W, H = 320, 140
SS = 4
CW, CH = W*SS, H*SS
ROOT = os.path.expanduser("~/Documents/BruceTheme_Wheel")
ANTON = os.path.join(os.path.dirname(__file__), "fonts", "Anton.ttf")

ITEMS = [
    ("wifi","WiFi"), ("ble","Bluetooth"), ("rf","RF"), ("nrf","NRF24"),
    ("lora","LoRa"), ("fm","FM"), ("ir","Infrared"), ("ethernet","Ethernet"),
    ("gps","GPS"), ("rfid","RFID"), ("files","Files"), ("interpreter","Scripts"),
    ("clock","Clock"), ("others","Others"), ("config","Config"),
]

VARIANTS = {
 "Wheel_Light": dict(page=(255,255,255), slice=(20,20,24), rim=(20,20,24),
    divider=(255,255,255), glyph=(255,255,255), act_slice=(255,255,255),
    act_glyph=(20,20,24), hub=(255,255,255), hub_ring=(20,20,24), title=(14,14,18),
    bgColor="ffff", priColor="0000", secColor="8410"),
 "Wheel_Dark": dict(page=(0,0,0), slice=(240,240,244), rim=(240,240,244),
    divider=(0,0,0), glyph=(0,0,0), act_slice=(0,0,0),
    act_glyph=(240,240,244), hub=(0,0,0), hub_ring=(240,240,244), title=(245,245,248),
    bgColor="0000", priColor="ffff", secColor="8410"),
}

def font(sz):
    try: return ImageFont.truetype(ANTON, sz)
    except: return ImageFont.load_default()

# ---------- pictos (centres en cx,cy, taille ~s) ----------
def ic_wifi(d,cx,cy,s,c,bg):
    for rr in (s*0.85,s*0.58,s*0.32):
        d.arc([cx-rr,cy-rr+s*0.25,cx+rr,cy+rr+s*0.25],220,320,fill=c,width=max(2,int(s*0.14)))
    d.ellipse([cx-s*0.11,cy+s*0.18,cx+s*0.11,cy+s*0.40],fill=c)
def ic_ble(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.13))
    pts=[(cx,cy-s*0.7),(cx+s*0.28,cy-s*0.32),(cx-s*0.28,cy+s*0.32),(cx,cy+s*0.7),
         (cx+s*0.28,cy+s*0.32),(cx-s*0.28,cy-s*0.32),(cx,cy-s*0.7),(cx,cy+s*0.7)]
    d.line(pts,fill=c,width=w,joint="curve")
def ic_rf(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.12)); d.ellipse([cx-s*0.14,cy-s*0.14,cx+s*0.14,cy+s*0.14],fill=c)
    for rr in (s*0.42,s*0.7):
        d.arc([cx-rr,cy-rr,cx+rr,cy+rr],300,60,fill=c,width=w)
        d.arc([cx-rr,cy-rr,cx+rr,cy+rr],120,240,fill=c,width=w)
def ic_nrf(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.12))
    d.rounded_rectangle([cx-s*0.5,cy-s*0.35,cx+s*0.1,cy+s*0.35],radius=int(s*0.12),outline=c,width=w)
    for i in range(3):
        x=cx-s*0.5-s*0.14*(i+1); d.line([x,cy-s*0.18,x,cy+s*0.18],fill=c,width=w)
    for rr in (s*0.35,s*0.6): d.arc([cx+0.1*s-rr,cy-rr,cx+0.1*s+rr,cy+rr],300,60,fill=c,width=w)
def ic_lora(d,cx,cy,s,c,bg):
    # tour d'emission (long range) : mat en /\ + entretoises + ondes au sommet
    w=max(2,int(s*0.11)); apex=(cx,cy-s*0.72); bl=(cx-s*0.5,cy+s*0.7); br=(cx+s*0.5,cy+s*0.7)
    d.line([apex,bl],fill=c,width=w); d.line([apex,br],fill=c,width=w)
    for t in (0.30,0.66):   # entretoises horizontales
        y=apex[1]+(bl[1]-apex[1])*t; hw=s*0.5*t
        d.line([cx-hw,y,cx+hw,y],fill=c,width=max(1,int(s*0.08)))
    for rr in (s*0.28,s*0.5):   # ondes au sommet
        d.arc([apex[0]-rr,apex[1]-rr,apex[0]+rr,apex[1]+rr],200,340,fill=c,width=w)
    d.ellipse([apex[0]-s*0.07,apex[1]-s*0.07,apex[0]+s*0.07,apex[1]+s*0.07],fill=c)
def ic_fm(d,cx,cy,s,c,bg):
    # poste radio FM : corps + cadran + antenne
    w=max(2,int(s*0.1))
    d.rounded_rectangle([cx-s*0.6,cy-s*0.2,cx+s*0.6,cy+s*0.55],radius=int(s*0.1),outline=c,width=w)
    d.ellipse([cx+s*0.06,cy+s*0.02,cx+s*0.44,cy+s*0.4],outline=c,width=w)   # cadran
    for i in range(3):   # grille gauche
        y=cy+s*0.02+i*s*0.14; d.line([cx-s*0.44,y,cx-s*0.14,y],fill=c,width=max(1,int(s*0.07)))
    d.line([cx-s*0.35,cy-s*0.2,cx+s*0.15,cy-s*0.75],fill=c,width=w)          # antenne
    d.ellipse([cx+s*0.08,cy-s*0.83,cx+s*0.22,cy-s*0.69],fill=c)
def ic_ir(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.12))
    d.rounded_rectangle([cx-s*0.55,cy-s*0.7,cx-s*0.1,cy+s*0.7],radius=int(s*0.1),outline=c,width=w)
    d.ellipse([cx-s*0.4,cy+s*0.35,cx-s*0.25,cy+s*0.5],fill=c)
    for rr in (s*0.35,s*0.6): d.arc([cx-rr,cy-rr,cx+rr,cy+rr],300,60,fill=c,width=w)
def ic_eth(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.11))
    d.rounded_rectangle([cx-s*0.5,cy-s*0.32,cx+s*0.5,cy+s*0.3],radius=int(s*0.08),outline=c,width=w)
    for i in range(4):
        x=cx-s*0.34+i*s*0.22; d.line([x,cy+0.3*s,x,cy+0.55*s],fill=c,width=w)
    d.line([cx-s*0.34,cy+0.55*s,cx+0.34*s,cy+0.55*s],fill=c,width=w)
def ic_gps(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.12)); r=s*0.52; topcy=cy-s*0.12
    # pin: cercle haut + pointe bas, en traits (pas d'effacement)
    d.arc([cx-r,topcy-r,cx+r,topcy+r],35,145,fill=c,width=w)   # arc bas (ouvert vers la pointe)
    d.arc([cx-r,topcy-r,cx+r,topcy+r],145,360+35,fill=c,width=w) if False else None
    d.arc([cx-r,topcy-r,cx+r,topcy+r],150,390,fill=c,width=w)  # arc haut
    lx=cx+math.cos(math.radians(150))*r; rx=cx+math.cos(math.radians(35))*r
    ly=topcy+math.sin(math.radians(150))*r; ry=topcy+math.sin(math.radians(35))*r
    d.line([lx,ly,cx,cy+s*0.85],fill=c,width=w); d.line([rx,ry,cx,cy+s*0.85],fill=c,width=w)
    d.ellipse([cx-s*0.16,topcy-s*0.16,cx+s*0.16,topcy+s*0.16],fill=c)
def ic_rfid(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.11))
    d.rounded_rectangle([cx-s*0.6,cy-s*0.4,cx+s*0.2,cy+s*0.4],radius=int(s*0.1),outline=c,width=w)
    for rr in (s*0.22,s*0.42,s*0.62): d.arc([cx+s*0.05-rr,cy-rr,cx+s*0.05+rr,cy+rr],300,60,fill=c,width=w)
def ic_files(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.11))
    d.line([(cx-s*0.55,cy-s*0.4),(cx-s*0.1,cy-s*0.4),(cx+s*0.02,cy-s*0.22),(cx+s*0.55,cy-s*0.22)],fill=c,width=w,joint="curve")
    d.rounded_rectangle([cx-s*0.55,cy-s*0.22,cx+s*0.55,cy+s*0.45],radius=int(s*0.08),outline=c,width=w)
def ic_scripts(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.13))
    d.line([(cx-s*0.2,cy-s*0.5),(cx-s*0.55,cy),(cx-s*0.2,cy+s*0.5)],fill=c,width=w,joint="curve")
    d.line([(cx+s*0.2,cy-s*0.5),(cx+s*0.55,cy),(cx+s*0.2,cy+s*0.5)],fill=c,width=w,joint="curve")
    d.line([(cx+s*0.08,cy-s*0.55),(cx-s*0.08,cy+s*0.55)],fill=c,width=w)
def ic_clock(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.11)); r=s*0.7
    d.ellipse([cx-r,cy-r,cx+r,cy+r],outline=c,width=w)
    d.line([cx,cy,cx,cy-r*0.55],fill=c,width=w); d.line([cx,cy,cx+r*0.45,cy+r*0.15],fill=c,width=w)
def ic_others(d,cx,cy,s,c,bg):
    r=s*0.15
    for dx in (-s*0.4,0,s*0.4): d.ellipse([cx+dx-r,cy-r,cx+dx+r,cy+r],fill=c)
def ic_config(d,cx,cy,s,c,bg):
    w=max(2,int(s*0.1)); R=s*0.72; teeth=8
    for i in range(teeth):
        a=i*2*math.pi/teeth
        d.line([cx+math.cos(a)*R*0.78,cy+math.sin(a)*R*0.78,cx+math.cos(a)*R,cy+math.sin(a)*R],fill=c,width=int(s*0.24))
    d.ellipse([cx-R*0.64,cy-R*0.64,cx+R*0.64,cy+R*0.64],outline=c,width=w)
    d.ellipse([cx-R*0.24,cy-R*0.24,cx+R*0.24,cy+R*0.24],fill=c)

ICONS={"wifi":ic_wifi,"ble":ic_ble,"rf":ic_rf,"nrf":ic_nrf,"lora":ic_lora,"fm":ic_fm,"ir":ic_ir,
"ethernet":ic_eth,"gps":ic_gps,"rfid":ic_rfid,"files":ic_files,"interpreter":ic_scripts,
"clock":ic_clock,"others":ic_others,"config":ic_config}

def fit_font(text,maxw,start):
    sz=start
    while sz>16:
        f=font(sz); bb=f.getbbox(text)
        if bb[2]-bb[0]<=maxw: return f
        sz-=2
    return font(16)

def render(active_idx, P):
    img=Image.new("RGB",(CW,CH),P["page"]); d=ImageDraw.Draw(img)
    n=len(ITEMS)
    cx,cy=82*SS,70*SS
    R=60*SS; r=30*SS; rim=6*SS
    midR=(R+r)/2; step=360/n; start=-90-step/2
    for i in range(n):
        a0=start+i*step
        d.pieslice([cx-R,cy-R,cx+R,cy+R],a0,a0+step, fill=(P["act_slice"] if i==active_idx else P["slice"]))
    for i in range(n):
        a=math.radians(start+i*step)
        d.line([cx+math.cos(a)*r,cy+math.sin(a)*r,cx+math.cos(a)*R,cy+math.sin(a)*R],fill=P["divider"],width=max(1,SS))
    d.ellipse([cx-R-rim,cy-R-rim,cx+R+rim,cy+R+rim],outline=P["rim"],width=rim+SS)
    d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=P["hub"])
    d.ellipse([cx-r,cy-r,cx+r,cy+r],outline=P["hub_ring"],width=max(1,SS))
    gs=10.5*SS
    for i,(key,_lab) in enumerate(ITEMS):
        a=math.radians(start+i*step+step/2)
        gx=cx+math.cos(a)*midR; gy=cy+math.sin(a)*midR
        col=P["act_glyph"] if i==active_idx else P["glyph"]
        ICONS[key](d,gx,gy,gs,col,P["act_slice"] if i==active_idx else P["slice"])
    label=ITEMS[active_idx][1]
    tx=160*SS
    f=fit_font(label,(W-166)*SS,42*SS)
    bb=f.getbbox(label)
    d.text((tx,cy-(bb[3]+bb[1])/2),label,font=f,fill=P["title"])
    return img.resize((W,H),Image.LANCZOS)

def rgb565(c):
    r,g,b=c; return (r>>3<<11)|(g>>2<<5)|(b>>3)

def build():
    for vname,P in VARIANTS.items():
        vdir=os.path.join(ROOT,vname)
        if os.path.isdir(vdir): shutil.rmtree(vdir)
        os.makedirs(vdir)
        cfg={}
        for i,(key,_lab) in enumerate(ITEMS):
            render(i,P).save(os.path.join(vdir,key+".png"))
            cfg[key]=key+".png"
        cfg.update({"priColor":P["priColor"],"secColor":P["secColor"],"bgColor":P["bgColor"],
                    "border":0,"label":0})
        with open(os.path.join(vdir,"theme.json"),"w") as fp: json.dump(cfg,fp,indent=2)
        print("built",vname)

if __name__=="__main__":
    build()
