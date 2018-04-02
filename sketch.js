const CANVAS_SIZE = {x: 320, y: 320}
const oscilloScreenColour = "#00ff0c";
const moveSpeed = 50;
const sizeAtFront = 30;
const radarDiameter = 270;

var canvasSz;
var canvasResolutionScale;

var backgroundImg;
var numbers = [];

var time = 0;

var hits = [];

var scanline;

function deltaTime()
{
    return 1 / getFrameRate();
}

class HitPoint
{
    constructor()
    {
        this.position = createVector(0, 0);
        this.direction = p5.Vector.random2D();
    }

    update()
    {
        this.position.add(p5.Vector.mult(this.direction, moveSpeed * deltaTime()));
    }

    draw()
    {
        ellipse(this.position.x, this.position.y, pow(this.position.mag() / 270, 0.7) * sizeAtFront);
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
        hits.push(new HitPoint());
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
    resizeCanvas(CANVAS_SIZE.x * canvasResolutionScale, CANVAS_SIZE.y * canvasResolutionScale)
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

function draw()
{
    synth();

    background(200);
    imageMode(CORNER);
    image(backgroundImg, 0, 0, width, height);
    scale(canvasResolutionScale); //Draw using the same values, regardless of resolution scale
    translate(CANVAS_SIZE.x / 2, CANVAS_SIZE.y * 0.53); //Put the world origin at the middle of the radar
    ellipseMode(CENTER);
    noFill();
    strokeWeight(1 * canvasResolutionScale);
    stroke(oscilloScreenColour);

    if (!hasBegun)
    return;

    time += deltaTime();
    ellipse(0, 0, ((time / 2) % 1) * 270);

    scanline.update();
    scanline.draw();

    for (var i = 0; i < hits.length; i++)
    {
        hits[i].update();
        hits[i].draw();
    }
}

function keyPressed()
{
    if (keyCode === 32) //Spacebar
    {
        hasBegun = true;
    }
    return false;
}
