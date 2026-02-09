import { GameState } from "./types";
import { computeAIMove, AIPredictionState } from "./ai";
import { BALL_RADIUS, BASE_HEIGHT, BASE_WIDTH } from "./constants";

export function resetBall(ball: GameState["ball"], ballSpeed: number, dir = 1) {
  ball.x = BASE_WIDTH / 2;
  ball.y = BASE_HEIGHT / 2;
  ball.vx = dir * ballSpeed;
  ball.vy = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
}

export function stepLocalGameFrame(params: {
  state: GameState;
  keys: Record<string, boolean>;
  dtSeconds: number;
  paddleSpeed: number;
  ballSpeed: number;
  isAIMode: boolean;
  aiPrediction: AIPredictionState;
}): { winnerName: string | null } {
  const { state, keys, dtSeconds, paddleSpeed, ballSpeed, isAIMode, aiPrediction } = params;
  const [p1, p2] = state.players;
  const h = state.height - state.paddle.h;

  // Apply smooth paddle movement based on held keys (time-based)
  const pxPerSec = Math.max(360, paddleSpeed);
  const p1Up = keys["w"] || (isAIMode && keys["ArrowUp"]);
  const p1Down = keys["s"] || (isAIMode && keys["ArrowDown"]);
  if (p1Up) p1.paddleY -= pxPerSec * dtSeconds;
  if (p1Down) p1.paddleY += pxPerSec * dtSeconds;

  if (!isAIMode) {
    if (keys["ArrowUp"]) p2.paddleY -= pxPerSec * dtSeconds;
    if (keys["ArrowDown"]) p2.paddleY += pxPerSec * dtSeconds;
  }

  // Clamp paddle positions
  p1.paddleY = Math.max(0, Math.min(h, p1.paddleY));
  p2.paddleY = Math.max(0, Math.min(h, p2.paddleY));

  const ball = state.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top & bottom bouncing
  if (ball.y - BALL_RADIUS <= 0) {
    ball.y = BALL_RADIUS;
    ball.vy *= -1;
  } else if (ball.y + BALL_RADIUS >= state.height) {
    ball.y = state.height - BALL_RADIUS;
    ball.vy *= -1;
  }

  // Paddle collision detection
  const leftPaddleX = 5;
  const rightPaddleX = state.width - state.paddle.w - 5;

  // Left paddle collision
  if (
    ball.x - BALL_RADIUS <= leftPaddleX + state.paddle.w &&
    ball.x + BALL_RADIUS >= leftPaddleX &&
    ball.y + BALL_RADIUS >= p1.paddleY &&
    ball.y - BALL_RADIUS <= p1.paddleY + state.paddle.h
  ) {
    ball.vx = Math.abs(ball.vx) + 0.2;
    const hitPos = (ball.y - (p1.paddleY + state.paddle.h / 2)) / (state.paddle.h / 2);
    ball.vy += hitPos * 2;
    ball.x = leftPaddleX + state.paddle.w + BALL_RADIUS;
  }

  // Right paddle collision
  if (
    ball.x + BALL_RADIUS >= rightPaddleX &&
    ball.x - BALL_RADIUS <= rightPaddleX + state.paddle.w &&
    ball.y + BALL_RADIUS >= p2.paddleY &&
    ball.y - BALL_RADIUS <= p2.paddleY + state.paddle.h
  ) {
    ball.vx = -Math.abs(ball.vx) - 0.2;
    const hitPos = (ball.y - (p2.paddleY + state.paddle.h / 2)) / (state.paddle.h / 2);
    ball.vy += hitPos * 2;
    ball.x = rightPaddleX - BALL_RADIUS;
  }

  // AI opponent logic (only for right paddle in AI mode)
  if (isAIMode) {
    computeAIMove(state, p2, paddleSpeed, aiPrediction);
  }

  // Scoring (hard cap at 6; stop immediately on win)
  if (ball.x + BALL_RADIUS < 0 && state.scores[0] < 6 && state.scores[1] < 6) {
    state.scores[1] = Math.min(6, state.scores[1] + 1);
    if (state.scores[1] === 6) {
      ball.vx = 0;
      ball.vy = 0;
      return { winnerName: isAIMode ? "Bot" : "Player 2" };
    }
    resetBall(ball, ballSpeed, 1);
  } else if (ball.x - BALL_RADIUS > state.width && state.scores[0] < 6 && state.scores[1] < 6) {
    state.scores[0] = Math.min(6, state.scores[0] + 1);
    if (state.scores[0] === 6) {
      ball.vx = 0;
      ball.vy = 0;
      return { winnerName: "Player 1" };
    }
    resetBall(ball, ballSpeed, -1);
  }

  state.scores[0] = Math.min(6, state.scores[0]);
  state.scores[1] = Math.min(6, state.scores[1]);

  return { winnerName: null };
}
