const CANVAS_SIZE = {x: 320, y: 320}
const oscilloScreenSize = 280;
const oscilloScreenColour = "#00ff0c";
const oscilloBackgroundColor = "#1d1d1d";
const moveSpeed = 10;
const sizeAtFront = 30;
const radarDiameter = oscilloScreenSize;
const ringSpawnTime = 2.0;

var canvasSz;
var canvasResolutionScale;

var helpImg;
var backgroundImg;
var numbers = [];

var time = 0;

var hits = [];

var scanline;

function deltaTime()
{
    return 1 / getFrameRate();
}

const HT_ENEMY = 0
const HT_FRIENDLY = 1
const HT_BOMB = 2

class HitPoint
{
    constructor(hitType)
    {
        this.position = createVector(0, 0);
        this.direction = p5.Vector.random2D();
        this.type = hitType;
    }

    update()
    {
        var distScale = this.position.mag() / oscilloScreenSize;
        this.position.add(p5.Vector.mult(this.direction, max(pow(distScale, 1) * moveSpeed, 5) * deltaTime()));
    }

    draw()
    {
        if (this.type == HT_ENEMY) //Draw as a circle
        {
            ellipse(this.position.x, this.position.y, pow(this.position.mag() / oscilloScreenSize, 0.7) * sizeAtFront);
        }
        else if (this.type == HT_FRIENDLY) //Draw as a square
        {
            push();
            angleMode(RADIANS);
            rectMode(CENTER);
            var angle = this.position.heading();
            translate(this.position.x, this.position.y);
            rotate(angle);
            var sz = pow(this.position.mag() / oscilloScreenSize, 0.7) * sizeAtFront;
            rect(0, 0, sz, sz);
            pop();
        }
        else if (this.type == HT_BOMB)
        {
            push();
            angleMode(RADIANS);
            rectMode(CENTER);
            var angle = this.position.heading();
            translate(this.position.x, this.position.y);
            rotate(angle);
            var sz = pow(this.position.mag() / oscilloScreenSize, 0.7) * sizeAtFront;
            rect(0, 0, sz, sz);
            rotate(radians(30));
            rect(0, 0, sz, sz);
            rotate(radians(30));
            rect(0, 0, sz, sz);
            pop();
        }
        else
        {
            print("HitPoint has an invalid type!");
        }
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
}

class Ring
{
    constructor()
    {
        this.size = 0;
    }

    update()
    {
        this.size += ((oscilloScreenSize) / ringSpawnTime) * deltaTime();
    }

    draw()
    {
        ellipse(0, 0, this.size);
    }
}

//Load pre-tinted numbers into the table since we can't have nice things like tinting at runtime.
function loadNumberSprites()
{
    numbers[0] = [];
    numbers[1] = [];
    for (var i = 0; i < 10; i++)
    {
        numbers[0][i] = loadImage("assets/numbers/b_" + i + ".png");
        numbers[1][i] = loadImage("assets/numbers/g_" + i + ".png");
    }
}

function preload()
{
    //loadNumberSprites();
    backgroundImg = loadImage("assets/background/game_background.png");
    helpImg = loadImage("assets/ui/start_message.png");
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

    for (var i = 0; i < 10; i++)
    {
        hits.push(new HitPoint(random([HT_ENEMY, HT_FRIENDLY, HT_BOMB])));
    }

    scanline = new Scanline();

    synthOsc = new p5.Oscillator();
    synthOsc.setType('square');
    synthOsc.amp(0);
    synthOsc.start();
}

function windowResized()
{
    setCanvasSize();
    resizeCanvas(CANVAS_SIZE.x * canvasResolutionScale, CANVAS_SIZE.y * canvasResolutionScale);
}

var hasBegun = false;

var synthOsc;
function synth()
{
    if (keyIsDown(71)) //G, C4
    {
        synthOsc.amp(0.5);
        synthOsc.freq(261.626);
    }
    else if (keyIsDown(70)) //F, B3
    {
        synthOsc.amp(0.5);
        synthOsc.freq(246.942);
    }
    else if (keyIsDown(72)) //H, D4
    {
        synthOsc.amp(0.5);
        synthOsc.freq(293.665);
    }
    else
    {
        synthOsc.amp(0);
    }
}

var mainRing;

function draw()
{
    synth();

    background(oscilloBackgroundColor);
    imageMode(CORNER);

    if (hasBegun)
    {
        push();
        scale(canvasResolutionScale); //Draw using the same values, regardless of resolution scale
        translate(CANVAS_SIZE.x / 2, CANVAS_SIZE.y * 0.53); //Put the world origin at the middle of the radar
        ellipseMode(CENTER);
        noFill();
        strokeWeight(max(0.3 * canvasResolutionScale, 1)); //The max() stops the lines becoming under 1 pixel wide at a scale of 1, but keeps them thin at higher scales
        stroke(oscilloScreenColour);

        time += deltaTime();

        if (time >= ringSpawnTime)
        {
            time = 0;
            mainRing = new Ring();
        }

        if (mainRing != null)
        {
            mainRing.update();
            mainRing.draw();
        }

        scanline.update();
        scanline.draw();

        for (var i = 0; i < hits.length; i++)
        {
            hits[i].update();
            hits[i].draw();
        }

        pop();
    }
    else
    {
        image(helpImg, 0, 0, width, height);
    }

    image(backgroundImg, 0, 0, width, height);
}

function keyPressed()
{
    if (keyCode === 32) //Spacebar
    {
        hasBegun = true;
    }
    return false;
}
