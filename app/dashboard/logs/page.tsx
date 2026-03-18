import { Search, Filter, Download } from "lucide-react";

export default function LogsPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Action Logs</h1>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors">
            <Filter className="w-3 h-3" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 transition-colors">
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          {/* Search */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 mb-6">
            <Search className="w-4 h-4 text-zinc-600" />
            <input
              type="text"
              placeholder="Search actions, services, or scopes..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-1">Tier</div>
            <div className="col-span-4">Action</div>
            <div className="col-span-2">Scopes</div>
            <div className="col-span-1">Status</div>
          </div>

          {/* Empty State */}
          <div className="text-center py-16">
            <p className="text-sm text-zinc-600">No actions logged yet.</p>
            <p className="text-xs text-zinc-700 mt-1">
              Actions will appear here as Axon interacts with your services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}