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

function updateGameInfo() {
    let gravityBallText = cannonBallType === 'gravityBall' ? '<strong>Gravity ball</strong>' : 'Gravity ball';
    let bouncyBallText = cannonBallType === 'bouncyBall' ? '<strong>Bouncy ball</strong>' : 'Bouncy ball';
    
    gameInfoElement.innerHTML = `
        ${gravityBallText}: <span style="color: green;">●</span><br>
        ${bouncyBallText}: <span style="color: black;">●</span><br>
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
        updateGameInfo(); // Update the game info when the ball type changes
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
    updateGameInfo();
}

// Update cannonball physics based on its type
function updateCannonBallPosition() {
    if (cannonBall.summoned) {
        // Gravity Ball
        if (cannonBallType === 'gravityBall') {
            cannonBall.vy += cannonBall.gravity; // Apply gravity
        }
        // Update position
        cannonBall.x += cannonBall.vx;
        cannonBall.y += cannonBall.vy;

        // Check if cannonball goes off the screen on the pos X and neg X
        if (cannonBall.x < 0 || cannonBall.x > canvas.width) {
            cannonBall.summoned = false;  // Allow new shot
        }
    }
}


// Handle block collisions
function handleBlockCollisions() {
    if (cannonBall.bounces >= 3) {
        cannonBall.summoned = false;  // Allows new shot
    }
}

function drawblocks() {
    if (currentLevel && currentLevel.block) {
        ctx.fillStyle = 'brown';
        currentLevel.block.forEach((block, index) => {
            ctx.fillRect(block.x, block.y, block.width, block.height);
            console.log(`block ${index} drawn at:`, block.x, block.y, block.width, block.height);
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
    drawEvilKing();
    drawCannon(cannon.angle);
    updateCannonBallPosition();
    handleBlockCollisions();
    drawCannonBall();
    updateGameInfo(); // Update the game info every frame
    requestAnimationFrame(loop);
}

// Call updateGameInfo initially to set the initial state
updateGameInfo();

loop();