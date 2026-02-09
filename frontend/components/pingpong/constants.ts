export const BASE_WIDTH = 800;
export const BASE_HEIGHT = 500;
export const BALL_RADIUS = 6;

// AI Configuration
export const AI_SKILL = 0.09; // 0..1 overall skill (lower = weaker)
export const REACTION_FRAMES = 12; // frames delayed before reacting to approaching ball
export const PREDICT_EVERY_FRAMES = 6; // cadence for trajectory recalc (higher = less frequent)
export const PREDICT_STEP_LIMIT = 420; // cap simulation steps to avoid omniscience
export const MAX_SPEED_FACTOR = 0.03; // fraction of player paddleSpeed the AI can reach
export const BASE_JITTER_PX = 6; // natural hand jitter (pixel variance on aim point)
export const MISTAKE_CHANCE = 0.08; // chance per frame to start intentional mistake
export const MISTAKE_HOLD_FRAMES = 10; // frames a mistake persists
export const TARGET_SMOOTHING = 0.035; // exponential smoothing factor for target (0..1, higher = snappier)
