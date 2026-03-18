import { auth0 } from "@/lib/auth0";
import {
  Activity,
  Layers,
  ArrowRight,
  Circle,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  const user = session?.user;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <div>
          <h1 className="text-sm font-medium text-zinc-200">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Circle className="w-2 h-2 fill-amber-500 text-amber-500" />
            Shadow mode
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col border-r border-zinc-800/50">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Welcome Message */}
              <div className="text-center py-12 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
                  <div className="w-4 h-4 rounded bg-amber-500/90" />
                </div>
                <h2 className="text-lg font-medium text-zinc-200">
                  Welcome to Axon{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                </h2>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Connect your services to get started. Once connected, you can
                  ask Axon to manage your email, calendar, code reviews, and
                  messages.
                </p>
                <a
                  href="/dashboard/services"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors mt-2"
                >
                  Connect your first service
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-zinc-800/50">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <input
                  type="text"
                  placeholder="Ask Axon to do something..."
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
                  disabled
                />
                <button
                  disabled
                  className="text-xs text-zinc-600 bg-zinc-800 px-3 py-1.5 rounded-lg"
                >
                  Send
                </button>
              </div>
              <p className="text-[10px] text-zinc-700 mt-2 text-center">
                Connect at least one service to start chatting
              </p>
            </div>
          </div>
        </div>

        {/* Activity Panel */}
        <div className="w-80 shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <h2 className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Activity
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center py-12">
              <p className="text-xs text-zinc-600">No activity yet</p>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-zinc-800/50">
            <h2 className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              Services
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {["Gmail", "Calendar", "GitHub", "Slack"].map((service) => (
              <div
                key={service}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50"
              >
                <span className="text-xs text-zinc-500">{service}</span>
                <span className="text-[10px] text-zinc-700">
                  Not connected
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}