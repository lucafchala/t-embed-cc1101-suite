# Reference

## Globals:

`parseInt(str,radix)`  
`parseFloat(str)`  
`eval(code)`  
`isNaN(value)`  
`isFinite(value)`  
`gc()`  
`load(path)`  
`setTimeout(fn,ms)`  
`clearTimeout(id)`  
`setInterval(fn,ms)`  
`clearInterval(id)`  
`assert(condition,msg)`  
`require(module)`  
`now()`  
`delay(ms)`  
`random(min,max)`  
`parse_int(value)`  
`to_string(value)`  
`to_hex_string(value)`  
`to_lower_case(str)`  
`to_upper_case(str)`  
`atob(str)`  
`btoa(str)`  
`atob_bin(str)`  
`btoa_bin(data)`  
`exit()`  

## Array
### Static Methods:

`Array.isArray(value)`  

### Properties:

`array.length`  

### Methods:

`array.concat(other)`  
`array.push(item)`  
`array.pop()`  
`array.unshift(item)`  
`array.shift()`  
`array.join(separator)`  
`array.toString()`  
`array.reverse()`  
`array.slice(start, end)`  
`array.splice(start, deleteCount)`  
`array.fill(value, start, end)`  
`array.indexOf(item)`  
`array.lastIndexOf(item)`  
`array.every(fn)`  
`array.some(fn)`  
`array.forEach(fn)`  
`array.map(fn)`  
`array.filter(fn)`  
`array.reduce(fn)`  
`array.reduceRight(fn)`  
`array.sort(compareFn)`  

## Audio

`audio.playFile(path)`  
`audio.tone(freq, duration, volume)`  

## BadUSB

`badusb.setup()`  
`badusb.print(text)`  
`badusb.println(text)`  
`badusb.press(key)`  
`badusb.hold(key)`  
`badusb.release(key)`  
`badusb.releaseAll()`  
`badusb.pressRaw(code)`  
`badusb.runFile(path)`  

## BLE

`ble.scan(timeout)`  
`ble.advertise(data)`  
`ble.stopAdvertise()`  

## Buffer
### Static:

`Buffer.from(data, encoding)`  

### Methods:

`buffer.toString(encoding)`  

## Console

`console.log(value)`  

## Date

`Date.now()`  
`new Date(...) // Constructor supports up to 7 arguments.`  

## Device

`device.getName()`  
`device.getBoard()`  
`device.getModel()`  
`device.getBruceVersion()`  
`device.getBatteryCharge()`  
`device.getBatteryDetailed()`  
`device.getFreeHeapSize()`  
`device.getEEPROMSize()`  

## Dialog

`dialog.message(title, text)`  
`dialog.info(title, text)`  
`dialog.success(title, text)`  
`dialog.warning(title, text)`  
`dialog.error(title, text)`  
`dialog.choice(options)`  
`dialog.prompt(...)`  
`dialog.pickFile(path, filter)`  
`dialog.viewFile(path)`  
`dialog.viewText(title, text)`  
`dialog.createTextViewer(title, text)`  
`dialog.drawStatusBar()`  

## Display
### Screen Control:

`display.fill(color)`  
`display.width()`  
`display.height()`  
`display.getRotation()`  
`display.getBrightness()`  
`display.setBrightness(level, fade)`  
`display.restoreBrightness()`  

### Text:

`display.setCursor(x, y)`  
`display.print(text)`  
`display.println(text)`  
`display.setTextColor(color)`  
`display.setTextSize(size)`  
`display.setTextAlign(horizontal, vertical)`  
`display.drawText(x, y, text)`  
`display.drawString(x, y, text)`  

### Drawing:

`display.drawPixel(x, y, color)`  
`display.drawLine(x1, y1, x2, y2, color)`  
`display.drawWideLine(x1, y1, x2, y2, width, color)`  
`display.drawFastVLine(x, y, h, color)`  
`display.drawFastHLine(x, y, w, color)`  
`display.drawRect(x, y, w, h, color)`  
`display.drawFillRect(x, y, w, h, color)`  
`display.drawFillRectGradient(x, y, w, h, color1, color2, vertical)`  
`display.drawRoundRect(x, y, w, h, radius, color)`  
`display.drawFillRoundRect(x, y, w, h, radius, color)`  
`display.drawTriangle(x1, y1, x2, y2, x3, y3, color)`  
`display.drawFillTriangle(x1, y1, x2, y2, x3, y3, color)`  
`display.drawCircle(x, y, radius, color)`  
`display.drawFillCircle(x, y, radius, color)`  
`display.drawArc(x, y, radius, startAngle, endAngle, color)`  

