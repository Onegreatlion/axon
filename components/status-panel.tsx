import { Activity, Shield } from "lucide-react";

const tierColors: Record<string, string> = {
  observe: "text-emerald-400",
  draft: "text-blue-400",
  act: "text-amber-400",
  transact: "text-orange-400",
  admin: "text-red-400",
};

const statusIcons: Record<string, string> = {
  executed: "text-emerald-400",
  failed: "text-red-400",
  pending: "text-amber-400",
};

export default function StatusPanel({
  mode,
  googleConnected,
  githubConnected,
  actionsToday,
  totalActions,
  recentLogs,
}: {
  mode: string;
  googleConnected: boolean;
  githubConnected: boolean;
  actionsToday: number;
  totalActions: number;
  recentLogs: any[];
}) {
  return (
    <div>
      <div className="px-4 py-3 border-b border-zinc-800/50">
        <h2 className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          Status
        </h2>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Stats
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2">
              <p className="text-lg font-medium text-zinc-200">
                {actionsToday}
              </p>
              <p className="text-[10px] text-zinc-600">Today</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-3 py-2">
              <p className="text-lg font-medium text-zinc-200">
                {totalActions}
              </p>
              <p className="text-[10px] text-zinc-600">All time</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Connected Services
          </p>
          <div className="space-y-2">
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                googleConnected
                  ? "bg-emerald-400/5 border-emerald-400/20"
                  : "bg-zinc-900/50 border-zinc-800/50"
              }`}
            >
              <span className="text-xs text-zinc-400">
                Gmail, Calendar & Drive
              </span>
              <span
                className={`text-[10px] ${
                  googleConnected ? "text-emerald-400" : "text-zinc-700"
                }`}
              >
                {googleConnected ? "Active" : "Not connected"}
              </span>
            </div>
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                githubConnected
                  ? "bg-emerald-400/5 border-emerald-400/20"
                  : "bg-zinc-900/50 border-zinc-800/50"
              }`}
            >
              <span className="text-xs text-zinc-400">GitHub</span>
              <span
                className={`text-[10px] ${
                  githubConnected ? "text-emerald-400" : "text-zinc-700"
                }`}
              >
                {githubConnected ? "Active" : "Not connected"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Recent Actions
          </p>
          {recentLogs.length === 0 ? (
            <p className="text-[10px] text-zinc-700">No actions yet</p>
          ) : (
            <div className="space-y-1">
              {recentLogs.slice(0, 8).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px]"
                >
                  <span
                    className={`font-mono font-medium ${
                      tierColors[log.risk_tier] || "text-zinc-500"
                    }`}
                  >
                    {log.risk_tier.slice(0, 3).toUpperCase()}
                  </span>
                  <span className="text-zinc-500 truncate flex-1">
                    {log.action_type}
                  </span>
                  <span
                    className={`${
                      statusIcons[log.status] || "text-zinc-600"
                    }`}
                  >
                    {log.status === "executed"
                      ? "ok"
                      : log.status === "failed"
                      ? "err"
                      : log.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Security
          </p>
          <div className="space-y-1.5 text-[10px] text-zinc-600">
            <p>Tokens stored in Auth0 Token Vault</p>
            <p>Scoped access per request</p>
            <p>No credentials in this application</p>
            <p>Constitution rules enforced</p>
            <p>Mode: {mode}</p>
          </div>
        </div>
      </div>
    </div>
  );
}