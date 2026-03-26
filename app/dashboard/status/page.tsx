import { auth0 } from "@/lib/auth0";
import { isConnectionActive } from "@/lib/token-vault";
import { getActionLogs } from "@/lib/action-log";
import { supabaseAdmin } from "@/lib/supabase";
import StatusPanel from "@/components/status-panel";

export default async function StatusPage() {
  const session = await auth0.getSession();

  let googleConnected = false;
  try {
    googleConnected = await isConnectionActive("google-oauth2");
  } catch {}

  let githubConnected = false;
  try {
    githubConnected = await isConnectionActive("github");
  } catch {}

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

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Status</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
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
  );
}