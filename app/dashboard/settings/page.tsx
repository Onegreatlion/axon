"use client";
import { useState } from "react";
import { Circle, Loader2 } from "lucide-react";

const modes = [
  {
    id: "shadow",
    name: "Shadow",
    description:
      "Observe only. Axon reads and summarizes but never takes action.",
  },
  {
    id: "assist",
    name: "Assist",
    description:
      "Axon drafts and suggests actions. You approve before anything executes.",
  },
  {
    id: "autopilot",
    name: "Autopilot",
    description:
      "Axon handles routine actions automatically. High-risk actions still require approval.",
  },
];

const tones = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "direct", label: "Direct" },
];

export default function SettingsPage() {
  const [activeMode, setActiveMode] = useState("assist");
  const [activeTone, setActiveTone] = useState("professional");
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    if (!confirm("This will disconnect all services and revoke all tokens. Are you sure?")) {
      return;
    }
    setRevoking(true);
    setTimeout(() => {
      setRevoking(false);
      alert("All service connections have been revoked.");
    }, 1500);
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-6 flex items-center border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Settings</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-200">
                Operating Mode
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Controls how much autonomy Axon has.
              </p>
            </div>
            <div className="space-y-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={`w-full text-left flex items-start gap-3 rounded-xl p-4 border transition-colors ${
                    activeMode === mode.id
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50"
                  }`}
                >
                  <div className="mt-0.5">
                    <Circle
                      className={`w-3.5 h-3.5 ${
                        activeMode === mode.id
                          ? "fill-amber-500 text-amber-500"
                          : "text-zinc-700"
                      }`}
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        activeMode === mode.id ? "text-zinc-200" : "text-zinc-400"
                      }`}
                    >
                      {mode.name}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {mode.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-200">
                Communication Tone
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                How Axon communicates on your behalf when drafting replies.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setActiveTone(tone.id)}
                  className={`text-xs font-medium rounded-lg px-3.5 py-2 border transition-colors ${
                    activeTone === tone.id
                      ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                      : "text-zinc-500 bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-zinc-800/50">
            <div>
              <h2 className="text-sm font-medium text-red-400">
                Danger Zone
              </h2>
            </div>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {revoking && <Loader2 className="w-3 h-3 animate-spin" />}
              Revoke all service connections
            </button>
            <p className="text-[10px] text-zinc-600">
              Immediately disconnects all services and invalidates all tokens
              through Auth0 Token Vault. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}