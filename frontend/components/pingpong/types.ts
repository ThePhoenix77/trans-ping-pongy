export type Mode = "local";

export interface CanvaProps {
  paddleSpeed?: number;
  ballSpeed?: number;
  isAIMode?: boolean;
}

export interface PlayerState {
  paddleY: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GameState {
  width: number;
  height: number;
  paddle: { w: number; h: number };
  players: PlayerState[];
  ball: BallState;
  scores: number[];
}
