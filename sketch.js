const CANVAS_SIZE = {x: 320, y: 320}
const oscilloScreenSize = 280;
const oscilloScreenColour = "#00ff0c";
const oscilloBackgroundColor = "#1d1d1d";
const moveSpeed = 7;
const sizeAtFront = 30;
const radarDiameter = oscilloScreenSize;
const ringSpawnTime = 2.0;
const maxRingSpawnTime = 0.5;
const scoreForMaxRingSpawnTime = 3000;

var currentRingSpawnTime = ringSpawnTime;

const bulletSpeed = 50;
const bulletSizeAtFront = 15;

const hitSafetyBuffer = 0.05;

const blastGrowSpeed = 50;
const blastMaxSize = 70;
const blastLifetime = 3;
const blastColours = ["#f7b100", "#f74600"]
const blastColourFrequency = 10;

const bombSpawnScore = 100;

const scorePosition = {x: 257, y: 28 - 6} //Furthest on the X, middle on the Y. 6 is 1/2 the height of the number sprites

var canvasSz;
var canvasResolutionScale;

var helpImg;
var backgroundImg;
var numbers = [];

var time = 0;

var hits = [];
var blasts = [];

var scanline;

var score = 0;

var attackTimer = 0;
var attackFrequency = 0.2;

var nukedScreen;
var nukedOpacity;
var nukedColor = "#f7b100";
var nukedFadeTime = 2.0;
var nukedTimer = 0;
var nukedHoldTime = 0.5;

const GM_START = 0;
const GM_GAME = 1;
const GM_GAMEOVER = 2;
var gameMode = GM_START;
var gameover = false;

var attackSound;
var enemyDieSound;
var friendlyDieSound;
var explosionSound;

var nukedMusic;
var normalMusic;

function addScore(sc)
{
    score += sc;
    if (score > 99999) score = 99999;
    else if (score < 0) score = 0;
}

function deltaTime()
{
    return 1 / getFrameRate();
}

const HT_ENEMY = 0;
const HT_FRIENDLY = 1;
const HT_BOMB = 2;
const HT_BULLET = 3;

var nextID = 0;

class HitPoint
{
    constructor(hitType, forcedDirection)
    {
        this.id = nextID;
        this.killNextFrame = false;
        this.dead = false;
        nextID = (nextID + 1) % 500000; //Make sure the ID will never overflow
        this.position = createVector(0, 0);
        if (forcedDirection == null)
        {
            this.direction = p5.Vector.random2D();
        }
        else
        {
            this.direction = forcedDirection;
        }
        this.type = hitType;
    }

    update()
    {
        if (this.killNextFrame)
        {
            return this;
        }

        var distScale = this.position.mag() / (oscilloScreenSize / 2);
        if (this.type != HT_BULLET)
        {
            this.position.add(p5.Vector.mult(this.direction, moveSpeed * deltaTime()));
        }
        else
        {
            this.position.add(p5.Vector.mult(this.direction, bulletSpeed * deltaTime())); // max(pow(distScale, 1) * bulletSpeed, 5)
            for (var i = 0; i < hits.length; i++)
            {
                if (hits[i].id == this.id || hits[i].id == -1) continue; //Don't coliide with ourselves!

                var otherDistScale = hits[i].position.mag() / (oscilloScreenSize / 2);

                if (otherDistScale < hitSafetyBuffer && hits[i].type != HT_ENEMY) continue; // Ignore very close things if they aren't enemies. Prevents accidental shooting.

                if (collideCircleCircle(this.position.x, this.position.y, this.getSize(), hits[i].position.x, hits[i].position.y, hits[i].getSize()))
                {
                    this.killNextFrame = true;
                    hits[i].shot();
                    return hits[i]; //Return the thing we hit.
                }
            }
        }

        if (distScale > 1)
        {
            if (this.type == HT_ENEMY)
            {
                //Oh no! End game trigger!
                gameOver();
            }
            else if (this.type == HT_FRIENDLY)
            {
                addScore(5);
            }

            return this;
        }
    }

    shot()
    {
        this.dead = true;
        this.killNextFrame = true; //In case it never gets cleaned up manually (from explosion etc)
        if (this.type == HT_ENEMY)
        {
            addScore(10);
            enemyDieSound.play();
        }
        else if (this.type == HT_FRIENDLY)
        {
            addScore(-50);
            friendlyDieSound.play();
        }
        else if (this.type == HT_BOMB)
        {
            explosionSound.play();
            blasts.push(new BombBlast(this.position));
        }
    }

    getSize()
    {
        if (this.type != HT_BULLET)
        {
            return pow(this.position.mag() / oscilloScreenSize, 0.7) * sizeAtFront;
        }
        else
        {
            return pow(this.position.mag() / oscilloScreenSize, 0.7) * bulletSizeAtFront;
        }
    }

