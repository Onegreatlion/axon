"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ChevronDown } from "lucide-react";

interface ActionLog {
  id: string;
  service: string;
  action_type: string;
  risk_tier: string;
  description: string;
  scopes_used: string[];
  constitution_rules_applied: string[];
  status: string;
  reasoning: string;
  metadata: any;
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(
    (log) =>
      !filter ||
      log.service.toLowerCase().includes(filter.toLowerCase()) ||
      log.action_type.toLowerCase().includes(filter.toLowerCase()) ||
      log.risk_tier.toLowerCase().includes(filter.toLowerCase()) ||
      log.status.toLowerCase().includes(filter.toLowerCase())
  );

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const tierCounts: Record<string, number> = {};
  logs.forEach((log) => {
    tierCounts[log.risk_tier] = (tierCounts[log.risk_tier] || 0) + 1;
  });

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Action Logs</h1>
        <span className="text-[10px] text-zinc-600">{logs.length} total</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-zinc-600 shrink-0" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by service, action, tier, or status..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
          </div>

          {!loading && logs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(tierCounts).map(([tier, count]) => (
                <button
                  key={tier}
                  onClick={() =>
                    setFilter(filter === tier ? "" : tier)
                  }
                  className={`text-[10px] font-mono font-medium px-2 py-1 rounded border transition-colors ${
                    filter === tier
                      ? tierColors[tier] || "text-zinc-400"
                      : "text-zinc-600 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {tier} ({count})
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-zinc-600">
                {logs.length === 0
                  ? "No actions logged yet."
                  : "No logs match your filter."}
              </p>
              <p className="text-xs text-zinc-700 mt-1">
                Actions will appear here as you interact with Axon.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <div
                    key={log.id}
                    className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : log.id)
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="hidden sm:block w-20 shrink-0">
                        <p className="text-[10px] text-zinc-600">
                          {formatDate(log.created_at)}
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          {formatTime(log.created_at)}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5 shrink-0">
                        {log.service}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border shrink-0 ${
                          tierColors[log.risk_tier] || "text-zinc-400"
                        }`}
                      >
                        {log.risk_tier}
                      </span>
                      <span className="text-xs text-zinc-400 truncate flex-1 min-w-0">
                        {log.action_type}
                      </span>
                      <span
                        className={`text-[10px] font-medium shrink-0 ${
                          statusColors[log.status] || "text-zinc-500"
                        }`}
                      >
                        {log.status}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-zinc-800/50 space-y-3 pt-3">
                        <div className="sm:hidden">
                          <p className="text-[10px] text-zinc-600">
                            {formatDate(log.created_at)} at{" "}
                            {formatTime(log.created_at)}
                          </p>
                        </div>

                        {log.description && (
                          <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                              Description
                            </p>
                            <p className="text-xs text-zinc-400 break-words">
                              {log.description}
                            </p>
                          </div>
                        )}

                        {log.reasoning && (
                          <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                              Reasoning
                            </p>
                            <p className="text-xs text-zinc-400">
                              {log.reasoning}
                            </p>
                          </div>
                        )}

                        {log.scopes_used && log.scopes_used.length > 0 && (
                          <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                              Scopes Used
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {log.scopes_used.map((scope) => (
                                <span
                                  key={scope}
                                  className="text-[10px] font-mono text-zinc-500 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5"
                                >
                                  {scope}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {log.constitution_rules_applied &&
                          log.constitution_rules_applied.length > 0 && (
                            <div>
                              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                                Constitution Rules Applied
                              </p>
                              {log.constitution_rules_applied.map(
                                (rule, i) => (
                                  <p
                                    key={i}
                                    className="text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/10 rounded px-2 py-1 mt-1"
                                  >
                                    {rule}
                                  </p>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}