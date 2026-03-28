import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getConnectionToken } from "@/lib/token-vault";
import { listEmails, sendEmail, getEmailCount } from "@/lib/services/gmail";
import { listEvents, createEvent } from "@/lib/services/calendar";
import { listFiles, searchFiles } from "@/lib/services/drive";
import {
  listRepos, listIssues, listPullRequests, getNotifications,
  createIssue, addComment,
} from "@/lib/services/github";
import { listTaskLists, listTasks, createTask, completeTask } from "@/lib/services/tasks";
import { searchContacts, listConnections } from "@/lib/services/contacts";
import { logAction } from "@/lib/action-log";
import { classifyIntent } from "@/lib/classifier";
import { supabaseAdmin } from "@/lib/supabase";
import { chatCompletion } from "@/lib/ai";

const GITHUB_TOOL_NAMES = [
  "list_repos", "list_issues", "list_pull_requests",
  "get_notifications", "create_issue", "add_comment",
];

function getServiceName(toolName: string): string {
  if (toolName.includes("calendar")) return "calendar";
  if (toolName.includes("drive")) return "drive";
  if (toolName.includes("task")) return "tasks";
  if (toolName.includes("contact")) return "contacts";
  if (GITHUB_TOOL_NAMES.includes(toolName)) return "github";
  return "gmail";
}

