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
    speed: 10,
    summoned: false,
    ammo: 1000
};

cannonImage.src = "images/cannon.png";

// Fetch level data
fetch('./levelData.json')
    .then(response => response.json())
    .then(data => {
        levelData = data;
        // Get the level from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        currentLevel = urlParams.get('level') || '1';
        startLevel(currentLevel);
    })
    .catch(error => console.error('Error loading level data:', error));

window.addEventListener('resize', resizeCanvas);
cannonImage.onload = resizeCanvas;

canvas.addEventListener('mousemove', (event) => {
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    let dx = mouseX - cannon.pivotPoint.x;
    let dy = mouseY - cannon.pivotPoint.y;
    cannon.angle = Math.atan2(dy, dx) + Math.PI / 2;
    drawCannon(cannon.angle);
});

canvas.addEventListener('click', function(event) {
    if (cannonBall.ammo > 0 && !cannonBall.summoned) {
        shootCannonBall();
    }
});

function startLevel(levelNumber) {
    const levelKey = `level_${levelNumber}`;
    const levelConfig = levelData.levels.find(level => level[levelKey])[levelKey];
    
    updateCannonPosition(levelConfig.cannon[0]);
    // Here you would also set up platforms, evil king, etc.
    
    resizeCanvas();
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
    drawCannon();
}

function drawCannon(angle = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    
    let tipX = cannon.pivotPoint.x + ((cannon.height*0.8) * (1 - cannon.pivotOffset)) * Math.cos(cannon.angle - Math.PI / 2);
    let tipY = cannon.pivotPoint.y + ((cannon.height*0.8) * (1 - cannon.pivotOffset)) * Math.sin(cannon.angle - Math.PI / 2);
    
    cannonBall.x = tipX;
    cannonBall.y = tipY;
    
    cannonBall.vx = cannonBall.speed * Math.cos(cannon.angle - Math.PI / 2);
    cannonBall.vy = cannonBall.speed * Math.sin(cannon.angle - Math.PI / 2);
}

function updateCannonBallPosition() {
    if (cannonBall.summoned) {
        cannonBall.x += cannonBall.vx;
        cannonBall.y += cannonBall.vy;
        if (cannonBall.x < 0 || cannonBall.x > canvas.width || cannonBall.y < 0 || cannonBall.y > canvas.height) {
            cannonBall.summoned = false;
        }
    }
}

function drawPlatforms() {
    // Implement platform drawing based on level data
}

function drawEvilKing() {
    // Implement evil king drawing based on level data
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCannon(cannon.angle);
    updateCannonBallPosition();
    drawCannonBall();
    drawPlatforms();
    drawEvilKing();
    requestAnimationFrame(loop);
}

loop();