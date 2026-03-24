import { auth0 } from "@/lib/auth0";
import { isConnectionActive } from "@/lib/token-vault";
import { getActionLogs } from "@/lib/action-log";
import {
  Activity,
  Layers,
  ArrowRight,
  Circle,
  Shield,
} from "lucide-react";
import Chat from "@/components/chat";

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

export default async function DashboardPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  let googleConnected = false;
  try {
    googleConnected = await isConnectionActive("google-oauth2");
  } catch {
    googleConnected = false;
  }

  let recentLogs: any[] = [];
  let totalActions = 0;
  let actionsToday = 0;
  try {
    recentLogs = await getActionLogs(10);
    const allLogs = await getActionLogs(500);
    totalActions = allLogs.length;
    const today = new Date().toDateString();
    actionsToday = allLogs.filter(
      (l: any) => new Date(l.created_at).toDateString() === today
    ).length;
  } catch {}

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <div>
          <h1 className="text-sm font-medium text-zinc-200">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Circle className="w-2 h-2 fill-amber-500 text-amber-500" />
            Assist mode
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {googleConnected ? (
          <Chat />
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                  <div className="w-4 h-4 rounded bg-amber-500/90" />
                </div>
                <h2 className="text-lg font-medium text-zinc-200">
                  Welcome to Axon
                  {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Connect your Google account to get started. Axon will be able
                  to manage your email and calendar on your behalf.
                </p>
                <a
                  href="/dashboard/services"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors mt-2"
                >
                  Connect your services
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="w-72 shrink-0 flex flex-col border-l border-zinc-800/50">
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
                    Gmail & Calendar
                  </span>
                  <span
                    className={`text-[10px] ${
                      googleConnected ? "text-emerald-400" : "text-zinc-700"
                    }`}
                  >
                    {googleConnected ? "Active" : "Not connected"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                  <span className="text-xs text-zinc-500">GitHub</span>
                  <span className="text-[10px] text-zinc-700">Coming soon</span>
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
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                <Shield className="w-3 h-3 inline mr-1" />
                Security
              </p>
              <div className="space-y-1.5 text-[10px] text-zinc-600">
                <p>Tokens stored in Auth0 Token Vault</p>
                <p>Scoped access per request</p>
                <p>No credentials in this application</p>
                <p>Constitution rules enforced</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}