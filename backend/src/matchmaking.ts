import { v4 as uuidv4 } from 'uuid';
import { GameRoom, QueueEntry, Player } from './types.js';

const BASE_WIDTH = 800;
const BASE_HEIGHT = 500;

export class MatchmakingService {
  private queue: QueueEntry[] = [];
  private activeRooms: Map<string, GameRoom> = new Map();

  addToQueue(socketId: string, username: string): void {
    // Check if already in queue
    const existing = this.queue.find(q => q.socketId === socketId);
    if (!existing) {
      this.queue.push({
        socketId,
        username,
        joinedAt: Date.now()
      });
    }
  }

  removeFromQueue(socketId: string): void {
    this.queue = this.queue.filter(q => q.socketId !== socketId);
  }

  findMatch(): GameRoom | null {
    if (this.queue.length < 2) {
      return null;
    }

    const player1Data = this.queue.shift()!;
    const player2Data = this.queue.shift()!;

    const player1: Player = {
      id: player1Data.socketId,
      socketId: player1Data.socketId,
      username: player1Data.username,
      index: 0,
      paddleY: BASE_HEIGHT / 2 - 44,
      input: 0,
      joinedAt: player1Data.joinedAt
    };

    const player2: Player = {
      id: player2Data.socketId,
      socketId: player2Data.socketId,
      username: player2Data.username,
      index: 1,
      paddleY: BASE_HEIGHT / 2 - 44,
      input: 0,
      joinedAt: player2Data.joinedAt
    };

    const room: GameRoom = {
      id: uuidv4(),
      players: [player1, player2],
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      paddle: {
        w: 6,
        h: 88,
        speed: 400
      },
      ball: {
        x: BASE_WIDTH / 2,
        y: BASE_HEIGHT / 2,
        vx: 200,
        vy: (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 100)
      },
      scores: [0, 0],
      running: false,
      ended: false,
      lastTick: Date.now(),
      tickTimer: null
    };

    this.activeRooms.set(room.id, room);
    return room;
  }

  getRoom(roomId: string): GameRoom | undefined {
    return this.activeRooms.get(roomId);
  }

  updateRoom(roomId: string, room: GameRoom): void {
    this.activeRooms.set(roomId, room);
  }

  removeRoom(roomId: string): void {
    const room = this.activeRooms.get(roomId);
    if (room?.tickTimer) {
      clearInterval(room.tickTimer);
    }
    this.activeRooms.delete(roomId);
  }

  getRoomBySocketId(socketId: string): GameRoom | undefined {
    for (const room of this.activeRooms.values()) {
      if (room.players.some(p => p.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  isInQueue(socketId: string): boolean {
    return this.queue.some(q => q.socketId === socketId);
  }
}
