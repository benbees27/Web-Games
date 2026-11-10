// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game variables
let arenaRadius = 300; // Initial arena radius
const shrinkRate = 0.5; // Pixels per second
const pulses = []; // Active pulses
let score = 0; // Player score
let pulseSpawnTimer = null; // Holds the current timer ID

// Player object
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 15,
  color: '#48BF91',
  speed: 5,
  dx: 0,
  dy: 0, // Directional velocity
};

// Handle keyboard input for movement
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') player.dy = -player.speed;
  if (event.key === 'ArrowDown') player.dy = player.speed;
  if (event.key === 'ArrowLeft') player.dx = -player.speed;
  if (event.key === 'ArrowRight') player.dx = player.speed;
});

document.addEventListener('keyup', (event) => {
  if (['ArrowUp', 'ArrowDown'].includes(event.key)) player.dy = 0;
  if (['ArrowLeft', 'ArrowRight'].includes(event.key)) player.dx = 0;
});

// Update player position
function updatePlayer() {
  player.x += player.dx;
  player.y += player.dy;

  // Keep player inside the arena
  const distanceFromCenter = Math.sqrt(
    (player.x - canvas.width / 2) ** 2 + (player.y - canvas.height / 2) ** 2
  );
  if (distanceFromCenter > arenaRadius - player.radius) {
    const angle = Math.atan2(player.y - canvas.height / 2, player.x - canvas.width / 2);
    player.x = canvas.width / 2 + Math.cos(angle) * (arenaRadius - player.radius);
    player.y = canvas.height / 2 + Math.sin(angle) * (arenaRadius - player.radius);
  }
}

// Draw the player
function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.fill();
}

function spawnRandomPulse() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (arenaRadius - 20);
    const x = canvas.width / 2 + Math.cos(angle) * distance;
    const y = canvas.height / 2 + Math.sin(angle) * distance;

    pulses.push({
        x,
        y,
        radius: 10,
        maxRadius: 150,
        speed: 0.5,
        preSpawn: true, // Indicates it's in the pre-spawn phase
        preSpawnDuration: 60, // Frames for the warning dot
    });
}

// Initial spawn interval in milliseconds
let spawnInterval = 2000;

// Function to spawn a pulse and schedule the next one
function spawnPulseWithDynamicInterval() {
    spawnRandomPulse();

    spawnInterval = Math.max(500, spawnInterval * 0.95);

    pulseSpawnTimer = setTimeout(spawnPulseWithDynamicInterval, spawnInterval);
}

// Start the dynamic pulse spawning
setTimeout(spawnPulseWithDynamicInterval, spawnInterval);

// Update and draw pulses
function updatePulses() {
    pulses.forEach((pulse, index) => {
        if (pulse.preSpawn) {
            ctx.beginPath();
            ctx.arc(pulse.x, pulse.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fill();

            pulse.preSpawnDuration -= 1;

            if (pulse.preSpawnDuration <= 0) {
                pulse.preSpawn = false;
            }
        } else {
            pulse.radius += pulse.speed;
            if (pulse.radius > pulse.maxRadius) {
                pulses.splice(index, 1);
            } else {
                ctx.beginPath();
                const waveAmplitude = 4;
                const waveFrequency = 8;
                for (let angle = 0; angle <= Math.PI * 2; angle += 0.2) {
                    const waveOffset = Math.sin(angle * waveFrequency) * waveAmplitude;
                    const x = pulse.x + (pulse.radius + waveOffset) * Math.cos(angle);
                    const y = pulse.y + (pulse.radius + waveOffset) * Math.sin(angle);
                    if (angle === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.strokeStyle = 'rgb(255, 0, 208)';
                ctx.stroke();
            }
        }
    });
}

// Check for collisions between the player and pulses
function checkCollisions() {
    pulses.forEach((pulse, index) => {
        const distance = Math.sqrt((player.x - pulse.x) ** 2 + (player.y - pulse.y) ** 2);

        if (distance < pulse.radius + player.radius) {
            alert('Game Over!');
            resetGame();
        }
    });
}

// Update the score
function updateScore() {
    score += 1;
}

// Draw the score
function drawScore() {
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${score}`, 10, 30);
}

// Reset the game
function resetGame() {
    arenaRadius = 300;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    score = 0;
    pulses.length = 0;

    if (pulseSpawnTimer) {
        clearTimeout(pulseSpawnTimer);
        pulseSpawnTimer = null;
    }

    spawnInterval = 2000;
    pulseSpawnTimer = setTimeout(spawnPulseWithDynamicInterval, spawnInterval); 
}

// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, arenaRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    arenaRadius -= shrinkRate * (1 / 60);
    if (arenaRadius <= 0) {
        alert('Game Over!');
        resetGame();
    }

    updatePlayer();
    drawPlayer();
    updatePulses();
    updateScore();
    drawScore();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

gameLoop();
