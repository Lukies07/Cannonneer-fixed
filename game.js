let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let cannonImage = new Image();

let levelData;
let currentLevel;

let cannon = {
    x: undefined,
    y: undefined,
    width: 80,
    height: 240,
    angle: undefined,
    pivotOffset: 0.166,
    pivotPoint: { x: undefined, y: undefined },
};

let cannonBall = {
    x: undefined,
    y: undefined,
    radius: 16,
    vx: 0,
    vy: 0,
    speed: 20,
    summoned: false,
    ammo: 10,
    gravity: 0.2, // Gravity acceleration
    bounces: 0,   // Number of bounces for the bouncy ball
    drag: 0.02, 
};

let cannonBallType = 'gravityBall'; // Default cannon ball mode
cannonImage.src = "images/cannon.png";

// Get the level number from the URL
const urlParams = new URLSearchParams(window.location.search);
const levelNumber = urlParams.get('level'); 

// Fetch level data
fetch('./levelData.json')
    .then(results => results.json())
    .then(data => {
        levelData = data;
        console.log('Loaded level data:', levelData);
        startLevel(levelNumber);
    })
    .catch(error => console.error('Error:', error));

window.addEventListener('resize', resizeCanvas);
cannonImage.onload = resizeCanvas;

canvas.addEventListener('mousemove', (event) => {
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    let dx = mouseX - cannon.pivotPoint.x;
    let dy = mouseY - cannon.pivotPoint.y;
    cannon.angle = Math.atan2(dy, dx) + Math.PI / 2;
});

canvas.addEventListener('click', function(event) {
    if (cannonBall.ammo > 0 && !cannonBall.summoned) {
        shootCannonBall();
    }
});

let gameInfoElement = document.getElementById('gameInfo');

//this is the UI
function updateGameUI() {
    let gravityBallText = cannonBallType === 'gravityBall' ? '<span style="font-size: 25px; font-weight: bold;">(press 1) Gravity ball:</span>' : '(press 1) Gravity ball:';
    let bouncyBallText = cannonBallType === 'bouncyBall' ? '<span style="font-size: 25px; font-weight: bold;">(press 2) Bouncy ball:</span>' : '(press 2) Bouncy ball:';
    
    gameInfoElement.innerHTML = `
        ${gravityBallText} <span style="color: green; font-size: 35px;">●</span><br>
        ${bouncyBallText} <span style="color: black; font-size: 35px;">●</span><br><br>
        Ammo left: ${cannonBall.ammo}`;
}


//made it so you can't change the cannonBall type when it is summoned
window.addEventListener('keydown', function(event) {
    if (!cannonBall.summoned) {
        if (event.key === '1') {
            cannonBallType = 'gravityBall';
            console.log('Selected: Gravity Ball');
        } else if (event.key === '2') {
            cannonBallType = 'bouncyBall';
            console.log('Selected: Bouncy Ball');
        }
        updateGameUI(); // Update the game info when the ball type changes
    }
});
function startLevel(levelNumber) {
    const levelKey = `level_${levelNumber}`;
    currentLevel = levelData[levelKey];
    
    if (currentLevel) {
        console.log('Starting level:', levelKey, currentLevel);
        updateCannonPosition(currentLevel.cannon[0]);
    } else {
        console.error(`Level ${levelNumber} not found in level data`);
    }
    
    resizeCanvas();
}

function updateCannonPosition(cannonData) {
    cannon.x = cannonData.x;
    cannon.y = cannonData.y;
    cannon.pivotPoint.x = cannon.x + cannon.width / 2;
    cannon.pivotPoint.y = cannon.y + cannon.height * (1 - cannon.pivotOffset);
    console.log('Updated cannon position:', cannon);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('Canvas resized:', canvas.width, 'x', canvas.height);
}

function drawCannon(angle = 0) {
    ctx.save();
    ctx.translate(cannon.pivotPoint.x, cannon.pivotPoint.y);
    ctx.rotate(angle);
    ctx.drawImage(cannonImage, -cannon.width / 2, -cannon.height * (1 - cannon.pivotOffset), cannon.width, cannon.height);
    ctx.restore();
}

function drawCannonBall() {
    if (cannonBall.summoned) {
        ctx.beginPath();
        ctx.arc(cannonBall.x, cannonBall.y, cannonBall.radius, 0, 2 * Math.PI);
        if (cannonBallType == 'gravityBall') {
            ctx.fillStyle = 'green';
        }
        else {
            ctx.fillStyle = 'black'; 
        }
        ctx.fill();
        ctx.closePath();
    }
}

function shootCannonBall() {
    cannonBall.ammo--;
    cannonBall.summoned = true;
    cannonBall.bounces = 0; // Reset bounce count for bouncy ball
    
    let tipX = cannon.pivotPoint.x + ((cannon.height * 0.8) * (1 - cannon.pivotOffset)) * Math.cos(cannon.angle - Math.PI / 2);
    let tipY = cannon.pivotPoint.y + ((cannon.height * 0.8) * (1 - cannon.pivotOffset)) * Math.sin(cannon.angle - Math.PI / 2);
    
    cannonBall.x = tipX;
    cannonBall.y = tipY;
    
    //I used SOH CAH TOA (not TOA) to calc angle
    cannonBall.vx = cannonBall.speed * Math.cos(cannon.angle - Math.PI / 2);
    cannonBall.vy = cannonBall.speed * Math.sin(cannon.angle - Math.PI / 2);
    updateGameUI();
}

