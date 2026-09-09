# Gib's scripts for Bruce firmware

This is a combined repository of all the little bits of code I wrote. Some are even pretty useful, some are just an exercise but still fun, in my opinion.

## So what's what?

### LumixControl 

Is a replacement for the terrible `Panasonic Image App` that's been annoying me whenever I needed a remote shutter. So I sniffed and prodded and got this little gem. It lets you snap photos, record videos and even preview your images on the screen! Yes, they're just thumbnails but it's enough to at least see if it's exposed correctly. It also allows you to download full resolution files and videos too, directly to your device!

### TransmitMenu

Is an app that allows you to put all your frequently used IR and SubGHz codes in one place. No more scrolling through dozens of files to find one. Now they're all neatly sorted and easily accessible. It even extracts single IR commands and caches them into separate files so there's no spamming of all the saved commands.

### ChannelGraph

Pretty straightforward channel graph. Now you can easily see the congestion around you. Also displays a list of network SSIDs with their RSSIs and channels on the side. To quit press esc when it's not scanning

### RSSIGraph

Something has been missing from the tools so I wrote it myself. A simple bar graph showing RSSI of a selected SSID. Nothing too fancy. You can change the SSID by holding select for a bit due to the code scanning for networks pretty often. I don't think there's a better way, using the tools at hand that is. If you do then	please feel free to let me know about it! To quit hold escape key for a bit (same reason as mentioned above) or press escape when presented with SSID choices.

### AllPlayer

Is a fun little RTTTS (think Nokia ringtones) files. It can read eithe a directory of files or one file with melodies (one per line). A gimmick? Yes. Useful? Kinda - you can always make people laugh when you play a melody from doom or mario... (NokiaPlayer was a first version, it sneaked in so I'm leaving it here but it's not updated, nor good)

### LunarLander

Is a rendition of a classic retro game with the same name. Controls are pretty straightforward - next/prev to rotate, select to engage the thrusters and esc to quit. Goal is simple - land softly on the pad.

### Goblin

Is a game in which your main goal is to annoy humans and finally win the uneven fight against them. There are two modes, move and act. You can switch between them by tapping esc key. Prev/next move between options in each mode. To quit hold esc for > 3s. Goal of the game is 20 chaos and 5 nest. Good luck!

### PoolShark

A tiny version of billiards. It's in its infancy and many things need to be added etc. But core gameplay seems to work - you can hit the cue ball, it can hit other balls, they scatter all around and even can go into the pockets! What are you waiting for? Just give it a try! You'll be astonished what can be done on such a tiny device

### TextEdit

Very basic text editor. I figured out that it might be just good enough when in a pinch and without any other way of modifying files. But yeah, it's barebones and was just an exercise.

### BouncyBalls

This one is fun! Yes, it's just a bunch of bouncing balls... But those have physics! Mass! They collide! And all that with pretty decent framerate too! Use next to spawn more, prev to despawn random, select to nudge random, esc to quit. This was also an exercise that was fun! Go ahead, try playing with it

### ShapeSpam/PixelFun/TrippyShark

Basically the same codebase but with different intents. Plans changed so now they're all in here. Another exercise but with interesting results. I wanted to go through the display library and experiment and this is the outcome. Randomness is fun

### BoilerPlate

Is my go-to template to start fresh projects with ease, not much to say about it

### BitSPlay

This one just represents a dec value in binary using some graphics, one of the first projects, purely for the exercise

### Cube3D

Another simple exercise, name should tell it all. There's not much more to it

## [Reference](reference.md)

Pretty much every function available in the Bruce interpreter. Sorted alphabetically

## Bugs found

### dialog.message()

dialog.message(str, {left: "LEFT", center: "CENTER" right: "RIGHT"}) should always return keys. But it doesn't. For some reason right is broken and instead it returns the value

### ir.transmitFile()
### serial.cmd(ir tx_from_file)
### IR SpamAll from file menu

Both of those commands suffer from the same issue. They don't transmit anything. Tried that on a couple files and it's refusing to transmit anything in those modes of operation. I had to work around it by reading the files and sending it via serial.cmd(ir tx) which might fail when someone will try to use a raw file, I'm sure
