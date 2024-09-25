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
    gravity: 0.2,
    bounces: 0,
    maxBounces: 5,
    drag: 0.02, 
    bounciness: 0.7,
    onGround: false,
    friction: 0.2,
    timeSinceLastMove: 0, // Time the cannonball has not moved
    idleThreshold: 0.5, // 0.5 seconds of idle time
    lastUpdateTime: Date.now() // For tracking time between updates
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
    let gravityBallText = cannonBallType === 'gravityBall' ? '<span style="font-size: 25px; font-weight: bold;">Gravity ball:</span>' : 'Gravity ball:';
    let bouncyBallText = cannonBallType === 'bouncyBall' ? '<span style="font-size: 25px; font-weight: bold;">Bouncy ball:</span>' : 'Bouncy ball:';

    // Initialize UI text with cannonball info
    let bouncesText = '';

    // Only show bounces remaining if the bouncy ball is selected
    if (cannonBallType === 'bouncyBall') {
        bouncesText = `<span style="color: grey; font-size: 25px;">Bounces left: </span> ${cannonBall.maxBounces - cannonBall.bounces}<br>`;
    }

    gameInfoElement.innerHTML = `
        ${gravityBallText} <span style="color: green; font-size: 35px;">●</span><br>
        ${bouncyBallText} <span style="color: black; font-size: 35px;">●</span><br>
        <span style=" color: black; font-size: 20px;">${bouncesText}</span><br>
        <span style="color: black; font-size: 20px;">Ammo left: ${cannonBall.ammo}</span><br><br>`
}

//made it so you can't change the cannonBall type when it i s summoned
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
        
        // Set the cannonBall ammo from the level data
        cannonBall.ammo = currentLevel.ammo || 0;
        
        // Set the max bounces for the cannonBall
        cannonBall.maxBounces = currentLevel.cannonBallmaxBounces || 5;
    } else {
        console.error(`Level ${levelNumber} not found in level data`);
    }
    
    resizeCanvas();
    updateGameUI(); // Update the UI with new ammo info
}