// Update cannonball physics based on its type
function updateCannonBallPosition() {
    if (cannonBall.summoned) {
        if (cannonBallType === 'gravityBall') {
            cannonBall.vy += (cannonBall.gravity + cannonBall.drag * 0.75); // Apply gravity

            // Apply drag based on direction
            if (cannonBall.vx > 0) {
                cannonBall.vx -= cannonBall.drag; // Moving right, reduce velocity
            } else if (cannonBall.vx < 0) {
                cannonBall.vx += cannonBall.drag; // Moving left, increase velocity
            }

            // Check if the ball is rolling
            if (!cannonBall.bouncing) {
                // Reduce velocity as it rolls
                if (Math.abs(cannonBall.vx) < 0.1) {
                    cannonBall.vx = 0; // Stop rolling
                }
            }
        }

        // Update position based on velocity
        cannonBall.x += cannonBall.vx;
        cannonBall.y += cannonBall.vy;

        // Check if cannonball goes off the screen
        if (cannonBall.x < 0 || cannonBall.x > canvas.width) {
            cannonBall.summoned = false; // Allow new shot
        }

        // Handle collisions after updating position
        handleCollisions();
        handleWallCollisions(); // Check for wall collisions
    }
}



function handleWallCollisions() {
    if (cannonBall.summoned) {
        // Check left wall
        if (cannonBall.x - cannonBall.radius < 0) {
            cannonBall.x = cannonBall.radius; // Move the ball outside the wall
            cannonBall.vx *= -1; // Reverse horizontal velocity
        }
        
        // Check right wall
        if (cannonBall.x + cannonBall.radius > canvas.width) {
            cannonBall.x = canvas.width - cannonBall.radius; // Move the ball outside the wall
            cannonBall.vx *= -1; // Reverse horizontal velocity
        }

        // Check for floor collision (bouncing)
        if (cannonBall.y + cannonBall.radius > canvas.height) {
            cannonBall.y = canvas.height - cannonBall.radius; // Move the ball outside the floor
            cannonBall.vy *= -1; // Reverse vertical velocity
        }
    }
}

function handleCollisions() {
    if (cannonBall.summoned) {
        currentLevel.block.forEach(block => {
            if (circleRectCollision(cannonBall, block)) {
                // Determine the side of the collision
                let overlapX = Math.min(cannonBall.x + cannonBall.radius - block.x, block.x + block.width - cannonBall.x - cannonBall.radius);
                let overlapY = Math.min(cannonBall.y + cannonBall.radius - block.y, block.y + block.height - cannonBall.y - cannonBall.radius);
                
                if (overlapX < overlapY) {
                    // Horizontal collision
                    if (cannonBall.vx > 0) {
                        cannonBall.x = block.x - cannonBall.radius; // Move the ball outside the block
                    } else {
                        cannonBall.x = block.x + block.width + cannonBall.radius; // Move the ball outside the block
                    }
                    cannonBall.vx *= -1; // Reverse horizontal velocity
                } else {
                    // Vertical collision
                    if (cannonBall.vy > 0) {
                        cannonBall.y = block.y - cannonBall.radius; // Move the ball outside the block
                    } else {
                        cannonBall.y = block.y + block.height + cannonBall.radius; // Move the ball outside the block
                    }
                    cannonBall.vy *= -1; // Reverse vertical velocity
                }
                
                // Handle bounces
                if (cannonBallType == 'bouncyBall') {
                    cannonBall.bounces++;
                }
        
                if (cannonBall.bounces >= 3) { // Limit the number of bounces if needed
                    cannonBall.summoned = false; // End the game after a certain number of bounces
                }
            }
        });
    }
}

// Helper function for circle-rectangle collision detection
function circleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
}

function drawblocks() {
    if (currentLevel && currentLevel.block) {
        ctx.fillStyle = 'black';
        currentLevel.block.forEach((block, index) => {
            ctx.fillRect(block.x, block.y, block.width, block.height);
            console.log(`block ${index} drawn at:`, block.x, block.y, block.width, block.height);
        });
    }
}

function drawBreakableBlocks() {
    if (currentLevel && currentLevel.breakableBlock) {
        ctx.fillStyle = 'blue';
        currentLevel.breakableBlock.forEach((breakableBlock, index) => {
            ctx.fillRect(breakableBlock.x, breakableBlock.y, breakableBlock.width, breakableBlock.height);
            console.log(`breakableBlock ${index} drawn at:`, breakableBlock.x, breakableBlock.y, breakableBlock.width, breakableBlock.height);
        });
    }
}

function drawEvilKing() {
    if (currentLevel && currentLevel.evil_king && currentLevel.evil_king.length > 0) {
        const king = currentLevel.evil_king[0];
        ctx.fillStyle = 'red';
        ctx.fillRect(king.x, king.y, king.width, king.height);
        console.log('Evil king drawn at:', king.x, king.y, king.width, king.height);
    }
}
//i had Ai temporarily implement this
function drawDebugGrid() {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fillText(x.toString(), x, 10);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fillText(y.toString(), 0, y);
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDebugGrid();
    drawblocks();
    drawBreakableBlocks();
    drawEvilKing();
    drawCannon(cannon.angle);
    updateCannonBallPosition();
    handleCollisions();
    drawCannonBall();
    updateGameUI(); // Update the game info every frame
    requestAnimationFrame(loop);
}
// Call updateGameUI initially to set the initial state
updateGameUI();
loop();