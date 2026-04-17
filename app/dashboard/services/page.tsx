"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Mail, Github, MessageSquare, Check, Loader2, ExternalLink,
  Info, XCircle, AlertCircle, CheckCircle, Music, Send, Camera, X
} from "lucide-react";

interface ServiceConfig {
  id: string;
  connectionKey: string | null;
  connectionName: string | null;
  name: string;
  description: string;
  icon: React.ElementType;
  scopes: string[];
  available: boolean;
}

const services: ServiceConfig[] = [
  {
    id: "google",
    connectionKey: "google",
    connectionName: "google-oauth2",
    name: "Google Services",
    description: "Gmail, Calendar, Drive, Tasks, Contacts.",
    icon: Mail,
    scopes: ["gmail.readonly", "gmail.send", "calendar", "drive.readonly", "tasks"],
    available: true,
  },
  {
    id: "github",
    connectionKey: "github",
    connectionName: "github",
    name: "GitHub",
    description: "Repositories, issues, pull requests, notifications.",
    icon: Github,
    scopes: ["repo", "read:user"],
    available: true,
  },
  {
    id: "facebook",
    connectionKey: "facebook",
    connectionName: "facebook",
    name: "Facebook & Instagram",
    description: "Post to your Facebook Pages and linked Instagram accounts.",
    icon: Camera,
    scopes: ["pages_manage_posts", "instagram_basic", "instagram_content_publish"],
    available: true,
  },
  {
    id: "telegram",
    connectionKey: "telegram",
    connectionName: "telegram",
    name: "Telegram",
    description: "Let Axon send you instant push notifications and alerts.",
    icon: Send,
    scopes: ["bot:messages"],
    available: true,
  },
];

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [chatIdInput, setChatIdInput] = useState("");
  const [savingTelegram, setSavingTelegram] = useState(false);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    const urlError = searchParams.get("error");
    const urlConnected = searchParams.get("connected");
    if (urlError) { setError(decodeURIComponent(urlError)); window.history.replaceState({}, "", "/dashboard/services"); }
    if (urlConnected) { setSuccess(`${urlConnected} connected successfully.`); window.history.replaceState({}, "", "/dashboard/services"); }
    checkStatuses();
  }, [searchParams]);

  async function checkStatuses() {
    try {
      const [auth0Res, tgRes] = await Promise.all([
        fetch("/api/connections/status"),
        fetch("/api/connections/telegram")
      ]);
      const auth0Data = await auth0Res.json();
      const tgData = await tgRes.json();
      
      setStatuses({
        ...(auth0Data.statuses || {}),
        telegram: tgData.connected
      });
    } catch {} finally { setLoading(false); }
  }

  function connectService(connectionName: string) {
    if (connectionName === "telegram") {
      setShowTelegramModal(true);
      return;
    }
    setError(null); setSuccess(null);
    window.location.href = `/api/connections/connect?connection=${connectionName}`;
  }

  async function saveTelegramChatId() {
    setSavingTelegram(true);
    try {
      const res = await fetch("/api/connections/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatIdInput })
      });
      if (res.ok) {
        setStatuses(prev => ({ ...prev, telegram: true }));
        setSuccess("Telegram connected successfully!");
        setShowTelegramModal(false);
      } else { setError("Failed to save Telegram Chat ID."); }
    } catch { setError("Failed to save Telegram Chat ID."); }
    finally { setSavingTelegram(false); }
  }

  async function disconnectService(connectionKey: string) {
    if (!window.confirm("Disconnect this service? Reconnect to grant updated permissions.")) return;
    setDisconnecting(connectionKey); setError(null); setSuccess(null);
    try {
      if (connectionKey === "telegram") {
        await fetch("/api/connections/telegram", { method: "DELETE" });
        setStatuses((prev) => ({ ...prev, telegram: false }));
        setSuccess("Telegram disconnected.");
        setDisconnecting(null);
        return;
      }

      const res = await fetch("/api/connections/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection: connectionKey }),
      });
      const data = await res.json();
      if (data.success) {
        setStatuses((prev) => ({ ...prev, [connectionKey]: false }));
        setSuccess("Disconnected. Click Connect to grant updated permissions.");
      } else { setError(data.error || "Failed to disconnect."); }
    } catch { setError("Failed to disconnect."); }
    finally { setDisconnecting(null); }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Services</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-sm text-zinc-400">Connect services to let Axon act on your behalf.</p>
          
          {error && (
            <div className="flex items-start justify-between gap-2 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {success && (
            <div className="flex items-start justify-between gap-2 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-4 py-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-400">{success}</p>
              </div>
              <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-zinc-600 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const isConnected = service.connectionKey ? statuses[service.connectionKey] === true : false;
                const isDisconnecting = disconnecting === service.connectionKey;
                return (
                  <div key={service.id} className={`border rounded-xl p-4 md:p-5 ${isConnected ? "bg-emerald-400/5 border-emerald-400/20" : "bg-zinc-900/50 border-zinc-800/50"}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 ${isConnected ? "bg-emerald-400/10 border-emerald-400/20" : "bg-zinc-800 border-zinc-700/50"}`}>
                          <service.icon className={`w-4 h-4 ${isConnected ? "text-emerald-400" : "text-zinc-400"}`} />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-zinc-200">{service.name}</h3>
                            {isConnected && <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">Connected</span>}
                          </div>
                          <p className="text-xs text-zinc-500">{service.description}</p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {service.available && !isConnected && (
                          <button onClick={() => service.connectionName && connectService(service.connectionName)} className="text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg px-3.5 py-2 transition-colors flex items-center gap-1.5">
                            Connect <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        {isConnected && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400"><Check className="w-3.5 h-3.5" /> Active</div>
                            <button onClick={() => service.connectionKey && disconnectService(service.connectionKey)} disabled={isDisconnecting} className="text-[10px] text-zinc-600 hover:text-red-400 flex items-center gap-1 disabled:opacity-50">
                              {isDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Disconnect
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showTelegramModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setShowTelegramModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
            <h2 className="text-sm font-medium text-zinc-100">Connect Telegram</h2>
            <div className="text-xs text-zinc-400 space-y-2">
              <p>1. Open Telegram and search for <strong>@userinfobot</strong>.</p>
              <p>2. Send it any message to get your unique <strong>Id</strong>.</p>
              <p>3. Paste your numerical Id below.</p>
            </div>
            <input 
              type="text" value={chatIdInput} onChange={e => setChatIdInput(e.target.value)} 
              placeholder="e.g. 123456789"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowTelegramModal(false)} className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 hover:text-zinc-200 transition-colors">Cancel</button>
              <button onClick={saveTelegramChatId} disabled={!chatIdInput || savingTelegram} className="text-xs font-medium text-zinc-950 bg-amber-500 rounded-lg px-3.5 py-2 hover:bg-amber-400 transition-colors disabled:opacity-50">
                {savingTelegram ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}