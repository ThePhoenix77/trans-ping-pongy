import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MatchmakingService } from './matchmaking.js';
import { startRoomLoop, stopGame } from './gameLogic.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const matchmaking = new MatchmakingService();

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Join matchmaking queue
  socket.on('joinQueue', (data: { username: string }) => {
    const username = data.username || `Player_${socket.id.slice(0, 6)}`;
    console.log(`${username} joining queue`);
    
    matchmaking.addToQueue(socket.id, username);
    
    socket.emit('queueJoined', { 
      queueSize: matchmaking.getQueueSize() 
    });

    // Try to find a match
    const match = matchmaking.findMatch();
    if (match) {
      const [player1, player2] = match.players;
      
      console.log(`Match found: ${player1.username} vs ${player2.username}`);

      // Join both players to the room
      const socket1 = io.sockets.sockets.get(player1.socketId);
      const socket2 = io.sockets.sockets.get(player2.socketId);
      
      socket1?.join(match.id);
      socket2?.join(match.id);

      // Notify players
      io.to(player1.socketId).emit('matchFound', {
        roomId: match.id,
        playerIndex: 0,
        opponent: player2.username,
        players: [player1.username, player2.username]
      });

      io.to(player2.socketId).emit('matchFound', {
        roomId: match.id,
        playerIndex: 1,
        opponent: player1.username,
        players: [player1.username, player2.username]
      });

      // Start the game after a short delay
      setTimeout(() => {
        const room = matchmaking.getRoom(match.id);
        if (room && !room.ended) {
          startRoomLoop(io, room);
        }
      }, 1000);
    }
  });

  // Leave queue
  socket.on('leaveQueue', () => {
    matchmaking.removeFromQueue(socket.id);
    socket.emit('queueLeft');
  });

  // Player input (paddle movement)
  socket.on('input', (data: { move: number }) => {
    const room = matchmaking.getRoomBySocketId(socket.id);
    if (room && room.running) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.input = data.move; // -1, 0, or 1
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove from queue if waiting
    matchmaking.removeFromQueue(socket.id);

    // Check if in active game
    const room = matchmaking.getRoomBySocketId(socket.id);
    if (room && !room.ended) {
      const disconnectedPlayer = room.players.find(p => p.socketId === socket.id);
      const otherPlayer = room.players.find(p => p.socketId !== socket.id);

      if (disconnectedPlayer && otherPlayer) {
        // Other player wins by forfeit
        const winnerIndex = otherPlayer.index;
        stopGame(io, room, winnerIndex);

        io.to(room.id).emit('playerDisconnected', {
          disconnectedPlayer: disconnectedPlayer.username,
          winner: otherPlayer.username
        });
      }

      // Clean up room after a delay
      setTimeout(() => {
        matchmaking.removeRoom(room.id);
      }, 5000);
    }
  });
});

const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`🎮 Ping Pong Server running on port ${PORT}`);
});
