export type RiskTier = "observe" | "draft" | "act" | "transact" | "admin";

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
  list_drive_files: {
    tier: "observe",
    scopes: ["drive.readonly"],
  },
  search_drive_files: {
    tier: "observe",
    scopes: ["drive.readonly"],
  },
  list_repos: {
    tier: "observe",
    scopes: ["repo"],
  },
  list_issues: {
    tier: "observe",
    scopes: ["repo"],
  },
  list_pull_requests: {
    tier: "observe",
    scopes: ["repo"],
  },
  get_notifications: {
    tier: "observe",
    scopes: ["notifications"],
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
  create_issue: {
    tier: "act",
    scopes: ["repo"],
  },
  add_comment: {
    tier: "act",
    scopes: ["repo"],
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
      reasoning: "Unknown action type. Requires manual review.",
      requiresApproval: true,
      requiresStepUp: true,
      scopes: [],
    };
  }

  const requiresApproval =
    rule.tier === "act" ||
    rule.tier === "transact" ||
    rule.tier === "admin";
  const requiresStepUp =
    rule.tier === "transact" || rule.tier === "admin";

  const reasoningMap: Record<RiskTier, string> = {
    observe: "Read-only access. No data is modified. Auto-approved.",
    draft: "Content created but not sent or published. Auto-approved.",
    act: "This action modifies external resources. Requires approval in assist mode.",
    transact: "Irreversible or destructive action. Always requires approval.",
    admin: "Permission or configuration change. Always requires manual confirmation.",
  };

  return {
    tier: rule.tier,
    reasoning: reasoningMap[rule.tier],
    requiresApproval,
    requiresStepUp,
    scopes: rule.scopes,
  };
}