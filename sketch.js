const CANVAS_SIZE = {x: 320, y: 320}
const oscilloScreenColour = "#00ff0c";

var canvasSz;
var canvasResolutionScale;

var backgroundImg;
var numbers = [];

var time = 0;

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
    loadNumberSprites();
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
    setCanvasSize();
    //Method for nearest-neighbour image scaling:
    //https://github.com/processing/p5.js/issues/1845
    var c = createCanvas(CANVAS_SIZE.x * canvasResolutionScale, CANVAS_SIZE.y * canvasResolutionScale).elt;
    var ctx = c.getContext('2d');
    ctx.mozImageSmoothingEnabled = false; //Not needed for firefox anymore
    ctx.webkitImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
}

function windowResized()
{
    setCanvasSize();
    resizeCanvas(CANVAS_SIZE.x * canvasResolutionScale, CANVAS_SIZE.y * canvasResolutionScale)
}

function draw()
{
    background(200);
    imageMode(CORNER);
    image(backgroundImg, 0, 0, width, height);
    scale(canvasResolutionScale);
    ellipseMode(CENTER);
    noFill();
    strokeWeight(1 * canvasResolutionScale);
    stroke(oscilloScreenColour);
    time = time + (1 / frameRate());
    ellipse(CANVAS_SIZE.x / 2, CANVAS_SIZE.y * 0.53, ((time / 2) % 1) * 270);
}