### Images:

`display.drawBitmap(...)`  
`display.drawXBitmap(...)`  
`display.drawJpg(path, x, y, scale)`  
`display.drawGif(...)`  
`display.gifOpen(...)`  

### Sprites:

`display.createSprite(width, height)`  

### Sprite Object:

`A sprite supports nearly all Display drawing functions plus:`  
`sprite.pushSprite()`  
`sprite.deleteSprite()`  

## Function
### Prototype:

`fn.call(thisArg)`  
`fn.apply(thisArg, args)`  
`fn.bind(thisArg)`  
`fn.toString()`  

### Properties:

`fn.prototype`  
`fn.length`  
`fn.name`  

## Performance

`performance.now()`  

## Gif Object

`gif.gifPlayFrame(x, y, transparent)`  
`gif.gifDimensions()`  
`gif.gifReset()`  
`gif.gifClose()`  

## GPIO
### Digital:

`gpio.pinMode(pin, mode, pull)`  
`gpio.digitalRead(pin)`  
`gpio.digitalWrite(pin, value)`  

### Analog:

`gpio.analogRead(pin)`  
`gpio.touchRead(pin)`  
`gpio.analogWrite(pin, value)`  
`gpio.dacWrite(pin, value)`  

### PWM:

`gpio.analogWriteResolution(pin, bits)`  
`gpio.analogWriteFrequency(pin, freq)`  

### LEDC:

`gpio.ledcAttach(pin, channel, freq)`  
`gpio.ledcWrite(channel, duty)`  
`gpio.ledcWriteTone(channel, freq, duration)`  
`gpio.ledcFade(channel, duty, time)`  
`gpio.ledcChangeFrequency(channel, freq, resolution)`  
`gpio.ledcDetach(pin, channel, freq)`  

### Utility:

`gpio.pins()`  

## I2C

`i2c.begin(sda, scl, frequency)`  
`i2c.scan()`  
`i2c.write(address, register, data)`  
`i2c.read(address, length)`  
`i2c.writeRead(address, writeData, writeLen, readLen)`  

## IR

`ir.read(timeout)`  
`ir.readRaw(timeout)`  
`ir.transmitFile(path)`  
`ir.transmit(protocol, address, command)`  

## JSON

`JSON.parse(text, reviver)`  
`JSON.stringify(obj, replacer, space)`  

## Keyboard

`keyboard.keyboard(...)`  
`keyboard.numKeyboard(...)`  
`keyboard.hexKeyboard(...)`  
`keyboard.getKeysPressed()`  
`keyboard.getPrevPress(timeout)`  
`keyboard.getSelPress(timeout)`  
`keyboard.getEscPress(timeout)`  
`keyboard.getNextPress(timeout)`  
`keyboard.getAnyPress(timeout)`  
`keyboard.setLongPress(enabled)`  

## LED

`led.setColor(r, g, b)`  
`led.setBrightness(level)`  
`led.off()`  
`led.blink(times)`  

## Math
### Functions:

`Math.min(a, b)`  
`Math.max(a, b)`  
`Math.sign(x)`  
`Math.abs(x)`  
`Math.floor(x)`  
`Math.ceil(x)`  
`Math.round(x)`  
`Math.sqrt(x)`  
`Math.sin(x)`  
`Math.cos(x)`  
`Math.tan(x)`  
`Math.asin(x)`  
`Math.acos(x)`  
`Math.atan(x)`  
`Math.atan2(y, x)`  
`Math.exp(x)`  
`Math.log(x)`  
`Math.pow(base, exp)`  
`Math.random()`  
`Math.imul(a, b)`  
`Math.clz32(x)`  
`Math.fround(x)`  
`Math.trunc(x)`  
`Math.log2(x)`  
`Math.log10(x)`  
`Math.acosh(x)`  
`Math.asinh(x)`  
`Math.atanh(x)`  
`Math.is_equal(a, b, epsilon)`  

### Constants:

`Math.E`  
`Math.LN10`  
`Math.LN2`  
`Math.LOG2E`  
`Math.LOG10E`  
`Math.PI`  
`Math.SQRT1_2`  
`Math.SQRT2`  

## Menu

`menu.show(title, items)`  
`menu.showMainBorder(title)`  
`menu.showMainBorderWithTitle(title)`  
`menu.printTitle(text)`  
`menu.printSubtitle(text)`  
`menu.displayMessage(text)`  

## Mic

`mic.recordWav(path, duration)`  
`mic.captureSamples(count)`  

