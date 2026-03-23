import { RiskTier } from "@/lib/action-log";

interface ClassificationResult {
  tier: RiskTier;
  reasoning: string;
  requiresApproval: boolean;
  requiresStepUp: boolean;
  scopes: string[];
}

const TIER_RULES: Record<string, { tier: RiskTier; scopes: string[] }> = {
  get_email_count: {
    tier: "observe",
    scopes: ["gmail.readonly"],
  },
  list_emails: {
    tier: "observe",
    scopes: ["gmail.readonly"],
  },
  list_calendar_events: {
    tier: "observe",
    scopes: ["calendar.events.readonly"],
  },
  draft_email: {
    tier: "draft",
    scopes: ["gmail.send"],
  },
  send_email: {
    tier: "act",
    scopes: ["gmail.send"],
  },
  create_calendar_event: {
    tier: "act",
    scopes: ["calendar.events"],
  },
  delete_email: {
    tier: "transact",
    scopes: ["gmail.modify"],
  },
  delete_calendar_event: {
    tier: "transact",
    scopes: ["calendar.events"],
  },
};

export function classifyIntent(toolName: string): ClassificationResult {
  const rule = TIER_RULES[toolName];

  if (!rule) {
    return {
      tier: "admin",
      reasoning: "Unknown action — requires manual review",
      requiresApproval: true,
      requiresStepUp: true,
      scopes: [],
    };
  }

  const requiresApproval = rule.tier === "act" || rule.tier === "transact" || rule.tier === "admin";
  const requiresStepUp = rule.tier === "transact" || rule.tier === "admin";

  const reasoningMap: Record<RiskTier, string> = {
    observe: "Read-only access. No data is modified.",
    draft: "Content created but not sent or published.",
    act: "This action will modify external resources.",
    transact: "Irreversible or destructive action.",
    admin: "Permission or configuration change.",
  };

  return {
    tier: rule.tier,
    reasoning: reasoningMap[rule.tier],
    requiresApproval,
    requiresStepUp,
    scopes: rule.scopes,
  };
}