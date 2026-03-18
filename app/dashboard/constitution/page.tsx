import { Plus, GripVertical, ToggleLeft } from "lucide-react";

const defaultRules = [
  "You may read all my emails but only send replies I have reviewed.",
  "You may manage my calendar freely except for canceling meetings with external attendees.",
  "Never post on any platform without my explicit approval.",
  "Any action involving money or purchases requires my authentication.",
];

export default function ConstitutionPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Constitution</h1>
        <button className="flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg px-3 py-1.5 transition-colors">
          <Plus className="w-3 h-3" />
          Add rule
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-sm text-zinc-400">
              Define what Axon can and cannot do in plain English. Each rule is
              parsed and mapped to scope restrictions, behavioral constraints,
              and step-up authentication triggers.
            </p>
          </div>

          <div className="space-y-2">
            {defaultRules.map((rule, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 group"
              >
                <button className="mt-0.5 text-zinc-700 hover:text-zinc-500 cursor-grab">
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">{rule}</p>
                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5">
                      Rule {index + 1}
                    </span>
                    <span className="text-[10px] text-zinc-600">Active</span>
                  </div>
                </div>
                <button className="text-zinc-700 hover:text-zinc-400 transition-colors">
                  <ToggleLeft className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
            <h3 className="text-xs font-medium text-zinc-400 mb-2">
              How rules are enforced
            </h3>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li>
                Rules are parsed by the intent classification engine before
                every agent action.
              </li>
              <li>
                Restrictions like &quot;never send without approval&quot; map to
                requiring user confirmation for Act-tier intents.
              </li>
              <li>
                Rules mentioning money, deletion, or authentication map to
                step-up auth triggers.
              </li>
              <li>
                You can reorder rules by priority. Higher rules take
                precedence in conflicts.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}