## Notification

`notification.blink(times)`  

## NRF24

`nrf24.begin(config)`  
`nrf24.send(address, data)`  
`nrf24.receive(timeout)`  
`nrf24.setChannel(channel)`  
`nrf24.isConnected()`  

## Number
### Static Methods:

`Number.parseInt(str, radix)`  
`Number.parseFloat(str)`  

### Constants:

`Number.MAX_VALUE`  
`Number.MIN_VALUE`  
`Number.NaN`  
`Number.NEGATIVE_INFINITY`  
`Number.POSITIVE_INFINITY`  
`Number.EPSILON`  
`Number.MAX_SAFE_INTEGER`  
`Number.MIN_SAFE_INTEGER`  

### Prototype Methods:

`num.toExponential(digits)`  
`num.toFixed(digits)`  
`num.toPrecision(digits)`  
`num.toString(radix)`  

## Object
### Static:

`Object.defineProperty(obj, prop, descriptor)`  
`Object.getPrototypeOf(obj)`  
`Object.setPrototypeOf(obj, proto)`  
`Object.create(proto, properties)`  
`Object.keys(obj)`  
`Object.getOwnPropertyNames(obj)`  

### Prototype:

`obj.hasOwnProperty(name)`  
`obj.toString()`  

## RegExp
### Properties:

`regex.lastIndex`  
`regex.source`  
`regex.flags`  

### Methods:

`regex.exec(str)`  
`regex.test(str)`  

## RFID
### Generic:

`rfid.read(timeout)`  
`rfid.readUID(timeout)`  
`rfid.write(data)`  
`rfid.save(path)`  
`rfid.load(path)`  
`rfid.clear()`  
`rfid.addMifareKey(key)`  

## Runtime

`runtime.toBackground()`  
`runtime.toForeground()`  
`runtime.isForeground()`  
`runtime.main(callback)`  

### SRIX:

`rfid.srixRead(timeout)`  
`rfid.srixWrite(data)`  
`rfid.srixSave(path)`  
`rfid.srixLoad(path)`  
`rfid.srixClear()`  
`rfid.srixWriteBlock(block, data)`  

## Serial

`serial.print(data)`  
`serial.println(data)`  
`serial.readln(timeout)`  
`serial.cmd(command)`  
`serial.write(data)`  

## Storage

`storage.readdir(path, recursive)`  
`storage.read(path, mode)`  
`storage.write(path, data, append, mode)`  
`storage.rename(oldPath, newPath)`  
`storage.remove(path)`  
`storage.mkdir(path)`  
`storage.rmdir(path)`  
`storage.spaceLittleFS()`  
`storage.spaceSDCard()`  

## String
### Static Methods:

`String.fromCharCode(...)`  
`String.fromCodePoint(...)`  

### Properties:

`str.length`  

### Methods:

`str.charAt(index)`  
`str.charCodeAt(index)`  
`str.codePointAt(index)`  
`str.slice(start, end)`  
`str.substr(start, length)`  
`str.substring(start, end)`  
`str.concat(other)`  
`str.indexOf(search)`  
`str.lastIndexOf(search)`  
`str.match(regex)`  
`str.replace(search, replacement)`  
`str.replaceAll(search, replacement)`  
`str.search(regex)`  
`str.split(separator, limit)`  
`str.toLowerCase()`  
`str.toUpperCase()`  
`str.trim()`  
`str.trimStart()`  
`str.trimEnd()`  
`str.toString()`  

## SubGHz

`subghz.transmitFile(path)`  
`subghz.transmit(freq, modulation, data, repeat)`  
`subghz.read(timeout)`  
`subghz.readRaw(timeout)`  
`subghz.setFrequency(freq)`  
`subghz.txSetup(freq)`  
`subghz.txPulses(pulses)`  
`subghz.txEnd()`  

## TextViewer Object
### Created via:

`dialog.createTextViewer(title, text)`  

### Methods:

`viewer.draw()`  
`viewer.scrollUp()`  
`viewer.scrollDown()`  
`viewer.scrollToLine(line)`  
`viewer.getLine(line)`  
`viewer.getMaxLines()`  
`viewer.getVisibleText()`  
`viewer.clear()`  
`viewer.setText(text)`  
`viewer.close()`  

## WiFi

`wifi.connected()`  
`wifi.connectDialog()`  
`wifi.connect(ssid, password, timeout)`  
`wifi.scan()`  
`wifi.disconnect()`  
`wifi.httpFetch(url, options)`  
`wifi.getMACAddress()`  
`wifi.getIPAddress()`  
