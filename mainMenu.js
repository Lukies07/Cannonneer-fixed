let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let cannonImage = new Image();

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
window.addEventListener('resize', resizeCanvas);
cannonImage.onload = resizeCanvas;

resizeCanvas();

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

function updateCannonPosition() {
    cannon.x = (canvas.width - (cannon.width)) / 2;
    cannon.y = canvas.height - cannon.height;
    cannon.pivotPoint.x = cannon.x + cannon.width / 2;
    cannon.pivotPoint.y = cannon.y + cannon.height * (1 - cannon.pivotOffset);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateCannonPosition();
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

function getLevelBoundingBoxes() {
    const levels = ['level1', 'level2', 'level3'];
    return levels.map(levelId => {
        const element = document.getElementById(levelId);
        const rect = element.getBoundingClientRect();
        return {
            id: levelId,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
        };
    });
}

function isCollision(cannonBall, level) {
    const closestX = Math.max(level.x, Math.min(cannonBall.x, level.x + level.width));
    const closestY = Math.max(level.y, Math.min(cannonBall.y, level.y + level.height));
    
    const dx = cannonBall.x - closestX;
    const dy = cannonBall.y - closestY;
    
    return (dx * dx + dy * dy) < (cannonBall.radius * cannonBall.radius);
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCannon(cannon.angle);
    updateCannonBallPosition();
    drawCannonBall();

    if (cannonBall.summoned) {
        const levels = getLevelBoundingBoxes();
        for (let level of levels) {
            if (isCollision(cannonBall, level)) {
                console.log(`Cannonball hit ${level.id}`);
                const levelNumber = level.id.replace('level', '');
                cannonBall.summoned = false;
                window.location.href = `game.html?level=${levelNumber}`;
                break;
            }
        }
    }

    requestAnimationFrame(loop);
}

loop();