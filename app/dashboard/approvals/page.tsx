"use client";
export const runtime = 'edge';


import { useState, useEffect } from "react";
import { Loader2, Check, X, Clock, Shield } from "lucide-react";

interface Approval {
  id: string;
  service: string;
  action_type: string;
  risk_tier: string;
  args: any;
  scopes_required: string[];
  constitution_rules_applied: string[];
  reasoning: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

const tierColors: Record<string, string> = {
  observe: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  draft: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  act: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  transact: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  admin: "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function fetchApprovals() {
    try {
      const res = await fetch("/api/approvals");
      const data = await res.json();
      if (data.approvals) setApprovals(data.approvals);
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approved" | "rejected") {
    setActing(id);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setApprovals((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: action, resolved_at: new Date().toISOString() }
              : a
          )
        );
      }
    } catch (err) {
      console.error("Failed to resolve approval:", err);
    } finally {
      setActing(null);
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function describeAction(approval: Approval): string {
    const args = approval.args || {};
    switch (approval.action_type) {
      case "send_email":
        return `Send email to ${args.to || "unknown"}: "${args.subject || ""}"`;
      case "create_calendar_event":
        return `Create event: "${args.summary || ""}"`;
      case "create_issue":
        return `Create issue in ${args.repo || "unknown"}: "${args.title || ""}"`;
      case "add_comment":
        return `Comment on ${args.repo || "unknown"} #${args.issue_number || "?"}`;
      default:
        return approval.action_type;
    }
  }

  const pending = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Approvals</h1>
        {pending.length > 0 && (
          <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5">
            {pending.length} pending
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">No approval requests yet.</p>
              <p className="text-xs text-zinc-700 mt-1">
                When Axon needs to perform a risky action, it will appear here
                for your review.
              </p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                    Pending ({pending.length})
                  </p>
                  {pending.map((approval) => (
                    <div
                      key={approval.id}
                      className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5">
                          {approval.service}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                            tierColors[approval.risk_tier] || "text-zinc-400"
                          }`}
                        >
                          {approval.risk_tier}
                        </span>
                        <span className="text-[10px] text-zinc-600 ml-auto">
                          {formatTime(approval.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-zinc-200">
                        {describeAction(approval)}
                      </p>

                      {approval.reasoning && (
                        <p className="text-xs text-zinc-500">
                          {approval.reasoning}
                        </p>
                      )}

                      {approval.constitution_rules_applied?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-zinc-500">
                            Triggered by:
                          </p>
                          {approval.constitution_rules_applied.map(
                            (rule, i) => (
                              <p
                                key={i}
                                className="text-[10px] text-amber-400/80 bg-amber-400/5 border border-amber-400/10 rounded px-2 py-1"
                              >
                                {rule}
                              </p>
                            )
                          )}
                        </div>
                      )}

                      {approval.scopes_required?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {approval.scopes_required.map((scope) => (
                            <span
                              key={scope}
                              className="text-[10px] font-mono text-zinc-600 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5"
                            >
                              {scope}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() =>
                            handleAction(approval.id, "approved")
                          }
                          disabled={acting === approval.id}
                          className="flex-1 sm:flex-none text-xs font-medium text-zinc-950 bg-emerald-500 rounded-lg px-4 py-2 hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {acting === approval.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleAction(approval.id, "rejected")
                          }
                          disabled={acting === approval.id}
                          className="flex-1 sm:flex-none text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2 hover:bg-red-400/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {resolved.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                    Resolved ({resolved.length})
                  </p>
                  {resolved.map((approval) => (
                    <div
                      key={approval.id}
                      className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 space-y-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-medium ${
                            approval.status === "approved"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {approval.status}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5">
                          {approval.service}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${
                            tierColors[approval.risk_tier] || "text-zinc-400"
                          }`}
                        >
                          {approval.risk_tier}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        {describeAction(approval)}
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        {formatTime(approval.created_at)}
                        {approval.resolved_at &&
                          ` — resolved ${formatTime(approval.resolved_at)}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}