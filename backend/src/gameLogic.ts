import { Server } from 'socket.io';
import { GameRoom } from './types.js';

const BALL_RADIUS = 6;

export function resetBall(room: GameRoom, dir = 1): void {
  room.ball.x = room.width / 2;
  room.ball.y = room.height / 2;
  room.ball.vx = dir * 200;
  room.ball.vy = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 100);
}

export function stopGame(io: Server, room: GameRoom, winnerIndex: number): void {
  if (room.ended) return;
  room.ended = true;
  room.running = false;

  if (room.tickTimer) {
    clearInterval(room.tickTimer);
    room.tickTimer = null;
  }

  // Safety cap
  room.scores[0] = Math.min(6, room.scores[0]);
  room.scores[1] = Math.min(6, room.scores[1]);

  const winner = room.players[winnerIndex];
  const loserIndex = winnerIndex === 0 ? 1 : 0;
  const loser = room.players[loserIndex];

  const winnerUsername = winner?.username || `Player ${winnerIndex + 1}`;
  const loserUsername = loser?.username || `Player ${loserIndex + 1}`;

  io.to(room.id).emit('game_over', {
    winner: winnerUsername,
    loser: loserUsername,
    winnerIndex,
    scores: room.scores,
    finalScore: `${room.scores[winnerIndex]}-${room.scores[loserIndex]}`
  });
}

export function startRoomLoop(io: Server, room: GameRoom): void {
  if (room.running || room.ended) return;
  room.running = true;
  room.lastTick = Date.now();

  room.tickTimer = setInterval(() => {
    if (room.ended) {
      if (room.tickTimer) {
        clearInterval(room.tickTimer);
        room.tickTimer = null;
      }
      room.running = false;
      return;
    }

    const now = Date.now();
    const dtSeconds = (now - room.lastTick) / 1000;
    room.lastTick = now;

    // Update paddle positions based on input
    for (const p of room.players) {
      p.paddleY += (p.input || 0) * room.paddle.speed * dtSeconds;
      p.paddleY = Math.max(0, Math.min(room.height - room.paddle.h, p.paddleY));
    }

    // Update ball position
    room.ball.x += room.ball.vx * dtSeconds;
    room.ball.y += room.ball.vy * dtSeconds;

    // Top & bottom bouncing
    if (room.ball.y - BALL_RADIUS <= 0) {
      room.ball.y = BALL_RADIUS;
      room.ball.vy *= -1;
    }
    if (room.ball.y + BALL_RADIUS >= room.height) {
      room.ball.y = room.height - BALL_RADIUS;
      room.ball.vy *= -1;
    }

    // Paddle collisions
    const left = room.players.find(p => p.index === 0);
    const right = room.players.find(p => p.index === 1);

    // Left paddle collision
    if (left && room.ball.x - BALL_RADIUS <= room.paddle.w + 5) {
      if (
        room.ball.y + BALL_RADIUS >= left.paddleY &&
        room.ball.y - BALL_RADIUS <= left.paddleY + room.paddle.h
      ) {
        room.ball.x = room.paddle.w + 5 + BALL_RADIUS;
        room.ball.vx = Math.abs(room.ball.vx) * 1.05;
        const rel = (room.ball.y - (left.paddleY + room.paddle.h / 2)) / (room.paddle.h / 2);
        room.ball.vy += rel * 200;
      } else {
        room.scores[1]++;
        room.scores[1] = Math.min(6, room.scores[1]);
        if (room.scores[1] === 6) {
          stopGame(io, room, 1);
          return;
        }
        resetBall(room, 1);
      }
    }

    // Right paddle collision
    if (right && room.ball.x + BALL_RADIUS >= room.width - room.paddle.w - 5) {
      if (
        room.ball.y + BALL_RADIUS >= right.paddleY &&
        room.ball.y - BALL_RADIUS <= right.paddleY + room.paddle.h
      ) {
        room.ball.x = room.width - room.paddle.w - 5 - BALL_RADIUS;
        room.ball.vx = -Math.abs(room.ball.vx) * 1.05;
        const rel = (room.ball.y - (right.paddleY + room.paddle.h / 2)) / (room.paddle.h / 2);
        room.ball.vy += rel * 200;
      } else {
        room.scores[0]++;
        room.scores[0] = Math.min(6, room.scores[0]);
        if (room.scores[0] === 6) {
          stopGame(io, room, 0);
          return;
        }
        resetBall(room, -1);
      }
    }

    // Emit state to all players in room
    const state = {
      ball: room.ball,
      players: room.players.map(p => ({ index: p.index, paddleY: p.paddleY })),
      paddle: room.paddle,
      scores: room.scores,
      width: room.width,
      height: room.height
    };
    io.to(room.id).emit('state', state);
  }, 1000 / 60); // 60Hz
}