    draw()
    {
        if (this.type == HT_ENEMY) //Draw as a circle
        {
            push();
            stroke('red');
            ellipse(this.position.x, this.position.y, this.getSize());
            pop();
        }
        else if (this.type == HT_FRIENDLY) //Draw as a square
        {
            push();
            angleMode(RADIANS);
            rectMode(CENTER);
            var angle = this.position.heading();
            translate(this.position.x, this.position.y);
            rotate(angle);
            var sz = this.getSize();
            rect(0, 0, sz, sz);
            pop();
        }
        else if (this.type == HT_BOMB)
        {
            push();
            stroke('yellow');
            angleMode(RADIANS);
            rectMode(CENTER);

            var sz = this.getSize();

            var angle = this.position.heading();
            translate(this.position.x, this.position.y);
            rotate(angle);
            //beginShape();
            var sides = 5;
            var accumAngle = 0;
            for (var i = 0; i < sides; i++)
            {
                var point = p5.Vector.fromAngle(radians(accumAngle));
                //vertex(point.x * (sz / 2), point.y * (sz / 2));
                line(0, 0, point.x * (sz / 2), point.y * (sz / 2));
                accumAngle += 360 / sides;
            }

            //endShape();
            pop();
        }
        else if (this.type == HT_BULLET)
        {
            push();
            ellipse(this.position.x, this.position.y, this.getSize());
            pop();
        }
        else
        {
            print("HitPoint has an invalid type!");
        }
    }
}

class BombBlast
{
    constructor(position)
    {
        this.position = position;
        this.time = 0;
        this.size = 0;
    }

    update()
    {
        this.time += deltaTime();
        this.size += blastGrowSpeed * deltaTime();
        if (this.size > blastMaxSize) this.size = blastMaxSize;

        for (var i = 0; i < hits.length; i++)
        {
            if (hits[i].type == HT_BOMB) continue; //Bombs can't detonate other bombs

            if (collideCircleCircle(this.position.x, this.position.y, this.size, hits[i].position.x, hits[i].position.y, hits[i].getSize()))
            {
                hits[i].shot();
            }
        }

        if (this.time > blastLifetime) return true;
        return false;
    }

    draw()
    {
        var colorChoice = floor((this.time * blastColourFrequency) % 2);
        push();
        noStroke();
        var c = color(blastColours[colorChoice]);
        fill(c);
        ellipse(this.position.x, this.position.y, this.size);
        pop();
    }
}

const scanlineRotationSpeed = 50;
class Scanline
{
    constructor()
    {
        this.angle = 0;
    }

    update()
    {
        this.angle = (this.angle + (scanlineRotationSpeed * deltaTime())) % 360;
    }

    draw()
    {
        var endPoint = p5.Vector.fromAngle(radians(this.angle));
        line(0, 0, endPoint.x * radarDiameter / 2, endPoint.y * radarDiameter / 2);
    }

    getDirection()
    {
        return p5.Vector.fromAngle(radians(this.angle));
    }
}

class Ring
{
    constructor()
    {
        this.size = 0;
    }

    update()
    {
        this.size += ((oscilloScreenSize) / currentRingSpawnTime) * deltaTime();
    }

    draw()
    {
        ellipse(0, 0, this.size);
    }
}

//Load pre-tinted numbers into the table since we can't have nice things like tinting at runtime.
function loadNumberSprites()
{
    for (var i = 0; i < 10; i++)
    {
        numbers[i] = loadImage("assets/numbers/g_" + i + ".png");
    }
}

function preload()
{
    loadNumberSprites();
    backgroundImg = loadImage("assets/background/game_background.png");
    helpImg = loadImage("assets/ui/start_message.png");
    nukedScreen = loadImage("assets/nuked/nuked_screen.png");
    nukedMusic = loadSound("assets/music/nuked_music.ogg");

    attackSound = loadSound("assets/sound/fire.wav");
    attackSound.playMode('sustain');
    enemyDieSound = loadSound("assets/sound/enemy.wav");
    enemyDieSound.playMode('sustain');
    friendlyDieSound = loadSound("assets/sound/friendly.wav");
    friendlyDieSound.playMode('sustain');
    explosionSound = loadSound("assets/sound/bomb.wav");
    explosionSound.playMode('sustain');
}

function setCanvasSize()
{
    // Get the highest resolution scale we can use at this screen resolution.
    var scaleY = floor(windowHeight / CANVAS_SIZE.y);
    var scaleX = floor(windowWidth / CANVAS_SIZE.x);
    canvasResolutionScale = min(scaleX, scaleY);
}

