export const runtime = 'edge';
"use client";

import { useState, useEffect } from "react";
import { Circle, Loader2, Check } from "lucide-react";

const modes = [
  {
    id: "shadow",
    name: "Shadow",
    description:
      "Observe only. Axon reads and summarizes but never takes action or creates approvals.",
  },
  {
    id: "assist",
    name: "Assist",
    description:
      "Axon drafts and suggests actions. Write actions go to the Approvals queue before executing.",
  },
  {
    id: "autopilot",
    name: "Autopilot",
    description:
      "Axon handles routine actions automatically. Only unusual or destructive actions require approval.",
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.mode) setActiveMode(data.mode);
      if (data.tone) setActiveTone(data.tone);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(mode?: string, tone?: string) {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode || activeMode,
          tone: tone || activeTone,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleModeChange(id: string) {
    setActiveMode(id);
    saveSettings(id, activeTone);
  }

  function handleToneChange(id: string) {
    setActiveTone(id);
    saveSettings(activeMode, id);
  }

  async function handleRevokeAll() {
    if (
      !window.confirm(
        "This will disconnect ALL services and revoke all tokens. Are you sure?"
      )
    ) {
      return;
    }

    setRevoking(true);

    const results: string[] = [];

    try {
      const googleRes = await fetch("/api/connections/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection: "google" }),
      });
      const googleData = await googleRes.json();
      if (googleData.success) {
        results.push("Google: disconnected");
      } else {
        results.push("Google: " + (googleData.error || "failed"));
      }
    } catch {
      results.push("Google: failed to disconnect");
    }

    try {
      const githubRes = await fetch("/api/connections/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection: "github" }),
      });
      const githubData = await githubRes.json();
      if (githubData.success) {
        results.push("GitHub: disconnected");
      } else {
        results.push("GitHub: " + (githubData.error || "failed"));
      }
    } catch {
      results.push("GitHub: failed to disconnect");
    }

    alert("Revocation results:\n" + results.join("\n") + "\n\nPlease reconnect from the Services page.");
    setRevoking(false);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Settings</h1>
        {saving && (
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving
          </span>
        )}
        {saved && (
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-200">
                Operating Mode
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Controls how much autonomy Axon has. Changes take effect
                immediately.
              </p>
            </div>
            <div className="space-y-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  className={`w-full text-left flex items-start gap-3 rounded-xl p-4 border transition-colors ${
                    activeMode === mode.id
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <Circle
                      className={`w-3.5 h-3.5 ${
                        activeMode === mode.id
                          ? "fill-amber-500 text-amber-500"
                          : "text-zinc-700"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        activeMode === mode.id
                          ? "text-zinc-200"
                          : "text-zinc-400"
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
                Changes take effect immediately.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => handleToneChange(tone.id)}
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
              <h2 className="text-sm font-medium text-red-400">Danger Zone</h2>
            </div>
            <button
              onClick={handleRevokeAll}
              disabled={revoking}
              className="w-full sm:w-auto text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {revoking && <Loader2 className="w-3 h-3 animate-spin" />}
              Revoke all service connections
            </button>
            <p className="text-[10px] text-zinc-600">
              Immediately disconnects Google and GitHub, invalidating all tokens
              through Auth0 Token Vault. This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}