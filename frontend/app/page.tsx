"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const goLocal = () => router.push("/modes/local");
  const goBot = () => router.push("/modes/bot");
  const goRemote = () => router.push("/modes/remote");

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center">
      <main className="container px-6">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold text-foreground mb-4">Ping Pong</h1>
            <p className="text-muted-foreground text-lg">Choose your game mode</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={goLocal}
              className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium text-lg transition-colors"
            >
              Play vs Friend
              <span className="block text-sm opacity-80 mt-1">2 players, 1 keyboard</span>
            </button>

            <button
              onClick={goBot}
              className="w-full px-6 py-4 border-2 border-primary/40 rounded-lg hover:bg-muted text-foreground font-medium text-lg transition-colors"
            > Play vs Bot
              <span className="block text-sm opacity-60 mt-1">Challenge the AI opponent</span>
            </button>

            <button
              onClick={goRemote}
              className="w-full px-6 py-4 border-2 border-primary/40 rounded-lg hover:bg-muted text-foreground font-medium text-lg transition-colors"
            >
              Remote Match
              <span className="block text-sm opacity-60 mt-1">Play against another player online</span>
            </button>
          </div>

          <div className="mt-8 text-center text-muted-foreground text-sm">
            <p>Controls:</p>
            <p className="mt-1">W/S keys | ↑/↓ arrows</p>
          </div>
        </div>
      </main>
    </div>
  );
}
