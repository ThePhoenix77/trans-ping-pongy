// Player Types
export interface Player {
  id: string;           // socket id
  index: 0 | 1;
  paddleY: number;
  input: number;        // -1, 0, 1
  socketId: string;
  username: string;
  joinedAt: number;
}

// Ball State
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Game Room
export interface GameRoom {
  id: string;
  players: Player[];
  width: number;
  height: number;
  paddle: {
    w: number;
    h: number;
    speed: number;
  };
  ball: Ball;
  scores: [number, number];
  running: boolean;
  ended: boolean;
  lastTick: number;
  tickTimer?: ReturnType<typeof setInterval> | null;
}

// Matchmaking Queue Entry
export interface QueueEntry {
  socketId: string;
  username: string;
  joinedAt: number;
}

// Game State (sent to clients)
export interface GameState {
  ball: Ball;
  players: { index: number; paddleY: number }[];
  paddle: { w: number; h: number };
  scores: [number, number];
  width: number;
  height: number;
}
