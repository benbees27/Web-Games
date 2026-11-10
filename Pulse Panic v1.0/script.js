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

// Player object
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 15,
  color: '#00f',
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
    // Random angle and distance for the pulse's position
    const angle = Math.random() * Math.PI * 2; // Random angle (0 to 2π)
    const distance = Math.random() * (arenaRadius - 20); // Random distance within the arena, avoiding edges
  
    // Calculate the pulse's position
    const x = canvas.width / 2 + Math.cos(angle) * distance;
    const y = canvas.height / 2 + Math.sin(angle) * distance;
  
    // Add the pulse to the pulses array
    pulses.push({
      x,
      y,
      radius: 10, // Initial radius of the pulse
      maxRadius: 150, // Adjust the max radius as needed
      speed: 0.5, // Adjust the speed as needed
    });
  }
 
// Initial spawn interval in milliseconds
let spawnInterval = 2000;

// Function to spawn a pulse and schedule the next one
function spawnPulseWithDynamicInterval() {
  spawnRandomPulse();

  // Decrease the interval, but set a minimum limit to avoid too fast spawns
  spawnInterval = Math.max(500, spawnInterval * 0.95);

  // Schedule the next pulse
  setTimeout(spawnPulseWithDynamicInterval, spawnInterval);
}

// Start the dynamic pulse spawning
setTimeout(spawnPulseWithDynamicInterval, spawnInterval);

// Add a pulse when the player clicks
canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  pulses.push({
    x,
    y,
    radius: 10, // Initial size of Pulse
    maxRadius: 100, // Max size of Pulse
    speed: 0.5, //Speed of the Pulse
  });
});

// Update and draw pulses
function updatePulses() {
  pulses.forEach((pulse, index) => {
    pulse.radius += pulse.speed;
    if (pulse.radius > pulse.maxRadius) {
      pulses.splice(index, 1); // Remove pulse when it exceeds max size
    } else {
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.stroke();
    }
  });
}

// Check for collisions between the player and pulses
function checkCollisions() {
  pulses.forEach((pulse, index) => {
    const distance = Math.sqrt((player.x - pulse.x) ** 2 + (player.y - pulse.y) ** 2);

    if (distance < pulse.radius + player.radius) {
      // Collision detected
      alert('Game Over!');
      resetGame();
    }
  });
}

// Update the score
function updateScore() {
  score += 1; // Increment score by 1 per frame
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
}

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw and shrink the arena
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, arenaRadius, 0, Math.PI * 2);
  ctx.strokeStyle = '#fff';
  ctx.stroke();

  // Shrink the arena
  arenaRadius -= shrinkRate * (1 / 60); // Shrink rate per frame
  if (arenaRadius <= 0) {
    alert('Game Over!');
    resetGame();
  }

  // Update and draw player
  updatePlayer();
  drawPlayer();

  // Update and draw pulses
  updatePulses();

  // Update and draw score
  updateScore();
  drawScore();

  // Check for collisions
  checkCollisions();

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