function updateCannonPosition(cannonData) {
    cannon.x = cannonData.x;
    cannon.y = cannonData.y;
    cannon.pivotPoint.x = cannon.x + cannon.width / 2;
    cannon.pivotPoint.y = cannon.y + cannon.height * (1 - cannon.pivotOffset);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

function resetCannonBall() {
    cannonBall.x = undefined;
    cannonBall.y = undefined;
    cannonBall.vx = 0;
    cannonBall.vy = 0;
    cannonBall.summoned = false;
    cannonBall.bounces = 0;
    cannonBall.onGround = false;
    cannonBall.timeSinceLastMove = 0;
    cannonBall.lastUpdateTime = Date.now();
}

function shootCannonBall() {
    resetCannonBall(); // Reset properties before shooting

    cannonBall.ammo--;
    cannonBall.summoned = true;

    let tipX = cannon.pivotPoint.x + ((cannon.height * 0.8) * (1 - cannon.pivotOffset)) * Math.cos(cannon.angle - Math.PI / 2);
    let tipY = cannon.pivotPoint.y + ((cannon.height * 0.8) * (1 - cannon.pivotOffset)) * Math.sin(cannon.angle - Math.PI / 2);

    cannonBall.x = tipX;
    cannonBall.y = tipY;

    // Calculate initial velocity
    cannonBall.vx = cannonBall.speed * Math.cos(cannon.angle - Math.PI / 2);
    cannonBall.vy = cannonBall.speed * Math.sin(cannon.angle - Math.PI / 2);
    updateGameUI();
}

// Update cannonball physics based on its type
function updateCannonBallPosition() {
    if (cannonBall.summoned) {
        const currentTime = Date.now();
        const deltaTime = (currentTime - cannonBall.lastUpdateTime) / 1000; // Time passed in seconds
        cannonBall.lastUpdateTime = currentTime;
        
        if (Math.abs(cannonBall.vx) < 0.1 && Math.abs(cannonBall.vy) < 0.1) {
            // Ball is moving very slowly or not at all
            cannonBall.timeSinceLastMove += deltaTime;
        } else {
            // Ball is moving, reset the idle timer
            cannonBall.timeSinceLastMove = 0;
        }

        // Despawn the cannonball if it's been idle for too long
        if (cannonBall.timeSinceLastMove >= cannonBall.idleThreshold) {
            cannonBall.summoned = false;
            cannonBall.timeSinceLastMove = 0; // Reset the idle time
            return; // Skip further processing since the ball is despawned
        }

        // Apply gravity and other physics like before
        if (cannonBallType === 'gravityBall') {
            cannonBall.vy += (cannonBall.gravity + cannonBall.drag * 0.75);

            if (cannonBall.vx > 0) {
                cannonBall.vx -= cannonBall.drag;
            } else if (cannonBall.vx < 0) {
                cannonBall.vx += cannonBall.drag;
            }

            if (!cannonBall.bouncing) {
                if (Math.abs(cannonBall.vx) < 0.05) {
                    cannonBall.vx = 0;
                }
            }
        }

        cannonBall.x += cannonBall.vx;
        cannonBall.y += cannonBall.vy;

        // Handle collisions with the floor and walls
        if (cannonBall.y + cannonBall.radius >= canvas.height) {
            cannonBall.y = canvas.height - cannonBall.radius;
            cannonBall.vy *= -1 * cannonBall.bounciness;

            if (Math.abs(cannonBall.vy) < 1) {
                cannonBall.onGround = true;
                if (cannonBall.onGround) {
                    if (cannonBall.vx > 0) {
                        cannonBall.vx -= cannonBall.friction;
                        if (cannonBall.vx < 0) cannonBall.vx = 0;
                    } else if (cannonBall.vx < 0) {
                        cannonBall.vx += cannonBall.friction;
                        if (cannonBall.vx > 0) cannonBall.vx = 0;
                    }
                }
            } else {
                cannonBall.onGround = false;
            }
        } else {
            cannonBall.onGround = false;
        }

        // Check if the ball goes off-screen
        if (cannonBall.x < 0 || cannonBall.x > canvas.width) {
            cannonBall.summoned = false;
        }

        handleCollisions();
        handleWallCollisions();
    }
}

function handleWallCollisions() {
    if (cannonBall.summoned) {
        // Check left wall
        if (cannonBall.x - cannonBall.radius < 0) {
            cannonBall.x = cannonBall.radius; // Move the ball outside the wall
            cannonBall.vx *= -1; // Reverse horizontal velocity
            if (cannonBallType === 'bouncyBall') {
                cannonBall.bounces++;
            }
        }
        
        // Check right wall
        if (cannonBall.x + cannonBall.radius > canvas.width) {
            cannonBall.x = canvas.width - cannonBall.radius; // Move the ball outside the wall
            cannonBall.vx *= -1; // Reverse horizontal velocity
            if (cannonBallType === 'bouncyBall') {
                cannonBall.bounces++;
            }
        }

        // Check for floor collision (bouncing)
        if (cannonBall.y + cannonBall.radius > canvas.height) {
            cannonBall.y = canvas.height - cannonBall.radius;
            if (cannonBallType == 'gravityBall') { // Move the ball outside the floor
                cannonBall.vy *= -1 * cannonBall.bounciness;  
            } else {
                cannonBall.vy *= -1;
            }

            if (cannonBallType === 'bouncyBall') {
                cannonBall.bounces++;
            }
        }

        // Check for roof collision
        if (cannonBallType === 'bouncyBall' && cannonBall.y - cannonBall.radius < 0) {
            cannonBall.y = cannonBall.radius;
            cannonBall.vy *= -1; // Reverse vertical velocity
            cannonBall.bounces++;
        }

        // Deactivate the ball after reaching max bounces
        if (cannonBall.bounces >= cannonBall.maxBounces) {
            cannonBall.summoned = false; // End the game after reaching the bounce limit
        }
    }
}

function handleCollisions() {
    if (cannonBall.summoned) {
        // Handle regular block collisions
        currentLevel.block.forEach(block => {
            if (circleRectCollision(cannonBall, block)) {
                handleBlockCollision(cannonBall, block);
            }
        });

        // Handle breakable block collisions
        currentLevel.breakableBlock = currentLevel.breakableBlock.filter(breakableBlock => {
            if (circleRectCollision(cannonBall, breakableBlock)) {
                handleBlockCollision(cannonBall, breakableBlock);
                return false; // Remove block after collision
            }
            return true; // Keep the block if no collision
        });
    }
}

// New function to handle block and breakable block collisions
function handleBlockCollision(cannonBall, block) {
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
    if (cannonBallType === 'bouncyBall') {
        cannonBall.bounces++;
    }

    // Deactivate the ball after reaching max bounces
    if (cannonBall.bounces >= cannonBall.maxBounces) {
        cannonBall.summoned = false;
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
        });
    }
}

function drawBreakableBlocks() {
    if (currentLevel && currentLevel.breakableBlock) {
        ctx.fillStyle = 'blue';
        currentLevel.breakableBlock.forEach((breakableBlock, index) => {
            ctx.fillRect(breakableBlock.x, breakableBlock.y, breakableBlock.width, breakableBlock.height);
        });
    }
}

function drawEvilKing() {
    if (currentLevel && currentLevel.evil_king && currentLevel.evil_king.length > 0) {
        const king = currentLevel.evil_king[0];
        ctx.fillStyle = 'red';
        ctx.fillRect(king.x, king.y, king.width, king.height);
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