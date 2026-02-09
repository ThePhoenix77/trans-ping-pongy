import { GameState } from "./types";
import { BALL_RADIUS } from "./constants";

function addRoundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

export function renderPingPongFrame(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState
) {
  // Clear and draw background
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#0A192F";
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Inward border
  context.save();
  context.strokeStyle = "#4A658A";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
  context.restore();
  
  // Net
  context.fillStyle = "#4A658A";
  for (let y = 0; y < canvas.height; y += 20) {
    context.fillRect(canvas.width / 2 - 1, y, 2, 10);
  }
  
  // Left paddle (Player 1)
  const paddleRadius = 10;
  context.fillStyle = "#00BCD4";
  addRoundedRectPath(
    context,
    6,
    state.players[0].paddleY,
    state.paddle.w,
    state.paddle.h,
    paddleRadius
  );
  context.fill();
  
  // Right paddle (Player 2 / Bot)
  context.fillStyle = "#4A658A";
  addRoundedRectPath(
    context,
    state.width - state.paddle.w - 6,
    state.players[1].paddleY,
    state.paddle.w,
    state.paddle.h,
    paddleRadius
  );
  context.fill();
  
  // Ball
  context.fillStyle = "#FFFFFF";
  context.beginPath();
  context.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
  context.fill();
  
  // Scores
  context.fillStyle = "#EBEBEB";
  context.font = "bold 28px sans-serif";
  context.fillText(state.scores[0].toString(), canvas.width / 2 - 50, 40);
  context.fillText(state.scores[1].toString(), canvas.width / 2 + 30, 40);
}
