import { auth0 } from "@/lib/auth0";
import { isConnectionActive } from "@/lib/token-vault";
import { getActionLogs } from "@/lib/action-log";
import { supabaseAdmin } from "@/lib/supabase";
import { Circle, ArrowRight } from "lucide-react";
import Chat from "@/components/chat";
import StatusPanel from "@/components/status-panel";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  let googleConnected = false;
  try {
    googleConnected = await isConnectionActive("google-oauth2");
  } catch {
    googleConnected = false;
  }

  let githubConnected = false;
  try {
    githubConnected = await isConnectionActive("github");
  } catch {
    githubConnected = false;
  }

  let mode = "assist";
  try {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("mode")
      .eq("auth0_id", session?.user?.sub)
      .single();
    if (profile?.mode) {
      mode = profile.mode;
    }
  } catch {}

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

  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  const anyConnected = googleConnected || githubConnected;

  if (!anyConnected) {
    return (
      <div className="h-full flex flex-col">
        <header className="hidden md:flex h-14 px-6 items-center justify-between border-b border-zinc-800/50 shrink-0">
          <h1 className="text-sm font-medium text-zinc-200">Dashboard</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3 max-w-md">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
              <div className="w-4 h-4 rounded bg-amber-500/90" />
            </div>
            <h2 className="text-lg font-medium text-zinc-200">
              Welcome to Axon
              {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
            <p className="text-sm text-zinc-500">
              Connect your Google account or GitHub to get started.
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
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header className="hidden md:flex h-14 px-6 items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Dashboard</h1>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Circle className="w-2 h-2 fill-amber-500 text-amber-500" />
          {modeLabel} mode
        </div>
      </header>

      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
        <div className="flex-1 min-w-0">
          <Chat />
        </div>
        <div className="hidden xl:block w-[19rem] shrink-0 border-l border-zinc-800/50 overflow-y-auto">
          <StatusPanel
            mode={modeLabel}
            googleConnected={googleConnected}
            githubConnected={githubConnected}
            actionsToday={actionsToday}
            totalActions={totalActions}
            recentLogs={recentLogs}
          />
        </div>
      </div>
    </div>
  );
}