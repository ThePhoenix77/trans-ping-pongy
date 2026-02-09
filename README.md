# trans-ping-pongy

This repo is only representing a mini sub project of a much bigger one [ft_transcendence](https://github.com/aragragu/PONG_MASSAR_5.0). So this is just my standalone minimalist ping pong game part with local multiplayer, AI bot, and online remote modes.

## Features

- **Local Match**: Two players on one keyboard (W/S vs ↑/↓)
- **Bot Mode**: Play against an AI opponent
- **Remote Match**: Play against another player online with matchmaking queue

## Rules

- First to 6 points wins!

## Quick Start

```bash
make install
make dev
```

Then open [http://localhost:3001](http://localhost:3001) in your browser.

## Controls

| Player | Up | Down |
|--------|-----|------|
| Player 1 | W | S |
| Player 2 | ↑ | ↓ |

In Bot mode and Remote mode, you can use either W/S or arrow keys.

## Commands

```bash
make install      # Install dependencies
make dev          # Run frontend + backend
make dev-frontend # Run frontend only
make dev-backend  # Run backend only
make build        # Build for production
make clean        # Remove node_modules and build artifacts
```

## Project Structure

```
copy/
├── frontend/                 # Next.js frontend
│   ├── app/                  # App router pages
│   │   ├── page.tsx          # Mode selection page
│   │   └── modes/
│   │       ├── local/        # Local multiplayer
│   │       ├── bot/          # AI opponent mode
│   │       └── remote/       # Online matchmaking mode
│   └── components/
│       ├── Canva.tsx         # Main game canvas component
│       └── pingpong/         # Game logic modules
│           ├── ai.ts         # AI bot logic
│           ├── constants.ts
│           ├── input.ts
│           ├── local.ts      # Local game physics
│           ├── render.ts     # Canvas rendering
│           └── types.ts
│
├── backend/                  # Node.js + Socket.IO backend
│   └── src/
│       ├── index.ts          # Server entry point
│       ├── matchmaking.ts    # Queue-based matchmaking
│       ├── gameLogic.ts      # Server-side game physics
│       └── types.ts
│
├── Makefile
└── README.md
```

## Remote Mode Architecture

The remote mode uses a simple queue-based matchmaking system:

1. Players enter their name and join the queue
2. When 2 players are in the queue, they're matched together
3. Server runs game physics at 60Hz and broadcasts state to both players
4. Players send input commands (paddle up/down) to the server
5. Game ends when someone reaches 6 points or disconnects