function setup()
{
    angleMode(DEGREES);
    setCanvasSize();
    frameRate(60);
    //Method for nearest-neighbour image scaling:
    //https://github.com/processing/p5.js/issues/1845
    var c = createCanvas(CANVAS_SIZE.x * canvasResolutionScale, CANVAS_SIZE.y * canvasResolutionScale).elt;
    var ctx = c.getContext('2d');
    ctx.mozImageSmoothingEnabled = false; //Not needed for firefox anymore
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    scanline = new Scanline();
}

function windowResized()
{
    setCanvasSize();
    resizeCanvas(CANVAS_SIZE.x * canvasResolutionScale, CANVAS_SIZE.y * canvasResolutionScale);
}

var hasBegun = false;

function gameOver()
{
    hasBegun = false;
    print("Game over!");
    setRSP();
    gameover = true;
    gameMode = GM_GAMEOVER;
    nukedMusic.play();
}

var mainRing;

function drawScore()
{
    var scoreString = score.toString();
    var drawXPos = scorePosition.x;
    for (var c = 0; c < scoreString.length; c++)
    {
        var stoi = parseInt(scoreString[c]); //THANKS JS...
        image(numbers[stoi], drawXPos, scorePosition.y);
        drawXPos += 10; //The width of a character sprite with 2 pixel spacing
    }
}

function setRSP()
{
    var rsp = lerp(ringSpawnTime, maxRingSpawnTime, score / scoreForMaxRingSpawnTime);
    if (rsp < maxRingSpawnTime) rsp = maxRingSpawnTime;
    currentRingSpawnTime = rsp;
}

function getRandomSpawnType()
{
    var allowBombs = score > bombSpawnScore;
    var rnd = random();
    if (rnd < 0.3 && allowBombs)
    {
        return HT_BOMB;
    }
    else if (rnd < 0.7)
    {
        return HT_ENEMY;
    }
    else
    {
        return HT_FRIENDLY;
    }
}

function draw()
{
    background(oscilloBackgroundColor);
    imageMode(CORNER);

    push();
    scale(canvasResolutionScale); //Draw using the same values, regardless of resolution scale

    if (gameMode == GM_GAME)
    {
        push();
        translate(CANVAS_SIZE.x / 2, CANVAS_SIZE.y * 0.53); //Put the world origin at the middle of the radar
        ellipseMode(CENTER);
        noFill();
        strokeWeight(max(0.3 * canvasResolutionScale, 1)); //The max() stops the lines becoming under 1 pixel wide at a scale of 1, but keeps them thin at higher scales
        stroke(oscilloScreenColour);

        time += deltaTime();

        if (time >= currentRingSpawnTime)
        {
            time = 0;
            mainRing = new Ring();
            setRSP();
            hits.push(new HitPoint(getRandomSpawnType()));
        }

        attackTimer += deltaTime();

        if (mainRing != null)
        {
            mainRing.update();
            mainRing.draw();
        }

        var hitsToRemove = [];

        for (var i = 0; i < hits.length; i++)
        {
            var kill = hits[i].update();
            hits[i].draw();

            if (kill != undefined)
            {
                hitsToRemove.push(kill);
            }
        }

        var blastsToRemove = [];

        for (var i = 0; i < hitsToRemove.length; i++)
        {
            if (hits.length == 1) //Of course javascript is broken: splice() on an array of length 1 duplicates it instead... why is there no remove()?
            {
                hits = []; //Manually clear it. Sigh.
            }
            else
            {
                hits.splice(hits.indexOf(hitsToRemove[i]), 1);
            }
        }

        for (var i = 0; i < blasts.length; i++)
        {
            if (blasts[i].update())
            {
                blastsToRemove.push(blasts[i]);
            }

            blasts[i].draw();
        }

        for (var i = 0; i < blastsToRemove.length; i++)
        {
            if (blasts.length == 1)
            {
                blasts = [];
            }
            else
            {
                blasts.splice(blasts.indexOf(blastsToRemove[i]), 1);
            }
        }

        scanline.update();
        scanline.draw();

        pop();

        if (gameover) //START END SCREEN WITH TIMER, THEN GO TO NUKED SCREEN
        {
            hits = []; //Clear it
            blasts = [];
            score = 0;
        }
    }
    else if (gameMode == GM_START)
    {
        image(helpImg, 0, 0);
    }

    if (gameMode == GM_GAME || gameMode == GM_START)
    {
        image(backgroundImg, 0, 0);
        drawScore();
    }
    else
    {
        image(nukedScreen, 0, 0);
    }

    pop();
}

function keyPressed()
{
    if (keyCode === 32) //Spacebar
    {
        if (gameMode == GM_START)
        {
            gameMode = GM_GAME;
        }
        else if (gameMode == GM_GAMEOVER)
        {
            gameMode == GM_START;
        }
        else
        {
            if (attackTimer >= attackFrequency)
            {
                attackTimer = 0;
                attackSound.play();
                hits.push(new HitPoint(HT_BULLET, scanline.getDirection()));
            }
        }
    }
    return false;
}
