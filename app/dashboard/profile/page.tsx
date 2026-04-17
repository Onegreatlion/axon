export const runtime = 'edge';
import { auth0 } from "@/lib/auth0";
import { supabaseAdmin } from "@/lib/supabase";
import { isConnectionActive } from "@/lib/token-vault";
import { getActionLogs } from "@/lib/action-log";
import { User, Mail, Shield, Activity, Calendar } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth0.getSession();
  const user = session?.user;

  let mode = "assist";
  let tone = "professional";
  let createdAt = "";
  try {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("mode, tone, created_at")
      .eq("auth0_id", user?.sub)
      .single();
    if (profile?.mode) mode = profile.mode;
    if (profile?.tone) tone = profile.tone;
    if (profile?.created_at) createdAt = profile.created_at;
  } catch {}

  let googleConnected = false;
  let githubConnected = false;
  try {
    googleConnected = await isConnectionActive("google-oauth2");
  } catch {}
  try {
    githubConnected = await isConnectionActive("github");
  } catch {}

  let totalActions = 0;
  try {
    const allLogs = await getActionLogs(500);
    totalActions = allLogs.length;
  } catch {}

  const connectedCount =
    (googleConnected ? 1 : 0) + (githubConnected ? 1 : 0);

  const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
  const toneLabel = tone.charAt(0).toUpperCase() + tone.slice(1);

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  const loginProvider = user?.sub?.startsWith("github")
    ? "GitHub"
    : user?.sub?.startsWith("google")
    ? "Google"
    : "Auth0";

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-medium text-zinc-400">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-lg font-medium text-zinc-200">
                {user?.name || "User"}
              </h2>
              <p className="text-sm text-zinc-500">{user?.email || ""}</p>
              <p className="text-[10px] text-zinc-600 mt-1">
                Signed in with {loginProvider}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Activity className="w-3.5 h-3.5 text-zinc-500" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Actions
                </p>
              </div>
              <p className="text-xl font-medium text-zinc-200">
                {totalActions}
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Mode
                </p>
              </div>
              <p className="text-xl font-medium text-zinc-200">{modeLabel}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Tone
                </p>
              </div>
              <p className="text-xl font-medium text-zinc-200">{toneLabel}</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  Services
                </p>
              </div>
              <p className="text-xl font-medium text-zinc-200">
                {connectedCount}
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-zinc-200">
              Account Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Name</span>
                <span className="text-xs text-zinc-300">
                  {user?.name || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Email</span>
                <span className="text-xs text-zinc-300">
                  {user?.email || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Auth Provider</span>
                <span className="text-xs text-zinc-300">{loginProvider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Member Since</span>
                <span className="text-xs text-zinc-300">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">User ID</span>
                <span className="text-[10px] font-mono text-zinc-600 truncate max-w-[200px]">
                  {user?.sub || ""}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-zinc-200">
              Connected Services
            </h3>
            <div className="space-y-2">
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
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
                  {googleConnected ? "Connected" : "Not connected"}
                </span>
              </div>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
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
                  {githubConnected ? "Connected" : "Not connected"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-medium text-zinc-200">
              Security
            </h3>
            <div className="space-y-1.5 text-xs text-zinc-600">
              <p>Authentication managed by Auth0</p>
              <p>OAuth tokens stored in Auth0 Token Vault</p>
              <p>No credentials stored in this application</p>
              <p>All agent actions logged with risk classification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}