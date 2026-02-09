"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

import { BASE_HEIGHT, BASE_WIDTH } from "@/components/pingpong/constants";
import { renderPingPongFrame } from "@/components/pingpong/render";
import { updateKeysFromKeyboardEvent } from "@/components/pingpong/input";
import type { GameState } from "@/components/pingpong/types";

const BACKEND_URL = "http://localhost:3002";

export default function RemoteModePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const animationRef = useRef<number | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  const [status, setStatus] = useState<"connecting" | "waiting" | "playing" | "ended">("connecting");
  const [info, setInfo] = useState("Connecting to server...");
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [playerNames, setPlayerNames] = useState<[string, string]>(["Player 1", "Player 2"]);
  const [winner, setWinner] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);

  const stateRef = useRef<GameState>({
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    paddle: { w: 6, h: 88 },
    players: [{ paddleY: 210 }, { paddleY: 210 }],
    ball: { x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2, vx: 0, vy: 0 },
    scores: [0, 0],
  });

  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
  });

  // Resize handler
  useEffect(() => {
    function resizeCanvas() {
      const containerWidth = containerRef.current?.clientWidth ?? BASE_WIDTH;
      const targetWidth = Math.min(BASE_WIDTH, Math.max(320, containerWidth));
      const targetHeight = Math.round(targetWidth * (BASE_HEIGHT / BASE_WIDTH));
      setViewportSize({ width: targetWidth, height: targetHeight });
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Input handling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      updateKeysFromKeyboardEvent(keysRef.current, e);

      // Send input to server
      if (socketRef.current?.connected && status === "playing") {
        let move = 0;
        if (keysRef.current["w"] || keysRef.current["ArrowUp"]) move = -1;
        else if (keysRef.current["s"] || keysRef.current["ArrowDown"]) move = 1;
        socketRef.current.emit("input", { move });
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, [status]);

  // Canvas rendering loop
  useEffect(() => {
    if (showNameInput) return; // Canvas not rendered yet
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;

    function render() {
      renderPingPongFrame(ctx!, canvas!, stateRef.current);
      animationRef.current = requestAnimationFrame(render);
    }

    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [showNameInput]);

  // Socket connection and game logic
  function joinQueue() {
    if (!username.trim()) {
      setInfo("Please enter a username");
      return;
    }

    setShowNameInput(false);
    setStatus("connecting");
    setInfo("Connecting to server...");

    const socket = io(BACKEND_URL, {
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("waiting");
      setInfo("Looking for opponent...");
      socket.emit("joinQueue", { username: username.trim() });
    });

    socket.on("connect_error", () => {
      setInfo("Failed to connect. Make sure the server is running.");
      setStatus("connecting");
    });

    socket.on("queueJoined", (data: { queueSize: number }) => {
      setInfo(`In queue (${data.queueSize} player${data.queueSize !== 1 ? "s" : ""} waiting)...`);
    });

    socket.on("matchFound", (data: { roomId: string; playerIndex: number; opponent: string; players: string[] }) => {
      setStatus("playing");
      setPlayerIndex(data.playerIndex);
      setPlayerNames([data.players[0], data.players[1]]);
      setInfo(`Game starting! You are ${data.playerIndex === 0 ? "left" : "right"} paddle`);
    });

    socket.on("state", (state: any) => {
      stateRef.current = {
        width: state.width,
        height: state.height,
        paddle: state.paddle,
        players: state.players.map((p: any) => ({ paddleY: p.paddleY })),
        ball: state.ball,
        scores: state.scores,
      };
    });

    socket.on("game_over", (data: { winner: string; loser: string; scores: [number, number] }) => {
      setStatus("ended");
      setWinner(data.winner);
      setInfo(`${data.winner} wins! ${data.scores[0]} - ${data.scores[1]}`);

      // Return to menu after delay
      setTimeout(() => {
        router.push("/");
      }, 4000);
    });

    socket.on("playerDisconnected", (data: { disconnectedPlayer: string; winner: string }) => {
      setStatus("ended");
      setWinner(data.winner);
      setInfo(`${data.disconnectedPlayer} disconnected. ${data.winner} wins!`);

      setTimeout(() => {
        router.push("/");
      }, 4000);
    });

    socket.on("disconnect", () => {
      if (status !== "ended") {
        setInfo("Disconnected from server");
      }
    });
  }

  const handleQuit = () => {
    if (socketRef.current) {
      socketRef.current.emit("leaveQueue");
      socketRef.current.disconnect();
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mt-8 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">Remote Match</h1>
            <p className="text-muted-foreground">
              {status === "playing"
                ? `Use W/S or ↑/↓ to move your paddle`
                : "Play against a random player online"}
            </p>
          </div>

          {showNameInput ? (
            <div className="w-full max-w-md space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                  Enter your name
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinQueue()}
                  placeholder="Your name..."
                  className="w-full px-4 py-3 rounded-lg bg-background border border-secondary/40 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  maxLength={20}
                  autoFocus
                />
              </div>
              <button
                onClick={joinQueue}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors"
              >
                Find Match
              </button>
              <button
                onClick={handleQuit}
                className="w-full px-4 py-2 text-secondary hover:text-primary transition-colors"
              >
                ← Back to modes
              </button>
            </div>
          ) : (
            <>
              {/* Player names */}
              <div className="flex justify-between items-center w-full max-w-4xl px-4">
                <span className={`font-semibold text-lg ${playerIndex === 0 ? "text-primary" : "text-secondary"}`}>
                  {playerNames[0]} {playerIndex === 0 && "(You)"}
                </span>
                <span className={`font-semibold text-lg ${playerIndex === 1 ? "text-primary" : "text-secondary"}`}>
                  {playerNames[1]} {playerIndex === 1 && "(You)"}
                </span>
              </div>

              {/* Canvas */}
              <div
                ref={containerRef}
                className="relative w-auto"
                style={{ aspectRatio: `${BASE_WIDTH}/${BASE_HEIGHT}` }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-auto h-full rounded-lg shadow-2xl"
                  style={{
                    maxWidth: viewportSize.width,
                    maxHeight: viewportSize.height,
                  }}
                />

                {/* Winner overlay */}
                {winner && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                    <div className="text-center">
                      <h2 className="text-4xl font-bold text-primary mb-2">{winner} Wins!</h2>
                      <p className="text-muted-foreground">Returning to menu...</p>
                    </div>
                  </div>
                )}

                {/* Waiting overlay */}
                {status === "waiting" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-foreground text-lg">{info}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center text-muted-foreground">{info}</div>

              <button
                onClick={handleQuit}
                className="px-6 py-2 text-secondary hover:text-primary transition-colors"
              >
                ← Leave Game
              </button>
            </>
          )}
      </div>
    </div>
  );
}