function getConnectionForTool(toolName: string): string {
  if (GITHUB_TOOL_NAMES.includes(toolName)) return "github";
  return "google-oauth2";
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_email_count",
      description: "Get total and unread email count",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_emails",
      description: "List recent emails with sender, subject, snippet",
      parameters: {
        type: "object",
        properties: {
          max_results: { type: "number", description: "Number of emails (default 5, max 10)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_emails",
      description: "Search emails by query (supports Gmail search syntax: from:, to:, subject:, has:attachment, is:unread, before:, after:, label:)",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          max_results: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "draft_email",
      description: "Draft an email for user review before sending",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email" },
          subject: { type: "string", description: "Subject line" },
          body: { type: "string", description: "Email body" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_email",
      description: "Send an email. Only after user explicitly approves.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email" },
          subject: { type: "string", description: "Subject line" },
          body: { type: "string", description: "Email body" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "archive_emails",
      description: "Archive emails by removing them from inbox (moves to All Mail)",
      parameters: {
        type: "object",
        properties: {
          message_ids: { type: "array", items: { type: "string" }, description: "Array of email message IDs to archive" },
        },
        required: ["message_ids"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "mark_emails_read",
      description: "Mark emails as read",
      parameters: {
        type: "object",
        properties: {
          message_ids: { type: "array", items: { type: "string" }, description: "Array of email message IDs" },
        },
        required: ["message_ids"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_calendar_events",
      description: "List upcoming calendar events",
      parameters: {
        type: "object",
        properties: {
          max_results: { type: "number", description: "Number of events (default 5)" },
          time_min: { type: "string", description: "Start time filter (ISO 8601). Defaults to now." },
          time_max: { type: "string", description: "End time filter (ISO 8601). Optional." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_calendar_event",
      description: "Create a calendar event",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Event title" },
          start_time: { type: "string", description: "Start time ISO 8601" },
          end_time: { type: "string", description: "End time ISO 8601" },
          description: { type: "string", description: "Event description" },
          location: { type: "string", description: "Event location" },
          attendees: { type: "array", items: { type: "string" }, description: "Attendee email addresses" },
        },
        required: ["summary", "start_time", "end_time"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_drive_files",
      description: "List recent Google Drive files",
      parameters: {
        type: "object",
        properties: { max_results: { type: "number", description: "Number of files (default 10)" } },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_drive_files",
      description: "Search Google Drive files by name",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          max_results: { type: "number", description: "Max results (default 10)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_repos",
      description: "List GitHub repositories sorted by most recently updated",
      parameters: {
        type: "object",
        properties: { max_results: { type: "number", description: "Number of repos (default 10)" } },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_issues",
      description: "List issues for a GitHub repository",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository full name (owner/repo)" },
          state: { type: "string", description: "open, closed, or all" },
          max_results: { type: "number" },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_pull_requests",
      description: "List pull requests for a GitHub repository",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository full name" },
          state: { type: "string" },
          max_results: { type: "number" },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_notifications",
      description: "Get GitHub notifications",
      parameters: {
        type: "object",
        properties: { max_results: { type: "number" } },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_issue",
      description: "Create a GitHub issue",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repository full name" },
          title: { type: "string" },
          body: { type: "string" },
          labels: { type: "array", items: { type: "string" } },
        },
        required: ["repo", "title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_comment",
      description: "Comment on a GitHub issue or PR",
      parameters: {
        type: "object",
        properties: {
          repo: { type: "string" },
          issue_number: { type: "number" },
          body: { type: "string" },
        },
        required: ["repo", "issue_number", "body"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "List Google Tasks",
      parameters: {
        type: "object",
        properties: { max_results: { type: "number" } },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a Google Task",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          notes: { type: "string" },
          due: { type: "string", description: "Due date RFC 3339" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "complete_task",
      description: "Mark a task as completed",
      parameters: {
        type: "object",
        properties: { task_id: { type: "string" } },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_contacts",
      description: "Search Google Contacts by name or email",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "daily_briefing",
      description: "Generate a comprehensive daily briefing across all connected services. Checks unread emails, today's calendar, pending tasks, and GitHub notifications.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

async function getUserProfile(auth0Id: string) {
  let { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, mode, tone")
    .eq("auth0_id", auth0Id)
    .single();
  if (!profile) {
    const { data: newProfile } = await supabaseAdmin
      .from("user_profiles")
      .insert({ auth0_id: auth0Id, display_name: "", email: "" })
      .select("id, mode, tone")
      .single();
    profile = newProfile;
  }
  return profile;
}

async function getConstitutionRules(userId: string): Promise<{ id: string; rule_text: string }[]> {
  try {
    const { data: rules } = await supabaseAdmin
      .from("constitution_rules")
      .select("id, rule_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return rules || [];
  } catch { return []; }
}

function checkConstitutionRules(
  toolName: string, args: any, rules: { id: string; rule_text: string }[]
): { blocked: boolean; appliedRules: string[]; explanation: string } {
  const appliedRules: string[] = [];
  let blocked = false;
  let explanation = "";
  for (const rule of rules) {
    const lower = rule.rule_text.toLowerCase();
    if ((toolName === "send_email" || toolName === "draft_email") &&
      (lower.includes("never send email") || lower.includes("no email") ||
       lower.includes("without my approval") || lower.includes("without approval"))) {
      if (toolName === "send_email") {
        appliedRules.push(rule.rule_text);
        blocked = true;
        explanation = `Blocked by constitution rule: "${rule.rule_text}".`;
      }
    }
    if (toolName === "create_calendar_event" &&
      (lower.includes("no calendar") || lower.includes("never create event") ||
       (lower.includes("calendar") && lower.includes("approval")))) {
      appliedRules.push(rule.rule_text);
      blocked = true;
      explanation = `Blocked by constitution rule: "${rule.rule_text}".`;
    }
    if ((toolName === "create_issue" || toolName === "add_comment") &&
      (lower.includes("no github") || lower.includes("never create issue") ||
       (lower.includes("github") && lower.includes("approval")))) {
      appliedRules.push(rule.rule_text);
      blocked = true;
      explanation = `Blocked by constitution rule: "${rule.rule_text}".`;
    }
  }
  return { blocked, appliedRules, explanation };
}

function buildSystemPrompt(rules: { id: string; rule_text: string }[], mode: string, tone: string): string {
  let prompt = `You are Axon, an autonomous AI agent managing a user's digital life. You have access to Gmail, Calendar, Drive, GitHub, Tasks, and Contacts through Auth0 Token Vault.

Operating Mode: ${mode?.toUpperCase() || "ASSIST"}
${mode === "shadow"
  ? "SHADOW MODE: Observe and summarize only. Never modify anything."
  : mode === "autopilot"
  ? `AUTOPILOT MODE: Maximum autonomy. Execute routine actions without asking.
- Auto-archive spam and marketing emails
- Auto-accept calendar invites from known contacts
- Auto-create tasks from emails containing action items
- Auto-mark processed emails as read
- Chain multiple operations together
- Only pause for: emails to new recipients, financial content, destructive actions, constitution violations`
  : `ASSIST MODE: Observe freely. Draft before sending. Ask approval for modifications. Be proactive about suggesting next actions.`}

You have 21 tools available. Use them aggressively to be helpful:
- EMAIL: get_email_count, list_emails, search_emails, draft_email, send_email, archive_emails, mark_emails_read
- CALENDAR: list_calendar_events, create_calendar_event
- DRIVE: list_drive_files, search_drive_files
- GITHUB: list_repos, list_issues, list_pull_requests, get_notifications, create_issue, add_comment
- TASKS: list_tasks, create_task, complete_task
- CONTACTS: search_contacts
- META: daily_briefing

Key behaviors:
- When asked for updates or briefings, use daily_briefing to check everything at once
- When emailing someone, search contacts first to verify the address
- When creating events, check calendar for conflicts first
- After completing an action, suggest logical follow-ups
- Use markdown formatting with headers, bullets, and bold for clarity
- Be concise but thorough
- Current time: ${new Date().toISOString()}`;

  if (rules.length > 0) {
    prompt += `\n\nConstitution (MUST obey):`;
    rules.forEach((rule, i) => { prompt += `\n${i + 1}. ${rule.rule_text}`; });
    prompt += `\nViolations are blocked and routed to the approval queue.`;
  }

  const toneMap: Record<string, string> = {
    professional: "Be professional, clear, and courteous.",
    casual: "Be friendly and approachable.",
    direct: "Be brief. No filler. Facts and actions only.",
  };
  if (tone && toneMap[tone]) prompt += `\n\nTone: ${toneMap[tone]}`;

  return prompt;
}

async function executeTool(
  name: string, args: any, userId: string,
  rules: { id: string; rule_text: string }[], mode: string
): Promise<string> {
  const classification = classifyIntent(name);
  const service = getServiceName(name);

  if (mode === "shadow" && classification.tier !== "observe") {
    await logAction({ service, actionType: name, riskTier: classification.tier,
      description: `${name} blocked: Shadow mode`, scopesUsed: classification.scopes,
      status: "denied", reasoning: "Shadow mode active.", metadata: { args, mode } });
    return JSON.stringify({ error: "Shadow mode active. Only observation allowed." });
  }

  const ruleCheck = checkConstitutionRules(name, args, rules);
  if (ruleCheck.blocked || (classification.tier === "act" && mode !== "autopilot")) {
    const { data: approval } = await supabaseAdmin
      .from("approval_requests")
      .insert({
        user_id: userId, service, action_type: name, risk_tier: classification.tier,
        args, scopes_required: classification.scopes,
        constitution_rules_applied: ruleCheck.appliedRules,
        reasoning: ruleCheck.explanation || `${classification.tier}-tier action requires approval in ${mode} mode`,
        status: "pending",
      })
      .select("id").single();

    await logAction({ service, actionType: name, riskTier: classification.tier,
      description: `${name} requires approval`, scopesUsed: classification.scopes,
      status: "pending", reasoning: ruleCheck.explanation || `Approval required`,
      metadata: { args, rulesApplied: ruleCheck.appliedRules, approvalId: approval?.id } });

    return JSON.stringify({
      status: "approval_required", approvalId: approval?.id,
      message: ruleCheck.explanation || "This action requires your approval. Check the Approvals page.",
      action: name, args,
    });
  }

  try {
    const connection = getConnectionForTool(name);
    const token = await getConnectionToken(connection);
    let result: string;

    switch (name) {
      case "get_email_count": {
        const count = await getEmailCount(token);
        result = JSON.stringify(count);
        break;
      }
      case "list_emails": {
        const max = Math.min(args.max_results || 5, 10);
        const emails = await listEmails(token, max);
        result = JSON.stringify(emails.map((e) => ({
          id: e.id, from: e.from, subject: e.subject,
          snippet: e.snippet.substring(0, 120), date: e.date, unread: e.isUnread,
        })));
        break;
      }
      case "search_emails": {
        const max = Math.min(args.max_results || 5, 10);
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(args.query)}&maxResults=${max}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (!data.messages) { result = JSON.stringify([]); break; }
        const emails = [];
        for (const msg of data.messages.slice(0, max)) {
          const detail = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const m = await detail.json();
          const headers = m.payload?.headers || [];
          const getH = (n: string) => headers.find((h: any) => h.name === n)?.value || "";
          emails.push({ id: m.id, from: getH("From"), subject: getH("Subject"), date: getH("Date"), snippet: m.snippet?.substring(0, 120) });
        }
        result = JSON.stringify(emails);
        break;
      }
      case "draft_email": {
        result = JSON.stringify({ status: "draft_ready", to: args.to, subject: args.subject, body: args.body, message: "Draft created. Say 'send it' to send." });
        break;
      }
      case "send_email": {
        const sendResult = await sendEmail(token, args.to, args.subject, args.body);
        result = JSON.stringify({ status: "sent", ...sendResult });
        break;
      }
      case "archive_emails": {
        const archived = [];
        for (const msgId of (args.message_ids || [])) {
          await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}/modify`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ removeLabelIds: ["INBOX"] }),
          });
          archived.push(msgId);
        }
        result = JSON.stringify({ status: "archived", count: archived.length });
        break;
      }
      case "mark_emails_read": {
        for (const msgId of (args.message_ids || [])) {
          await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}/modify`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
          });
        }
        result = JSON.stringify({ status: "marked_read", count: (args.message_ids || []).length });
        break;
      }
      case "list_calendar_events": {
        const max = Math.min(args.max_results || 5, 10);
        const events = await listEvents(token, max);
        result = JSON.stringify(events.map((e) => ({
          summary: e.summary, start: e.start, end: e.end, location: e.location || undefined,
        })));
        break;
      }
      case "create_calendar_event": {
        const event = await createEvent(token, args.summary, args.start_time, args.end_time, args.description);
        result = JSON.stringify({ status: "created", event: { summary: event.summary, start: event.start, end: event.end, link: event.htmlLink } });
        break;
      }
      case "list_drive_files": {
        const files = await listFiles(token, undefined, Math.min(args.max_results || 10, 20));
        result = JSON.stringify(files.map((f) => ({ name: f.name, type: f.mimeType, modified: f.modifiedTime, link: f.webViewLink })));
        break;
      }
      case "search_drive_files": {
        const files = await searchFiles(token, args.query, Math.min(args.max_results || 10, 20));
        result = JSON.stringify(files.map((f) => ({ name: f.name, type: f.mimeType, modified: f.modifiedTime, link: f.webViewLink })));
        break;
      }
      case "list_repos": {
        const repos = await listRepos(token, Math.min(args.max_results || 10, 20));
        result = JSON.stringify(repos.map((r) => ({ name: r.full_name, description: r.description, language: r.language, stars: r.stargazers_count, updated: r.updated_at, private: r.private, url: r.html_url })));
        break;
      }
      case "list_issues": {
        const issues = await listIssues(token, args.repo, args.state || "open", Math.min(args.max_results || 10, 20));
        result = JSON.stringify(issues.map((i) => ({ number: i.number, title: i.title, state: i.state, author: i.user.login, labels: i.labels.map((l) => l.name), updated: i.updated_at, url: i.html_url })));
        break;
      }
      case "list_pull_requests": {
        const prs = await listPullRequests(token, args.repo, args.state || "open", Math.min(args.max_results || 10, 20));
        result = JSON.stringify(prs.map((p) => ({ number: p.number, title: p.title, state: p.state, author: p.user.login, branch: `${p.head.ref} -> ${p.base.ref}`, draft: p.draft, updated: p.updated_at, url: p.html_url })));
        break;
      }
      case "get_notifications": {
        const notifs = await getNotifications(token, Math.min(args.max_results || 10, 20));
        result = JSON.stringify(notifs.map((n) => ({ reason: n.reason, title: n.subject.title, type: n.subject.type, repo: n.repository.full_name, unread: n.unread })));
        break;
      }
      case "create_issue": {
        const issue = await createIssue(token, args.repo, args.title, args.body, args.labels);
        result = JSON.stringify({ status: "created", number: issue.number, title: issue.title, url: issue.html_url });
        break;
      }
      case "add_comment": {
        const comment = await addComment(token, args.repo, args.issue_number, args.body);
        result = JSON.stringify({ status: "commented", url: comment.html_url });
        break;
      }
      case "list_tasks": {
        const tasks = await listTasks(token, "@default", args.max_results || 20);
        result = JSON.stringify(tasks);
        break;
      }
      case "create_task": {
        const task = await createTask(token, args.title, args.notes, args.due);
        result = JSON.stringify({ ...task, status: "created" });
        break;
      }
      case "complete_task": {
        await completeTask(token, args.task_id);
        result = JSON.stringify({ status: "completed", task_id: args.task_id });
        break;
      }
      case "search_contacts": {
        const contacts = await searchContacts(token, args.query);
        result = JSON.stringify(contacts);
        break;
      }
      case "daily_briefing": {
        const googleToken = await getConnectionToken("google-oauth2");
        const briefing: any = {};
        try { briefing.email = await getEmailCount(googleToken); } catch { briefing.email = { error: "unavailable" }; }
        try { briefing.calendar = (await listEvents(googleToken, 5)).map((e) => ({ summary: e.summary, start: e.start, end: e.end })); } catch { briefing.calendar = []; }
        try { briefing.tasks = await listTasks(googleToken, "@default", 10); } catch { briefing.tasks = []; }
        try {
          const ghToken = await getConnectionToken("github");
          briefing.github_notifications = (await getNotifications(ghToken, 5)).map((n) => ({ title: n.subject.title, repo: n.repository.full_name, reason: n.reason }));
        } catch { briefing.github_notifications = []; }
        result = JSON.stringify(briefing);
        break;
      }
      default:
        result = JSON.stringify({ error: "Unknown tool" });
    }

    await logAction({ service, actionType: name, riskTier: classification.tier,
      description: `${name}(${JSON.stringify(args).substring(0, 200)})`,
      scopesUsed: classification.scopes, status: "executed",
      reasoning: classification.reasoning, metadata: { args, classification } });

    return result;
  } catch (error: any) {
    await logAction({ service, actionType: name, riskTier: classification.tier,
      description: `${name} failed: ${error.message}`, scopesUsed: classification.scopes,
      status: "failed", reasoning: classification.reasoning,
      metadata: { args, error: error.message } });
    return JSON.stringify({ error: error.message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const profile = await getUserProfile(session.user.sub);
    if (!profile) return NextResponse.json({ error: "User profile not found" }, { status: 500 });

    const { messages } = await request.json();
    const rules = await getConstitutionRules(profile.id);
    const mode = profile.mode || "assist";
    const tone = profile.tone || "professional";
    const systemPrompt = buildSystemPrompt(rules, mode, tone);

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    let aiResponse = await chatCompletion(chatMessages, TOOLS);
    let assistantMessage: any = {
      role: "assistant" as const,
      content: aiResponse.content,
      tool_calls: aiResponse.tool_calls.length > 0 ? aiResponse.tool_calls : undefined,
    };

    let iterations = 0;
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 8) {
      chatMessages.push(assistantMessage);
      for (const toolCall of assistantMessage.tool_calls) {
        let result: string;
        try {
          const args = JSON.parse(toolCall.function.arguments);
          result = await executeTool(toolCall.function.name, args, profile.id, rules, mode);
        } catch (error: any) {
          result = JSON.stringify({ error: error.message });
        }
        chatMessages.push({ role: "tool" as const, tool_call_id: toolCall.id, content: result });
      }
      aiResponse = await chatCompletion(chatMessages, TOOLS);
      assistantMessage = {
        role: "assistant" as const,
        content: aiResponse.content,
        tool_calls: aiResponse.tool_calls.length > 0 ? aiResponse.tool_calls : undefined,
      };
      iterations++;
    }

    return NextResponse.json({ message: assistantMessage.content });
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json({ error: error.message || "Agent error" }, { status: 500 });
  }
}