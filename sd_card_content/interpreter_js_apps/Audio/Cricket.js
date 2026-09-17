// Device: M5Stack Cardputer/Adv/StickC 1.1/2/S3
// Made with: Bruce JS designer

const keyboard = require('keyboard');
const audio = require("audio");
const display = require('display');

const sprite = display.createSprite();

const tones = [
  [4500,4],
  [4600,4],
  [4700,4],
  [4800,4],
  [4900,4],
  [5000,4],
  [0,30],
  [4500,4],
  [4600,4],
  [4700,4],
  [4800,4],
  [4900,4],
  [5000,4],
  [0,40],
  [4500,4],
  [4600,4],
  [4700,4],
  [4800,4],
  [4900,4],
  [5000,4],
  [0,50]
];


draw();

while(true){
  if (keyboard.getEscPress(true)) break;
  
  if (keyboard.getSelPress(true)) {
        for (var i = 0; i < tones.length; i++) {
            audio.tone(tones[i][0], tones[i][1]);
        }
    }
    
   
}

function draw() {

display.fill(display.color(0, 0, 0));

display.setTextSize(3);
display.setTextColor(display.color(65, 248, 245));
display.setTextAlign("left", "top");
display.drawText("Cricket ", 60, 20);
display.setTextSize(1);
display.setTextColor(display.color(225, 168, 106));
display.setTextAlign("left", "top");
display.drawText("Press SELECT to play", 60, 50);

}