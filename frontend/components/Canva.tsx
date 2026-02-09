"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { BASE_HEIGHT, BASE_WIDTH } from "./pingpong/constants";
import { createAIPredictionState } from "./pingpong/ai";
import { updateKeysFromKeyboardEvent } from "./pingpong/input";
import { stepLocalGameFrame } from "./pingpong/local";
import { renderPingPongFrame } from "./pingpong/render";
import type { CanvaProps, GameState } from "./pingpong/types";

export default function Canva({
  paddleSpeed = 360,
  ballSpeed = 3,
  isAIMode = false,
}: CanvaProps) {
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const gameEndedRef = useRef<boolean>(false);

  const [info, setInfo] = useState<string>(isAIMode ? "Bot Mode" : "Local Mode");
  const [winner, setWinner] = useState<string | null>(null);
  const [playerNames] = useState<[string, string]>(
    isAIMode ? ["Player 1", "Bot"] : ["Player 1", "Player 2"]
  );
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>(
    { width: BASE_WIDTH, height: BASE_HEIGHT }
  );

  const localStateRef = useRef<GameState>({
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    paddle: { w: 6, h: 88 },
    players: [{ paddleY: 210 }, { paddleY: 210 }],
    ball: { x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2, vx: ballSpeed, vy: 3 },
    scores: [0, 0],
  });

  // Prediction cache for the bot
  const aiPredictionRef = useRef(createAIPredictionState());

  // Keep track of pressed keys for smooth movement
  const keysRef = useRef<Record<string, boolean>>({});

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c = canvas as HTMLCanvasElement;
    const context = ctx as CanvasRenderingContext2D;
    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;

    function render() {
      const now = performance.now();
      const prev = lastFrameRef.current;
      const dtSeconds = prev ? Math.min((now - prev) / 1000, 0.05) : 1 / 60;
      const s = localStateRef.current;

      if (winner || gameEndedRef.current) return;

      const { winnerName } = stepLocalGameFrame({
        state: s,
        keys: keysRef.current,
        dtSeconds,
        paddleSpeed,
        ballSpeed,
        isAIMode,
        aiPrediction: aiPredictionRef.current,
      });

      if (winnerName) {
        stopGame(winnerName);
        return;
      }

      lastFrameRef.current = now;
      renderPingPongFrame(context, c, s);
      animationRef.current = requestAnimationFrame(render);
    }

    render();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ballSpeed, winner, isAIMode]);

  function stopGame(winnerName: string) {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    gameEndedRef.current = true;
    setWinner(winnerName);
    setInfo(`${winnerName} wins!`);
    setTimeout(() => {
      const s = localStateRef.current;
      s.scores = [0, 0];
      s.ball.x = BASE_WIDTH / 2;
      s.ball.y = BASE_HEIGHT / 2;
      setWinner(null);
      setInfo("Game restarted");
      router.push("/");
    }, 3000);
  }

  // Input handling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      updateKeysFromKeyboardEvent(keysRef.current, e);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto">
      {/* Player names */}
      <div className="flex justify-between items-center mb-4 px-4">
        <span className="text-primary font-semibold text-lg">{playerNames[0]}</span>
        <span className="text-secondary font-semibold text-lg">{playerNames[1]}</span>
      </div>

      {/* Canvas container */}
      <div className="relative w-full" style={{ aspectRatio: `${BASE_WIDTH}/${BASE_HEIGHT}` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg shadow-2xl"
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
      </div>

      {/* Info */}
      <div className="text-center mt-4 text-muted-foreground">{info}</div>
    </div>
  );
}
