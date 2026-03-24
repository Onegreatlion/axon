"use client";
import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

interface ActionLog {
  id: string;
  service: string;
  action_type: string;
  risk_tier: string;
  description: string;
  scopes_used: string[];
  status: string;
  reasoning: string;
  created_at: string;
}

const tierColors: Record<string, string> = {
  observe: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  draft: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  act: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  transact: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  admin: "text-red-400 bg-red-400/10 border-red-400/20",
};

const statusColors: Record<string, string> = {
  executed: "text-emerald-400",
  pending: "text-amber-400",
  denied: "text-red-400",
  failed: "text-red-400",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      !filter ||
      log.service.includes(filter.toLowerCase()) ||
      log.action_type.includes(filter.toLowerCase()) ||
      log.risk_tier.includes(filter.toLowerCase())
  );

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Action Logs</h1>
        <span className="text-[10px] text-zinc-600">
          {logs.length} actions logged
        </span>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 mb-6">
            <Search className="w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by service, action, or tier..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-600">No actions logged yet.</p>
              <p className="text-xs text-zinc-700 mt-1">
                Actions will appear here as you interact with Axon.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-900/50 transition-colors group"
                >
                  <div className="w-16 shrink-0">
                    <p className="text-[10px] text-zinc-600">
                      {formatDate(log.created_at)}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500">
                      {formatTime(log.created_at)}
                    </p>
                  </div>
                  <div className="w-16 shrink-0">
                    <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5">
                      {log.service}
                    </span>
                  </div>
                  <div className="w-20 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                        tierColors[log.risk_tier] || "text-zinc-400"
                      }`}
                    >
                      {log.risk_tier}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400 truncate">
                      {log.action_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.scopes_used?.map((scope) => (
                      <span
                        key={scope}
                        className="text-[10px] font-mono text-zinc-600 hidden group-hover:inline"
                      >
                        {scope}
                      </span>
                    ))}
                    <span
                      className={`text-[10px] font-medium ${
                        statusColors[log.status] || "text-zinc-500"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}