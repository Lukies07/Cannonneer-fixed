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

// Keypress event to switch between ball types
window.addEventListener('keydown', function(event) {
    if (event.key === '1') {
        cannonBallType = 'gravityBall';
        console.log('Selected: Gravity Ball');
    } else if (event.key === '2') {
        cannonBallType = 'bouncyBall';
        console.log('Selected: Bouncy Ball');
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
        ctx.fillStyle = 'black';
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
    
    cannonBall.vx = cannonBall.speed * Math.cos(cannon.angle - Math.PI / 2);
    cannonBall.vy = cannonBall.speed * Math.sin(cannon.angle - Math.PI / 2);
}

function updateCannonBallPosition() {
    if (cannonBall.summoned) {
        if (cannonBallType === 'gravityBall') {
            // Gravity ball behavior
            cannonBall.vy += cannonBall.gravity; // Apply gravity
        } else if (cannonBallType === 'bouncyBall') {
            // Bouncy ball behavior
            handleBouncyBallCollision(); // Check and handle bounces
        }
        
        cannonBall.x += cannonBall.vx;
        cannonBall.y += cannonBall.vy;
        
        // Reset if ball goes out of bounds
        if (cannonBall.x < 0 || cannonBall.x > canvas.width || cannonBall.y < 0 || cannonBall.y > canvas.height & cannonBallType != "gravityBall" ) {
            cannonBall.summoned = false;
        }
    }
}

function handleBouncyBallCollision() {
    // If the ball hits the left or right wall, reverse the x velocity
    if (cannonBall.x - cannonBall.radius <= 0 || cannonBall.x + cannonBall.radius >= canvas.width) {
        cannonBall.vx = -cannonBall.vx;
        cannonBall.bounces++;
    }
    // If the ball hits the top or bottom wall, reverse the y velocity
    if (cannonBall.y - cannonBall.radius <= 0 || cannonBall.y + cannonBall.radius >= canvas.height) {
        cannonBall.vy = -cannonBall.vy;
        cannonBall.bounces++;
    }
}

function drawblocks() {
    if (currentLevel && currentLevel.blocks) {
        ctx.fillStyle = 'brown';
        currentLevel.blocks.forEach((block, index) => {
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
    drawCannonBall();
    requestAnimationFrame(loop);
}

loop();