"use client";
export const runtime = 'edge';

import { useState, useEffect } from "react";
import { Plus, X, Loader2, Info, Shield } from "lucide-react";

interface Rule {
  id: string;
  rule_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function ConstitutionPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState("");
  const [adding, setAdding] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      const res = await fetch("/api/constitution");
      const data = await res.json();
      if (data.rules) setRules(data.rules);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addRule() {
    if (!newRule.trim() || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/constitution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_text: newRule }),
      });
      const data = await res.json();
      if (data.rule) {
        setRules([...rules, data.rule]);
        setNewRule("");
      }
    } catch (err) {
      console.error("Failed to add rule:", err);
    } finally {
      setAdding(false);
    }
  }

  async function removeRule(id: string) {
    try {
      await fetch("/api/constitution", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setRules(rules.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to remove rule:", err);
    }
    setShowDeleteDialog(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addRule();
    }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Constitution</h1>
        <span className="text-[10px] text-zinc-600">
          {rules.length} active {rules.length === 1 ? "rule" : "rules"}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500/50 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-400">
              Define what Axon can and cannot do in plain English. These rules
              are enforced at runtime before every action the agent takes. They
              are not just prompt instructions — they structurally block or
              redirect actions that violate your boundaries.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <textarea
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a rule, e.g. 'Never send emails without my approval'"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700 transition-colors resize-none"
              rows={2}
            />
            <button
              onClick={addRule}
              disabled={!newRule.trim() || adding}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-xl px-4 py-3 transition-colors disabled:opacity-30 shrink-0"
            >
              {adding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              Add
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm text-zinc-600">No rules defined yet.</p>
              <p className="text-xs text-zinc-700">
                Add rules to control how Axon behaves on your behalf.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 group"
                >
                  <span className="text-[10px] font-mono text-zinc-600 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">{rule.rule_text}</p>
                    <p className="text-[10px] text-zinc-700 mt-1.5">
                      Added{" "}
                      {new Date(rule.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteDialog(rule.id)}
                    className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 p-1"
                    title="Remove rule"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
            <h3 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              How rules are enforced
            </h3>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li>
                Rules are checked in application code before any tool executes,
                not just included in the AI prompt.
              </li>
              <li>
                If a rule blocks an action, the action is converted to an
                approval request instead of executing.
              </li>
              <li>
                Rules apply across all operating modes. Even in Autopilot,
                constitution rules cannot be overridden.
              </li>
              <li>
                The Logs page shows which rules were applied to each action.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDeleteDialog(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-medium text-zinc-100">
              Remove constitution rule
            </h2>
            <p className="text-sm text-zinc-500 mt-2">
              This rule will no longer be enforced. Actions that were previously
              blocked by this rule will be allowed.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => removeRule(showDeleteDialog)}
                className="text-xs font-medium text-zinc-950 bg-red-500 rounded-lg px-3.5 py-2 hover:bg-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}