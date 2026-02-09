"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Canva = dynamic(() => import("@/components/Canva"), { ssr: false });

export default function BotModePage() {
  const router = useRouter();

  const handleQuit = () => router.push("/");

  return (
    <div className="min-h-screen bg-background">
      <div className="mt-8 max-w-4xl mx-auto flex flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">Player vs Bot</h1>
          </div>

          <div className="w-auto flex justify-center">
            <Canva paddleSpeed={360} ballSpeed={3} isAIMode={true} />
          </div>

          <button
            onClick={handleQuit}
            className="px-6 py-2 text-secondary hover:text-primary transition-colors"
          >
            ← Back to modes
          </button>
      </div>
    </div>
  );
}
