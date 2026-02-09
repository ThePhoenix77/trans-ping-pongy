import { BallState, GameState, PlayerState } from "./types";
import {
  AI_SKILL,
  REACTION_FRAMES,
  PREDICT_EVERY_FRAMES,
  PREDICT_STEP_LIMIT,
  MAX_SPEED_FACTOR,
  BASE_JITTER_PX,
  MISTAKE_CHANCE,
  MISTAKE_HOLD_FRAMES,
  TARGET_SMOOTHING,
} from "./constants";

export interface AIPredictionState {
  y: number;
  smoothedTarget: number;
  frameCount: number;
  reactionLeft: number;
  mistakeHold: number;
  contactOffset: number;
}

export function createAIPredictionState(): AIPredictionState {
  return {
    y: 210,
    smoothedTarget: 210,
    frameCount: 0,
    reactionLeft: REACTION_FRAMES,
    mistakeHold: 0,
    contactOffset: 0,
  };
}

export function computeAIMove(
  state: GameState,
  aiPaddle: PlayerState,
  paddleSpeed: number,
  prediction: AIPredictionState
) {
  const ball = state.ball;
  const paddle = state.paddle;
  const ballApproaching = ball.vx > 0; // bot right side only
  const ballPastHalfway = ball.x > state.width / 2; // react once ball enters right half

  // Reaction delay + spatial check: only start moving after ball enters right half and grace period
  if (ballApproaching && ballPastHalfway) {
    if (prediction.reactionLeft > 0) {
      prediction.reactionLeft--;
      return;
    }
  } else {
    // Ball is leaving (after hit) - stay in current position
    prediction.reactionLeft = REACTION_FRAMES;
    return;
  }

  // Trajectory prediction at a limited cadence
  if (prediction.frameCount <= 0) {
    prediction.y = predictBallPosition(ball, state);
    prediction.frameCount = PREDICT_EVERY_FRAMES;
    // Generate a new random contact offset each time after prediction
    prediction.contactOffset = (Math.random() - 0.5) * paddle.h * 0.4;
  }
  prediction.frameCount--;

  // Inaccuracies - random variations
  const jitter = (Math.random() - 0.5) * BASE_JITTER_PX * (1 - AI_SKILL) * 0.5;
  let rawTarget = prediction.y + jitter + prediction.contactOffset;

  if (prediction.mistakeHold > 0) {
    prediction.mistakeHold--;
    rawTarget += paddle.h * 0.6; // gentler over/undershoot
  } else if (Math.random() < MISTAKE_CHANCE) {
    prediction.mistakeHold = MISTAKE_HOLD_FRAMES;
  }

  // Exponential smoothing to reduce flickering in target changes
  const targetY = prediction.smoothedTarget + (rawTarget - prediction.smoothedTarget) * TARGET_SMOOTHING;
  prediction.smoothedTarget = targetY;

  // Move smoothly at controlled speed toward the target
  const ballInFarRightQuarter = ball.x > (state.width * 3) / 4;
  const paddleCenter = aiPaddle.paddleY + paddle.h / 2;
  const moveSpeed = ballInFarRightQuarter ? paddleSpeed : paddleSpeed * MAX_SPEED_FACTOR;
  const delta = targetY - paddleCenter;
  const step = Math.sign(delta) * Math.min(Math.abs(delta), moveSpeed);
  aiPaddle.paddleY += step;

  const maxY = state.height - paddle.h;
  aiPaddle.paddleY = Math.max(0, Math.min(maxY, aiPaddle.paddleY));
}

function predictBallPosition(ball: BallState, state: GameState): number {
  const paddle = state.paddle;
  let ballX = ball.x;
  let ballY = ball.y;
  let ballVx = ball.vx;
  let ballVy = ball.vy;

  let iterations = 0;
  const maxIterations = PREDICT_STEP_LIMIT;
  const wallPadding = 5;

  while (ballX < state.width - paddle.w - 5 && iterations < maxIterations) {
    ballX += ballVx;
    ballY += ballVy;
    iterations++;

    // Bouncing off top and bottom walls
    if (ballY <= wallPadding) {
      ballY = wallPadding;
      ballVy = Math.abs(ballVy);
    }
    if (ballY >= state.height - wallPadding) {
      ballY = state.height - wallPadding;
      ballVy = -Math.abs(ballVy);
    }

    // Stop if ball is moving away from AI
    if (ballVx < 0) break;
  }

  // Add additional uncertainty to the landing spot
  const uncertainty = (Math.random() - 0.5) * 30 * (1 - AI_SKILL);
  const clamped = Math.max(0, Math.min(state.height - paddle.h, ballY + uncertainty));
  return clamped;
}
