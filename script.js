const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const speedValue = document.getElementById("speedValue");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const startButton = document.getElementById("startButton");
const speedButton = document.getElementById("speedButton");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlayKicker");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

const gridSize = 18;
const tileCount = canvas.width / gridSize;
const baseSpeed = 150;
const boostSpeed = 95;
const swipeThreshold = 18;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 10, y: 10 };
let score = 0;
let bestScore = Number(localStorage.getItem("snake-best-score") || 0);
let isRunning = false;
let isPaused = false;
let hasStarted = false;
let isBoosting = false;
let gameLoop = null;
let touchStart = null;

bestValue.textContent = String(bestScore);

function resetGame() {
  snake = [
    { x: 7, y: 9 },
    { x: 6, y: 9 },
    { x: 5, y: 9 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  isPaused = false;
  isBoosting = false;
  placeFood();
  updateStats();
  draw();
}

function placeFood() {
  let nextFood;

  do {
    nextFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
    };
  } while (snake.some((segment) => segment.x === nextFood.x && segment.y === nextFood.y));

  food = nextFood;
}

function setDirection(newDirection) {
  const isOpposite =
    newDirection.x === -direction.x && newDirection.y === -direction.y;

  if (!isOpposite) {
    nextDirection = newDirection;
  }
}

function updateStats() {
  scoreValue.textContent = String(score);
  bestValue.textContent = String(bestScore);
  speedValue.textContent = `${isBoosting ? "1.6" : "1"}x`;
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
}

function showOverlay(kicker, title, text, buttonText) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.classList.add("visible");
}

function hideOverlay() {
  overlay.classList.remove("visible");
}

function updateLoopSpeed() {
  if (gameLoop) {
    clearInterval(gameLoop);
  }

  if (!isRunning || isPaused) {
    return;
  }

  gameLoop = setInterval(step, isBoosting ? boostSpeed : baseSpeed);
  updateStats();
}

function startGame() {
  resetGame();
  hasStarted = true;
  isRunning = true;
  hideOverlay();
  updateLoopSpeed();
}

function endGame() {
  isRunning = false;
  clearInterval(gameLoop);
  gameLoop = null;

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snake-best-score", String(bestScore));
  }

  updateStats();
  showOverlay("Game Over", "One more round?", `Final score: ${score}`, "Play Again");
}

function togglePause() {
  if (!hasStarted || !isRunning) {
    return;
  }

  isPaused = !isPaused;

  if (isPaused) {
    clearInterval(gameLoop);
    gameLoop = null;
    showOverlay("Paused", "Take a breath", "Tap resume when you are ready.", "Resume");
  } else {
    hideOverlay();
    updateLoopSpeed();
  }

  updateStats();
}

function step() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  const collidedWithWall =
    head.x < 0 || head.y < 0 || head.x >= tileCount || head.y >= tileCount;
  const willEatFood = head.x === food.x && head.y === food.y;
  const bodyToCheck = willEatFood ? snake : snake.slice(0, -1);
  const collidedWithSelf = bodyToCheck.some(
    (segment) => segment.x === head.x && segment.y === head.y,
  );

  if (collidedWithWall || collidedWithSelf) {
    endGame();
    draw();
    return;
  }

  snake.unshift(head);

  if (willEatFood) {
    score += 1;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("snake-best-score", String(bestScore));
    }
    placeFood();
  } else {
    snake.pop();
  }

  updateStats();
  draw();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= tileCount; i += 1) {
    const offset = i * gridSize;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }

  ctx.restore();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFood() {
  const x = food.x * gridSize;
  const y = food.y * gridSize;

  ctx.save();
  ctx.shadowColor = "rgba(251, 113, 133, 0.55)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fb7185";
  ctx.beginPath();
  ctx.arc(x + gridSize / 2, y + gridSize / 2, gridSize * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * gridSize;
    const y = segment.y * gridSize;
    const isHead = index === 0;

    ctx.save();
    ctx.fillStyle = isHead ? "#86efac" : "#4ade80";
    ctx.shadowColor = isHead ? "rgba(134, 239, 172, 0.38)" : "transparent";
    ctx.shadowBlur = isHead ? 16 : 0;
    roundRect(x + 1.5, y + 1.5, gridSize - 3, gridSize - 3, 6);
    ctx.fill();

    if (isHead) {
      ctx.fillStyle = "#052e16";
      ctx.beginPath();
      ctx.arc(x + gridSize * 0.35, y + gridSize * 0.38, 1.6, 0, Math.PI * 2);
      ctx.arc(x + gridSize * 0.65, y + gridSize * 0.38, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function draw() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#111827");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawFood();
  drawSnake();
}

function handleDirection(directionName) {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const newDirection = directions[directionName];
  if (newDirection) {
    setDirection(newDirection);
  }
}

function handleKeydown(event) {
  const keyToDirection = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };

  const directionName = keyToDirection[event.key];
  if (directionName) {
    event.preventDefault();
    handleDirection(directionName);
    if (hasStarted && !isRunning && !isPaused) {
      startGame();
    }
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (!hasStarted || !isRunning) {
      startGame();
    } else {
      togglePause();
    }
  }
}

function beginBoost() {
  isBoosting = true;
  updateLoopSpeed();
}

function endBoost() {
  isBoosting = false;
  updateLoopSpeed();
}

document.addEventListener("keydown", handleKeydown);

document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    handleDirection(button.dataset.direction);
    if (!hasStarted || (!isRunning && !isPaused)) {
      startGame();
    }
  });
});

pauseButton.addEventListener("click", () => {
  if (!hasStarted) {
    startGame();
    return;
  }

  if (!isRunning && isPaused) {
    togglePause();
    return;
  }

  togglePause();
});

restartButton.addEventListener("click", startGame);
startButton.addEventListener("click", () => {
  if (isPaused) {
    togglePause();
  } else {
    startGame();
  }
});

speedButton.addEventListener("pointerdown", beginBoost);
speedButton.addEventListener("pointerup", endBoost);
speedButton.addEventListener("pointerleave", endBoost);
speedButton.addEventListener("pointercancel", endBoost);

canvas.addEventListener("pointerdown", (event) => {
  touchStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointerup", (event) => {
  if (!touchStart) {
    return;
  }

  const deltaX = event.clientX - touchStart.x;
  const deltaY = event.clientY - touchStart.y;

  if (Math.abs(deltaX) < swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
    touchStart = null;
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    handleDirection(deltaX > 0 ? "right" : "left");
  } else {
    handleDirection(deltaY > 0 ? "down" : "up");
  }

  if (!hasStarted || (!isRunning && !isPaused)) {
    startGame();
  }

  touchStart = null;
});

resetGame();
showOverlay("Ready?", "Tap Start", "Collect glowing fruit, avoid walls and your tail.", "Start Game");
