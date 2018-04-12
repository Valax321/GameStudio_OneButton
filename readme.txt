Air Raid 2023 By Andrew Castillo
----------------------------------------

Your goal is to shoot down enemy aircraft by targeting them with your radar.
Watch out for friendly aircraft.
Bombs spawn when your score is above 100, and will destroy any enemy or friendly aircraft caught in the blast.

*This is a game full of fun arcade action for the whole family!*

Controls:
SPACE: fire your anti-aircraft gun.

DEVELOPMENT
-----------------------

Uses p5.js, p5.sound, and p5.collide.

An important aspect in this game is that it uses a 'fixed' resolution of 320x320 for the rendering.
If the player's screen is larger than this, the game will scale up by a fixed integer amount (2x, 3x etc.).
This was implemented using some maths to calculate the scaling, and using p5's scale() function.
This allows the game code to always assume a resolution of 320x320, even though the game can stay large on-screen.

I also used a trick to allow for nearest-neighbour scaling on p5.js's GitHub page, allowing the pixel style to be retained at high resolutions.

ISSUES
------------------------

As with the last project, the lack of a useful tint function put some limitations on what I could do with pre-drawn graphics. I had to pre-tint the number sprites green.
However, all the game's main visuals are drawn using the shapes built into p5, which means colouring them is fast. While I would have liked to have less abstract graphics
for the aircraft, it would have probably been more difficult to work with due to some of p5.js's limitations.
