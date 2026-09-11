function main() {
    // Costanti del gioco
    var SCREEN_WIDTH = width();
    var SCREEN_HEIGHT = height();
    var CENTER_X = parseInt(SCREEN_WIDTH / 2);
    var CENTER_Y = parseInt(SCREEN_HEIGHT / 2);

    // Colori
    var BLACK = color(0, 0, 0);
    var WHITE = color(255, 255, 255);
    var GREEN = color(0, 255, 0);
    var RED = color(255, 0, 0);
    var BLUE = color(0, 0, 255);
    var YELLOW = color(255, 255, 0);
    var GRAY = color(128, 128, 128);
    var DARK_GRAY = color(64, 64, 64);
    var ORANGE = color(255, 165, 0);
    var PURPLE = color(128, 0, 128);

    // Variabili di gioco
    var currentAngle = 0;
    var targetNumbers = [];
    var currentTarget = 0;
    var foundNumbers = [];
    var gameState = "menu";
    var attempts = 3;
    var gameStartTime = 0;
    var difficulty = 1;
    var isExiting = false;
    var flashTime = 0;
    var showFlash = false;
    var flashType = "";
    var lastTimerUpdate = 0;
    var timeLeft = 5000;
    var timerActive = false;
    var lastSecond = -1;  // Per tracciare il cambio di secondo
    var timerNeedsRedraw = false;
    
    // Input handling ISTANTANEO
    var lastRotationTime = 0;
    var ROTATION_COOLDOWN = 0;
    
    // Variabili per stati precedenti input (per edge detection)
    var prevWasPressed = false;
    var nextWasPressed = false;
    var selWasPressed = false;
    var escWasPressed = false;
    
    // Flag per ridisegno solo quando necessario
    var needsRedraw = true;
    var lastGameState = "";

    // Funzioni helper
    function arrayIncludes(arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === value) return true;
        }
        return false;
    }

    function arrayJoin(arr, separator) {
        var result = "";
        for (var i = 0; i < arr.length; i++) {
            if (i > 0) result += separator;
            result += arr[i];
        }
        return result;
    }

    function randomInt(max) {
        return parseInt(Math.random() * max);
    }

    function abs(x) { return x < 0 ? -x : x; }
    function min(a, b) { return a < b ? a : b; }
    function max(a, b) { return a > b ? a : b; }

    function generateTargetSequence() {
        targetNumbers = [];
        var numCount = 3;
        if (difficulty === 2) numCount = 3;
        if (difficulty === 3) numCount = 4;
        
        for (var i = 0; i < numCount; i++) {
            var num;
            var attempts = 0;
            do {
                var maxNum = (difficulty === 1) ? 30 : 10; // Facile: 1-30, Altri: 1-10
                num = 1 + randomInt(maxNum);
                attempts++;
            } while (arrayIncludes(targetNumbers, num) && attempts < 50);
            targetNumbers[targetNumbers.length] = num;
        }
    }

    function getDifficultyName() {
        if (difficulty === 1) return "FUN (3 num)";
        if (difficulty === 2) return "NORMAL (3 num)";
        if (difficulty === 3) return "HARD (4 num)";
        return "FUN";
    }

    // Suoni
    function playMenuSound() {
        // Rimosso il suono dei bottoni
    }

    function playTickSound() {
        tone(200, 100);
        delay(50);
    }

    function playSuccessSound() {
        tone(4000, 100);
        delay(50);
        tone(5000, 100);
        delay(50);
        tone(6000, 150);
    }

    function playErrorSound() {
        tone(1000, 150);
        delay(30);
        tone(800, 200);
    }

    function playLoseSound() {
        tone(300, 200);
        delay(50);
        tone(150, 300);
    }

    function playVictorySound() {
        tone(2000, 150);
        delay(50);
        tone(3000, 150);
        delay(50);
        tone(4000, 200);
        delay(100);
        tone(5000, 300);
        delay(100);
        tone(6000, 400);  // Beep finale più acuto
    }

    // FUNZIONI ROTAZIONE
    function rotateLeft() {
        var maxNum = (difficulty === 1) ? 30 : 10;
        currentAngle = currentAngle > 1 ? currentAngle - 1 : maxNum;
    }

    function rotateRight() {
        var maxNum = (difficulty === 1) ? 30 : 10;
        currentAngle = currentAngle < maxNum ? currentAngle + 1 : 1;
    }

    // RENDERING
    function clearScreen() {
        drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, BLACK);
    }

    function drawMenu() {
        clearScreen();
        
        setTextColor(WHITE);
        setTextSize(2);
        drawString("SAFE", CENTER_X - 28, 15);
        
        // GitHub link spostato un po' più a sinistra e in alto
        setTextColor(GRAY);
        setTextSize(1);
        drawString("github.com/ssstee", SCREEN_WIDTH - 110, 10);
        
        setTextSize(1);
        drawString("UNLOCK THE SAFE!", CENTER_X - 50, 40);
        
        drawSafeIcon(CENTER_X - 30, 60);
        
        setTextColor(YELLOW);
        setTextSize(1);
        var diffText = "Diff: " + getDifficultyName();
        drawString(diffText, CENTER_X - 55, 120);
        
        setTextColor(WHITE);
        drawString("SEL: Play", CENTER_X - 35, 140);
        drawString("PREV/NEXT: Difficulty", CENTER_X - 70, 155);
        drawString("ESC: Exit", CENTER_X - 30, 170);
        
        setTextColor(GREEN);
        drawString("Attempts: " + attempts, CENTER_X - 40, 185);
    }

    function drawSafeIcon(x, y) {
        drawFillRect(x, y, 60, 40, DARK_GRAY);
        drawRect(x, y, 60, 40, WHITE);
        drawFillRect(x + 45, y + 15, 8, 10, GRAY);
        drawFillRect(x + 15, y + 12, 16, 16, BLACK);
        drawRect(x + 15, y + 12, 16, 16, WHITE);
        drawFillRect(x + 21, y + 18, 4, 4, WHITE);
    }

    function drawGame() {
        clearScreen();
        
        if (showFlash) {
            var flashColor = (flashType === "success") ? GREEN : RED;
            drawFillRect(0, 0, SCREEN_WIDTH, 25, flashColor);
        }
        
        drawSafeDial();
        drawGameInfo();
        drawFoundNumbers();
        drawHints();
        
        // Draw timer for all modes
        if (gameState === "playing") {
            var timerWidth = 50;
            var timerHeight = 10;
            var timerX = SCREEN_WIDTH - timerWidth - 5;
            var timerY = SCREEN_HEIGHT - timerHeight - 5;
            
            drawFillRect(timerX, timerY, timerWidth, timerHeight, RED);
            
            var maxTime = (difficulty === 1) ? 4000 : 10000;
            var remainingWidth = parseInt((timeLeft / maxTime) * timerWidth);
            if (remainingWidth > 0) {
                drawFillRect(timerX, timerY, remainingWidth, timerHeight, GREEN);
            }
        }
    }

    function drawSafeDial() {
        var dialRadius = min(SCREEN_WIDTH, SCREEN_HEIGHT) / 4;
        var centerX = CENTER_X;
        var centerY = CENTER_Y - 10;
        
        // Cerchio esterno
        drawFillRect(centerX - dialRadius - 3, centerY - dialRadius - 3, 
                    (dialRadius + 3) * 2, (dialRadius + 3) * 2, DARK_GRAY);
        
        // Cerchio del quadrante
        drawFillRect(centerX - dialRadius, centerY - dialRadius, 
                    dialRadius * 2, dialRadius * 2, BLACK);
        
        // Centro del quadrante (più grande)
        drawFillRect(centerX - 12, centerY - 12, 24, 24, WHITE);
        drawFillRect(centerX - 10, centerY - 10, 20, 20, BLACK);
        
        // Numeri sul quadrante
        var maxNum = (difficulty === 1) ? 30 : 10;  // Corretto il range per la visualizzazione
        
        if (difficulty === 1) {
            // Per la modalità FUN, mostra 1, 5, 10, 15, 20, 25, 30
            var funNumbers = [1, 5, 10, 15, 20, 25, 30];
            for (var i = 0; i < funNumbers.length; i++) {
                var j = funNumbers[i];
                var angle = ((j-1) * (360 / maxNum)) * 3.14159 / 180;
                var x = centerX + parseInt(Math.cos(angle - 3.14159/2) * (dialRadius - 20));
                var y = centerY + parseInt(Math.sin(angle - 3.14159/2) * (dialRadius - 20));
                
                setTextColor(WHITE);
                setTextSize(1);
                drawString("" + j, x - 3, y - 3);
            }
        } else {
            // Per le altre modalità, mostra tutti i numeri da 1 a 10
            for (var j = 1; j <= maxNum; j++) {
                var angle = ((j-1) * (360 / maxNum)) * 3.14159 / 180;
                var x = centerX + parseInt(Math.cos(angle - 3.14159/2) * (dialRadius - 20));
                var y = centerY + parseInt(Math.sin(angle - 3.14159/2) * (dialRadius - 20));
                
                setTextColor(WHITE);
                setTextSize(1);
                drawString("" + j, x - 3, y - 3);
            }
        }
        
        // Indicatore corrente (triangolino rosso)
        var currentAngleRad = ((currentAngle-1) * (360 / maxNum)) * 3.14159 / 180;
        var indicatorDist = dialRadius - 2;  // Più vicino al bordo esterno
        var indicatorX = centerX + parseInt(Math.cos(currentAngleRad - 3.14159/2) * indicatorDist);
        var indicatorY = centerY + parseInt(Math.sin(currentAngleRad - 3.14159/2) * indicatorDist);
        
        // Disegna un semplice triangolino rosso riempito
        var size = 4;
        var angle = currentAngleRad - 3.14159/2;
        
        // Calcola i tre punti del triangolo (punta verso il numero)
        var p1x = indicatorX - parseInt(Math.cos(angle) * size * 2);  // Punta verso il numero
        var p1y = indicatorY - parseInt(Math.sin(angle) * size * 2);
        var p2x = indicatorX + parseInt(Math.cos(angle + 1.3) * size);  // Base del triangolo
        var p2y = indicatorY + parseInt(Math.sin(angle + 1.3) * size);
        var p3x = indicatorX + parseInt(Math.cos(angle - 1.3) * size);
        var p3y = indicatorY + parseInt(Math.sin(angle - 1.3) * size);
        
        // Disegna il triangolino riempito
        // Prima il contorno
        drawLine(p1x, p1y, p2x, p2y, RED);
        drawLine(p2x, p2y, p3x, p3y, RED);
        drawLine(p3x, p3y, p1x, p1y, RED);
        
        // Poi il riempimento
        var minX = min(p1x, min(p2x, p3x));
        var maxX = max(p1x, max(p2x, p3x));
        var minY = min(p1y, min(p2y, p3y));
        var maxY = max(p1y, max(p2y, p3y));
        
        for (var y = minY; y <= maxY; y++) {
            for (var x = minX; x <= maxX; x++) {
                // Riempi se il punto è dentro il triangolo
                if ((x - p1x) * (p2y - p1y) - (y - p1y) * (p2x - p1x) >= 0 &&
                    (x - p2x) * (p3y - p2y) - (y - p2y) * (p3x - p2x) >= 0 &&
                    (x - p3x) * (p1y - p3y) - (y - p3y) * (p1x - p3x) >= 0) {
                    drawFillRect(x, y, 1, 1, RED);
                }
            }
        }
        
        // Bordo del quadrante
        drawRect(centerX - dialRadius, centerY - dialRadius, 
                 dialRadius * 2, dialRadius * 2, WHITE);
                 
        // Numero selezionato a destra
        setTextColor(WHITE);
        setTextSize(2);
        drawString("" + currentAngle, centerX + dialRadius + 20, centerY);
    }

    function drawGameInfo() {
        setTextColor(WHITE);
        setTextSize(1);
        
        if (attempts > 1) {
            setTextColor(WHITE);
            drawString("Attempts: " + attempts, 5, 5);
        } else if (attempts === 1) {
            setTextColor(ORANGE);
            drawString("LAST ATTEMPT!", 5, 5);
        } else {
            setTextColor(RED);
            drawString("GAME OVER", 5, 5);
        }
        
        setTextColor(GREEN);
        drawString("Found: " + foundNumbers.length + "/" + targetNumbers.length, 5, 20);
        
        setTextColor(GRAY);
        drawString("github.com/ssstee", 5, SCREEN_HEIGHT - 15);
    }

    function drawFoundNumbers() {
        if (foundNumbers.length === 0) return;
        
        setTextColor(GREEN);
        setTextSize(1);
        var text = "Found: " + arrayJoin(foundNumbers, ",");
        drawString(text, SCREEN_WIDTH - 80, 5);
    }

    function drawHints() {
        if (difficulty === 1 && currentTarget < targetNumbers.length) {
            var targetNum = targetNumbers[currentTarget];
            var distance = abs(currentAngle - targetNum);
            
            var hintColor, hintText;
            
            // Sistema di hint per modalità facile
            if (distance === 0) {
                hintColor = GREEN; hintText = "CORRECT"; // Exact match
            } else if (distance <= 4) {
                hintColor = YELLOW; hintText = "Very hot"; // Very close - within 4 numbers
            } else if (distance <= 8) {
                hintColor = ORANGE; hintText = "Close"; // Close
            } else if (distance <= 15) {
                hintColor = BLUE; hintText = "Warm"; // Warm
            } else {
                hintColor = PURPLE; hintText = "Cold"; // Cold
            }
            
            setTextColor(hintColor);
            setTextSize(1);
            drawString(hintText, CENTER_X - 25, SCREEN_HEIGHT - 35);
        }
    }

    function drawWinScreen() {
        drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, GREEN);
        
        setTextColor(BLACK);
        setTextSize(2);
        drawString("VICTORY!", CENTER_X - 50, CENTER_Y - 30);
        
        setTextColor(BLACK);
        setTextSize(1);
        var timeElapsed = parseInt((now() - gameStartTime) / 1000);
        drawString("Time: " + timeElapsed + "s", CENTER_X - 35, CENTER_Y);
        
        drawString("Code:", CENTER_X - 35, CENTER_Y + 15);
        drawString(arrayJoin(targetNumbers, ", "), CENTER_X - 25, CENTER_Y + 27);
        
        setTextColor(color(0, 100, 0));
        drawString("SEL to play again", CENTER_X - 50, SCREEN_HEIGHT - 20);
    }

    function drawLoseScreen() {
        drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, RED);
        
        setTextColor(WHITE);
        setTextSize(2);
        drawString("YOU LOST!", CENTER_X - 50, CENTER_Y - 30);
        
        setTextSize(1);  // Testo più piccolo per code e found
        setTextColor(WHITE);
        drawString("Code:", CENTER_X - 35, CENTER_Y);
        drawString(arrayJoin(targetNumbers, ", "), CENTER_X - 25, CENTER_Y + 12);
        
        if (foundNumbers.length > 0) {
            drawString("Found:", CENTER_X - 35, CENTER_Y + 30);
            drawString(arrayJoin(foundNumbers, ", "), CENTER_X - 25, CENTER_Y + 42);
        }
        
        setTextColor(color(200, 200, 200));
        drawString("SEL to play again", CENTER_X - 50, SCREEN_HEIGHT - 20);
    }

    function drawExitScreen() {
        drawFillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, BLACK);
        setTextColor(WHITE);
        setTextSize(2);
        drawString("See you!", CENTER_X - 48, CENTER_Y);
        
        // Suono di arrivederci più lungo e melodico
        tone(1200, 150);
        delay(100);
        tone(1000, 150);
        delay(100);
        tone(800, 200);
        delay(100);
        tone(600, 250);
        
        // Aspetta un po' di più prima di chiudere
        delay(1000);
    }

    // INPUT HANDLING ISTANTANEO con edge detection
    function handleInput() {
        var currentTime = now();
        
        // Leggi stato corrente
        var prevPressed = getPrevPress();
        var nextPressed = getNextPress();
        var selPressed = getSelPress();
        var escPressed = getEscPress();
        
        // ESC
        if (escPressed && !escWasPressed) {
            isExiting = true;
            return;
        }
        escWasPressed = escPressed;
        
        // SEL
        if (selPressed && !selWasPressed) {
            // Suono SOLO se non premuto troppo velocemente
            if (currentTime - lastRotationTime > 150) {
                playMenuSound();
            }
            lastRotationTime = currentTime;
            needsRedraw = true;
            
            if (gameState === "menu") {
                startGame();
            } else if (gameState === "playing") {
                checkNumber();
            } else if (gameState === "won" || gameState === "lost") {
                resetGame();
            }
        }
        selWasPressed = selPressed;
        
        // PREV (sinistra) - Edge detection
        if (prevPressed && !prevWasPressed) {
            if (gameState === "menu") {
                difficulty = difficulty > 1 ? difficulty - 1 : 3;
                generateTargetSequence();
                // Suono SOLO se non premuto troppo velocemente
                if (currentTime - lastRotationTime > 150) {
                    playMenuSound();
                }
                lastRotationTime = currentTime;
                needsRedraw = true;
            } else if (gameState === "playing") {
                rotateLeft();
                needsRedraw = true;
            }
        }
        prevWasPressed = prevPressed;
        
        // NEXT (destra) - Edge detection
        if (nextPressed && !nextWasPressed) {
            if (gameState === "menu") {
                difficulty = difficulty < 3 ? difficulty + 1 : 1;
                generateTargetSequence();
                // Suono SOLO se non premuto troppo velocemente
                if (currentTime - lastRotationTime > 150) {
                    playMenuSound();
                }
                lastRotationTime = currentTime;
                needsRedraw = true;
            } else if (gameState === "playing") {
                rotateRight();
                needsRedraw = true;
            }
        }
        nextWasPressed = nextPressed;
    }

    function checkNumber() {
        var targetNum = targetNumbers[currentTarget];
        var tolerance = 0;
        
        var distance = abs(currentAngle - targetNum);
        timerActive = false;
        
        if (distance === 0) {
            showFlash = true;
            flashType = "success";
            flashTime = now();
            timeLeft = (difficulty === 1) ? 4000 : 10000;  // 4 secondi per FUN mode
            lastTimerUpdate = now();
            lastSecond = parseInt(timeLeft / 1000);
            
            foundNumbers[foundNumbers.length] = targetNum;
            currentTarget++;
            
            needsRedraw = true;
            playSuccessSound();
            delay(100);
            
            if (currentTarget >= targetNumbers.length) {
                gameState = "won";
            }
        } else {
            showFlash = true;
            flashType = "error";
            flashTime = now();
            if (difficulty !== 1) {
                timeLeft = 10000;
                lastTimerUpdate = now();
                lastSecond = parseInt(timeLeft / 1000);
            }
            
            attempts = attempts - 1;
            
            needsRedraw = true;
            playErrorSound();
            
            if (attempts <= 0) {
                gameState = "lost";
                playLoseSound();
            }
        }
    }

    function startGame() {
        var currentTime = now();
        gameState = "playing";
        currentAngle = 1;
        foundNumbers = [];
        currentTarget = 0;
        gameStartTime = currentTime;
        attempts = 3;
        flashTime = 0;
        showFlash = false;
        flashType = "";
        timeLeft = (difficulty === 1) ? 4000 : 10000;
        lastTimerUpdate = currentTime;
        lastSecond = parseInt(timeLeft / 1000);
        timerActive = true;
        needsRedraw = true;
    }

    function resetGame() {
        gameState = "menu";
        currentTarget = 0;
        foundNumbers = [];
        attempts = 3;
        showFlash = false;
        flashType = "";
        generateTargetSequence();
        needsRedraw = true;
    }

    // MAIN GAME LOOP ZERO-FLICKER
    function gameLoop() {
        var lastWinSoundTime = 0;
        var finalTimeElapsed = 0;
        
        while (!isExiting) {
            var nowTime = now();
            
            handleInput();
            
            // Timer logic for all modes
            if (gameState === "playing" && timerActive) {
                var deltaTime = nowTime - lastTimerUpdate;
                if (deltaTime > 0) {  // Solo se è passato del tempo
                    timeLeft = max(0, timeLeft - deltaTime);
                    lastTimerUpdate = nowTime;
                    
                    // Check for second change
                    var currentSecond = parseInt(timeLeft / 1000);
                    if (currentSecond !== lastSecond && timeLeft > 0) {
                        lastSecond = currentSecond;
                        timerNeedsRedraw = true;
                    }
                    
                    if (timeLeft === 0) {
                        if (difficulty === 1) {
                            attempts = 0;
                            gameState = "lost";
                            playLoseSound();
                        } else {
                            attempts = attempts - 1;
                            playErrorSound();
                            if (attempts <= 0) {
                                gameState = "lost";
                                playLoseSound();
                            } else {
                                timeLeft = 10000;
                                lastTimerUpdate = nowTime;
                                lastSecond = 10;
                            }
                        }
                        needsRedraw = true;
                    }
                }
            }
            
            // Gestione flash
            if (showFlash && nowTime - flashTime > 400) {
                showFlash = false;
                flashType = "";
                timerActive = true;
                lastTimerUpdate = nowTime;
                needsRedraw = true;
            }
            
            // Controlla se lo stato è cambiato
            if (gameState !== lastGameState) {
                if (gameState === "won") {
                    finalTimeElapsed = parseInt((nowTime - gameStartTime) / 1000);  // Memorizziamo il tempo finale quando si vince
                }
                needsRedraw = true;
                lastGameState = gameState;
            }
            
            // Rendering SOLO quando necessario
            if (needsRedraw || timerNeedsRedraw) {
                if (gameState === "menu") {
                    drawMenu();
                } else if (gameState === "playing") {
                    drawGame();
                } else if (gameState === "won") {
                    // Usiamo il tempo finale memorizzato invece di ricalcolarlo
                    gameStartTime = nowTime - (finalTimeElapsed * 1000);  // Aggiorniamo gameStartTime per mantenere il tempo costante
                    drawWinScreen();
                    if (nowTime - gameStartTime > 500 && nowTime - lastWinSoundTime > 3000) {
                        playVictorySound();
                        lastWinSoundTime = nowTime;
                    }
                } else if (gameState === "lost") {
                    drawLoseScreen();
                }
                needsRedraw = false;
                timerNeedsRedraw = false;
            }
        }
        
        drawExitScreen();
    }

    // Inizio
    generateTargetSequence();
    gameLoop();
}

main();