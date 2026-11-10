// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game variables
let arenaRadius = 250; // Initial arena radius
const shrinkRate = 0.5; // Pixels per second
const pulses = []; // Active pulses
const powerUps = []; // Active power-ups
const cancelPulses = []; // Canceling pulses
let score = 0; // Player score
let highScore = localStorage.getItem('highScore') || 0; // Get stored high score
let pulseSpawnTimer = null; // Holds the current timer ID
let powerUpSpawnTimer = null; // Holds the power-up spawn timer ID

// Update the initial high score display
document.getElementById('highScore').textContent = highScore;

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
  if (event.key === 'w') player.dy = -player.speed;
  if (event.key === 's') player.dy = player.speed;
  if (event.key === 'a') player.dx = -player.speed;
  if (event.key === 'd') player.dx = player.speed;
});

document.addEventListener('keyup', (event) => {
  if (['w', 's'].includes(event.key)) player.dy = 0;
  if (['a', 'd'].includes(event.key)) player.dx = 0;
});

// Add touch controls
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  
  // Update player velocity based on touch movement
  player.dx = (Math.abs(deltaX) > 10) ? Math.sign(deltaX) * player.speed : 0;
  player.dy = (Math.abs(deltaY) > 10) ? Math.sign(deltaY) * player.speed : 0;
  
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
});

canvas.addEventListener('touchend', () => {
  player.dx = 0;
  player.dy = 0;
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

    // Check distance from player before spawning
    const distanceFromPlayer = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
    if (distanceFromPlayer < 100) { // Don't spawn if too close to player
        return;
    }

    pulses.push({
        x,
        y,
        radius: 10,
        maxRadius: 150,
        speed: 0.5,
        preSpawn: true,
        preSpawnDuration: 60,
        warningPulse: 0, // For warning animation
        hue: Math.random() * 60 - 30 // Random hue variation for visual interest
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

// Function to spawn a power-up
function spawnPowerUp() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (arenaRadius - 20);
    const x = canvas.width / 2 + Math.cos(angle) * distance;
    const y = canvas.height / 2 + Math.sin(angle) * distance;

    powerUps.push({
        x,
        y,
        radius: 8,
        color: '#00f'
    });
}

// Start spawning power-ups
function startPowerUpSpawning() {
    powerUpSpawnTimer = setInterval(spawnPowerUp, 5000); // Spawn every 5 seconds
}

// Function to create a canceling pulse
function createCancelPulse(x, y) {
    cancelPulses.push({
        x,
        y,
        radius: 10,
        maxRadius: 200,
        speed: 2,
        color: 'rgba(0, 0, 255, 0.5)'
    });
}

// Update and draw pulses
function updatePulses() {
    pulses.forEach((pulse, index) => {
        if (pulse.preSpawn) {
            // Warning dot animation
            pulse.warningPulse = (pulse.warningPulse + 0.1) % (Math.PI * 2);
            const warningSize = 5 + Math.sin(pulse.warningPulse) * 2;
            
            // Draw outer glow
            ctx.beginPath();
            ctx.arc(pulse.x, pulse.y, warningSize + 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.fill();
            
            // Draw warning dot
            ctx.beginPath();
            ctx.arc(pulse.x, pulse.y, warningSize, 0, Math.PI * 2);
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
                // Draw pulse with glow effect
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(
                    pulse.x, pulse.y, pulse.radius - 5,
                    pulse.x, pulse.y, pulse.radius + 5
                );
                gradient.addColorStop(0, `hsla(${330 + pulse.hue}, 100%, 50%, 0.8)`);
                gradient.addColorStop(1, `hsla(${330 + pulse.hue}, 100%, 50%, 0)`);
                
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
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Add inner glow
                ctx.beginPath();
                ctx.arc(pulse.x, pulse.y, pulse.radius - 2, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${330 + pulse.hue}, 100%, 70%, 0.5)`;
                ctx.stroke();
            }
        }
    });
}

// Update and draw power-ups
function updatePowerUps() {
    powerUps.forEach((powerUp, index) => {
        // Draw power-up glow
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
            powerUp.x, powerUp.y, 0,
            powerUp.x, powerUp.y, powerUp.radius * 2
        );
        gradient.addColorStop(0, 'rgba(0, 150, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw power-up core
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00f';
        ctx.fill();

        // Add pulsing effect
        const pulseSize = Math.sin(Date.now() / 200) * 2;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.radius + pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.5)';
        ctx.stroke();

        // Check collision with player
        const distance = Math.sqrt((player.x - powerUp.x) ** 2 + (player.y - powerUp.y) ** 2);
        if (distance < powerUp.radius + player.radius) {
            powerUps.splice(index, 1);
            createCancelPulse(player.x, player.y);
        }
    });
}

// Update and draw cancel pulses
function updateCancelPulses() {
    cancelPulses.forEach((pulse, index) => {
        pulse.radius += pulse.speed;
        
        // Draw cancel pulse with gradient
        const gradient = ctx.createRadialGradient(
            pulse.x, pulse.y, pulse.radius - 10,
            pulse.x, pulse.y, pulse.radius + 10
        );
        gradient.addColorStop(0, 'rgba(0, 150, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add ripple effect
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.radius - 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.3)';
        ctx.stroke();
        
        // Check collision with regular pulses
        pulses.forEach((regPulse, regIndex) => {
            if (!regPulse.preSpawn) {
                const distance = Math.sqrt((pulse.x - regPulse.x) ** 2 + (pulse.y - regPulse.y) ** 2);
                if (distance < pulse.radius + regPulse.radius) {
                    pulses.splice(regIndex, 1);
                }
            }
        });

        // Remove cancel pulse when it reaches max radius
        if (pulse.radius > pulse.maxRadius) {
            cancelPulses.splice(index, 1);
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
    document.getElementById('currentScore').textContent = score;
    
    // Update high score if current score is higher
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
}

// Reset the game
function resetGame() {
    arenaRadius = 250;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    score = 0;
    document.getElementById('currentScore').textContent = '0';
    pulses.length = 0;
    powerUps.length = 0;
    cancelPulses.length = 0;

    if (pulseSpawnTimer) {
        clearTimeout(pulseSpawnTimer);
        pulseSpawnTimer = null;
    }

    if (powerUpSpawnTimer) {
        clearInterval(powerUpSpawnTimer);
        powerUpSpawnTimer = null;
    }

    spawnInterval = 2000;
    pulseSpawnTimer = setTimeout(spawnPulseWithDynamicInterval, spawnInterval);
    startPowerUpSpawning();
}

// Main game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, arenaRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#48BF91';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.lineWidth = 1;

    arenaRadius -= shrinkRate * (1 / 60);
    if (arenaRadius <= 0) {
        alert('Game Over! Final Score: ' + score);
        resetGame();
    }

    updatePlayer();
    drawPlayer();
    updatePulses();
    updatePowerUps();
    updateCancelPulses();
    updateScore();
    checkCollisions();

    requestAnimationFrame(gameLoop);
}

startPowerUpSpawning();
gameLoop();
