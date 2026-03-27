import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getConnectionToken } from "@/lib/token-vault";
import { listEmails, sendEmail, getEmailCount } from "@/lib/services/gmail";
import { listEvents, createEvent } from "@/lib/services/calendar";
import { listFiles, searchFiles } from "@/lib/services/drive";
import { listTaskLists, listTasks, createTask, completeTask } from "@/lib/services/tasks";
import { searchContacts, listConnections } from "@/lib/services/contacts";
import {
  listRepos,
  listIssues,
  listPullRequests,
  getNotifications,
  createIssue,
  addComment,
} from "@/lib/services/github";
import { logAction } from "@/lib/action-log";
import { classifyIntent } from "@/lib/classifier";
import { supabaseAdmin } from "@/lib/supabase";
import { chatCompletion } from "@/lib/ai";

const GITHUB_TOOL_NAMES = [
  "list_repos",
  "list_issues",
  "list_pull_requests",
  "get_notifications",
  "create_issue",
  "add_comment",
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
  return "google-oauth2"; // Gmail, Calendar, Drive, Tasks, Contacts all use Google
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "get_email_count",
      description:
        "Get the number of total and unread emails in the user's inbox",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
    {
    type: "function" as const,
    function: {
      name: "search_emails",
      description: "Search emails by query string (sender, subject, keywords)",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (e.g. 'from:boss@company.com' or 'meeting agenda')" },
          max_results: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_task_lists",
      description: "List the user's Google Tasks lists",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "List tasks from the user's Google Tasks",
      parameters: {
        type: "object",
        properties: {
          task_list_id: { type: "string", description: "Task list ID (default: @default)" },
          max_results: { type: "number", description: "Max results (default 20)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task in Google Tasks",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          notes: { type: "string", description: "Task notes/description" },
          due: { type: "string", description: "Due date in RFC 3339 format" },
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
        properties: {
          task_id: { type: "string", description: "Task ID to complete" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_contacts",
      description: "Search the user's Google Contacts by name or email",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name or email to search for" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_contacts",
      description: "List the user's recent Google Contacts",
      parameters: {
        type: "object",
        properties: {
          max_results: { type: "number", description: "Max results (default 20)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_emails",
      description:
        "List recent emails from the user's inbox with sender, subject, and snippet",
      parameters: {
        type: "object",
        properties: {
          max_results: {
            type: "number",
            description: "Number of emails to retrieve (default 5, max 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "draft_email",
      description:
        "Draft an email reply or new email. Returns the draft for user approval before sending.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject line" },
          body: { type: "string", description: "Email body text" },
        },
        required: ["to", "subject", "body"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_email",
      description:
        "Send an email that was previously drafted and approved by the user. Only call this after the user explicitly says to send.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject line" },
          body: { type: "string", description: "Email body text" },
        },
        required: ["to", "subject", "body"],
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
          max_results: {
            type: "number",
            description: "Number of events to retrieve (default 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_calendar_event",
      description: "Create a new calendar event.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Event title" },
          start_time: {
            type: "string",
            description: "Start time in ISO 8601 format",
          },
          end_time: {
            type: "string",
            description: "End time in ISO 8601 format",
          },
          description: {
            type: "string",
            description: "Event description (optional)",
          },
        },
        required: ["summary", "start_time", "end_time"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_drive_files",
      description: "List recent files from the user's Google Drive",
      parameters: {
        type: "object",
        properties: {
          max_results: {
            type: "number",
            description: "Number of files to retrieve (default 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_drive_files",
      description: "Search for files in the user's Google Drive by name",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query to find files by name",
          },
          max_results: {
            type: "number",
            description: "Number of results (default 10)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_repos",
      description:
        "List the user's GitHub repositories, sorted by most recently updated",
      parameters: {
        type: "object",
        properties: {
          max_results: {
            type: "number",
            description: "Number of repos to retrieve (default 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_issues",
      description: "List issues for a specific GitHub repository",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "Repository full name (e.g. owner/repo)",
          },
          state: {
            type: "string",
            description: "Issue state: open, closed, or all (default open)",
          },
          max_results: {
            type: "number",
            description: "Number of issues to retrieve (default 10)",
          },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_pull_requests",
      description: "List pull requests for a specific GitHub repository",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "Repository full name (e.g. owner/repo)",
          },
          state: {
            type: "string",
            description: "PR state: open, closed, or all (default open)",
          },
          max_results: {
            type: "number",
            description: "Number of PRs to retrieve (default 10)",
          },
        },
        required: ["repo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_notifications",
      description: "Get the user's GitHub notifications",
      parameters: {
        type: "object",
        properties: {
          max_results: {
            type: "number",
            description: "Number of notifications to retrieve (default 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_issue",
      description: "Create a new issue in a GitHub repository",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "Repository full name (e.g. owner/repo)",
          },
          title: {
            type: "string",
            description: "Issue title",
          },
          body: {
            type: "string",
            description: "Issue body/description",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "Labels to apply (optional)",
          },
        },
        required: ["repo", "title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_comment",
      description: "Add a comment to a GitHub issue or pull request",
      parameters: {
        type: "object",
        properties: {
          repo: {
            type: "string",
            description: "Repository full name (e.g. owner/repo)",
          },
          issue_number: {
            type: "number",
            description: "Issue or PR number",
          },
          body: {
            type: "string",
            description: "Comment text",
          },
        },
        required: ["repo", "issue_number", "body"],
      },
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
      .insert({
        auth0_id: auth0Id,
        display_name: "",
        email: "",
      })
      .select("id, mode, tone")
      .single();
    profile = newProfile;
  }
  return profile;
}

async function getConstitutionRules(
  userId: string
): Promise<{ id: string; rule_text: string }[]> {
  try {
    const { data: rules } = await supabaseAdmin
      .from("constitution_rules")
      .select("id, rule_text")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return rules || [];
  } catch {
    return [];
  }
}

function checkConstitutionRules(
  toolName: string,
  args: any,
  rules: { id: string; rule_text: string }[]
): { blocked: boolean; appliedRules: string[]; explanation: string } {
  const appliedRules: string[] = [];
  let blocked = false;
  let explanation = "";

  for (const rule of rules) {
    const lower = rule.rule_text.toLowerCase();

    if (
      (toolName === "send_email" || toolName === "draft_email") &&
      (lower.includes("never send email") ||
        lower.includes("no email") ||
        lower.includes("without my approval") ||
        lower.includes("without approval"))
    ) {
      if (toolName === "send_email") {
        appliedRules.push(rule.rule_text);
        blocked = true;
        explanation = `Blocked by constitution rule: "${rule.rule_text}". Action converted to approval request.`;
      }
    }

    if (
      toolName === "create_calendar_event" &&
      (lower.includes("no calendar") ||
        lower.includes("never create event") ||
        (lower.includes("calendar") && lower.includes("approval")))
    ) {
      appliedRules.push(rule.rule_text);
      blocked = true;
      explanation = `Blocked by constitution rule: "${rule.rule_text}". Action converted to approval request.`;
    }

    if (
      (toolName === "create_issue" || toolName === "add_comment") &&
      (lower.includes("no github") ||
        lower.includes("never create issue") ||
        (lower.includes("github") && lower.includes("approval")))
    ) {
      appliedRules.push(rule.rule_text);
      blocked = true;
      explanation = `Blocked by constitution rule: "${rule.rule_text}". Action converted to approval request.`;
    }
  }

  return { blocked, appliedRules, explanation };
}

function buildSystemPrompt(
  rules: { id: string; rule_text: string }[],
  mode: string,
  tone: string
): string {
  let prompt = `You are Axon, an autonomous AI agent that manages a user's entire digital life. You have access to Gmail, Google Calendar, Google Drive, GitHub, Google Tasks, and Google Contacts through Auth0 Token Vault.

Operating Mode: ${mode?.toUpperCase() || "ASSIST"}
${
  mode === "shadow"
    ? "SHADOW MODE: Observe and summarize only. Never modify anything."
    : mode === "autopilot"
    ? `AUTOPILOT MODE: You have maximum autonomy. Execute routine actions automatically without asking.
- Read, categorize, and respond to routine emails automatically
- Create calendar events from email invitations
- Create tasks from action items in emails
- Approve and merge simple dependency update PRs
- Archive processed emails
- Only pause for: sending emails to new recipients, financial actions, destructive operations, or anything blocked by constitution rules
- Chain multiple operations together efficiently
- After completing an action, suggest or execute logical follow-up actions`
    : `ASSIST MODE: You can observe freely. For modifications, draft first and ask for approval. Be proactive about suggesting actions.`
}

Core Capabilities:
1. EMAIL: Read, search, draft, send, archive emails. Search by sender, subject, or content.
2. CALENDAR: Read, create, modify events. Check for conflicts automatically.
3. DRIVE: List, search files. Access document metadata.
4. GITHUB: Repos, issues, PRs, notifications. Create issues, comment on PRs.
5. TASKS: List, create, complete tasks. Organize with task lists.
6. CONTACTS: Search and list contacts. Look up email addresses and phone numbers.

Behavioral Rules:
- When asked about emails, proactively summarize the important ones and suggest actions
- When creating calendar events, automatically check for conflicts first
- When asked to email someone, search contacts first to find the right email address
- When discussing GitHub PRs, offer to create related tasks or calendar events
- Chain operations: if someone asks to "handle" something, do everything needed (read, draft, create tasks, schedule follow-ups)
- Be concise but thorough. Use markdown formatting for clarity.
- When showing lists, use bullet points or tables
- Always show what actions you took and what you recommend next
- If a tool call fails, explain honestly and suggest alternatives
- Current date and time: ${new Date().toISOString()}

Cross-Service Intelligence:
- If an email mentions a meeting, check the calendar
- If a PR needs review, check if there's time on the calendar
- If creating a task from an email, link back to the email context
- Proactively surface connections between services`;

  if (rules.length > 0) {
    prompt += `\n\nUser Constitution (MUST be obeyed - overrides all other behavior):`;
    rules.forEach((rule, i) => {
      prompt += `\n${i + 1}. ${rule.rule_text}`;
    });
    prompt += `\nIf any action would violate the constitution, refuse and explain which rule prevents it.`;
  }

  const toneInstructions: Record<string, string> = {
    professional: "Communicate in a professional, clear, and courteous manner.",
    casual: "Be friendly, casual, and approachable. Keep it natural.",
    direct: "Be brief and direct. No filler. Just facts and actions.",
  };
  if (tone && toneInstructions[tone]) {
    prompt += `\n\nCommunication Style: ${toneInstructions[tone]}`;
  }

  return prompt;
}

async function executeTool(
  name: string,
  args: any,
  userId: string,
  rules: { id: string; rule_text: string }[],
  mode: string
): Promise<string> {
  const classification = classifyIntent(name);
  const service = getServiceName(name);

  if (mode === "shadow" && classification.tier !== "observe") {
    await logAction({
      service,
      actionType: name,
      riskTier: classification.tier,
      description: `${name} blocked: Shadow mode only allows observation`,
      scopesUsed: classification.scopes,
      status: "denied",
      reasoning:
        "Shadow mode active. Only observe-tier actions are permitted.",
      metadata: { args, mode },
    });
    return JSON.stringify({
      error:
        "Shadow mode is active. Only observation actions are allowed. Switch to Assist or Autopilot mode in Settings to enable this action.",
    });
  }

  const ruleCheck = checkConstitutionRules(name, args, rules);

  if (
    ruleCheck.blocked ||
    (classification.tier === "act" && mode !== "autopilot")
  ) {
    const { data: approval } = await supabaseAdmin
      .from("approval_requests")
      .insert({
        user_id: userId,
        service,
        action_type: name,
        risk_tier: classification.tier,
        args: args,
        scopes_required: classification.scopes,
        constitution_rules_applied: ruleCheck.appliedRules,
        reasoning:
          ruleCheck.explanation ||
          `${classification.tier}-tier action requires approval in ${mode} mode`,
        status: "pending",
      })
      .select("id")
      .single();

    await logAction({
      service,
      actionType: name,
      riskTier: classification.tier,
      description: `${name} requires approval`,
      scopesUsed: classification.scopes,
      status: "pending",
      reasoning:
        ruleCheck.explanation || `Approval required in ${mode} mode`,
      metadata: {
        args,
        classification,
        rulesApplied: ruleCheck.appliedRules,
        approvalId: approval?.id,
      },
    });

    return JSON.stringify({
      status: "approval_required",
      approvalId: approval?.id,
      message:
        ruleCheck.explanation ||
        "This action requires your approval before it can be executed. Please check the Approvals page.",
      rulesApplied: ruleCheck.appliedRules,
      action: name,
      args: args,
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
        const simplified = emails.map((e) => ({
          from: e.from,
          subject: e.subject,
          snippet: e.snippet.substring(0, 100),
          date: e.date,
          unread: e.isUnread,
        }));
        result = JSON.stringify(simplified);
        break;
      }
            case "search_emails": {
        const token = await getConnectionToken("google-oauth2");
        const q = args.query || "";
        const max = Math.min(args.max_results || 5, 10);
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=${max}`,
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
          emails.push({ from: getH("From"), subject: getH("Subject"), date: getH("Date"), snippet: m.snippet?.substring(0, 100) });
        }
        result = JSON.stringify(emails);
        break;
      }
      case "list_task_lists": {
        const token = await getConnectionToken("google-oauth2");
        const lists = await listTaskLists(token);
        result = JSON.stringify(lists);
        break;
      }
      case "list_tasks": {
        const token = await getConnectionToken("google-oauth2");
        const tasks = await listTasks(token, args.task_list_id || "@default", args.max_results || 20);
        result = JSON.stringify(tasks);
        break;
      }
      case "create_task": {
        const token = await getConnectionToken("google-oauth2");
        const task = await createTask(token, args.title, args.notes, args.due);
        result = JSON.stringify({ ...task, status: "created" });
        break;
      }
      case "complete_task": {
        const token = await getConnectionToken("google-oauth2");
        await completeTask(token, args.task_id);
        result = JSON.stringify({ status: "completed", task_id: args.task_id });
        break;
      }
      case "search_contacts": {
        const token = await getConnectionToken("google-oauth2");
        const contacts = await searchContacts(token, args.query);
        result = JSON.stringify(contacts);
        break;
      }
      case "list_contacts": {
        const token = await getConnectionToken("google-oauth2");
        const contacts = await listConnections(token, args.max_results || 20);
        result = JSON.stringify(contacts);
        break;
      }
      case "draft_email": {
        result = JSON.stringify({
          status: "draft_ready",
          to: args.to,
          subject: args.subject,
          body: args.body,
          message: "Draft created. Awaiting user approval to send.",
        });
        break;
      }
      case "send_email": {
        const sendResult = await sendEmail(
          token,
          args.to,
          args.subject,
          args.body
        );
        result = JSON.stringify({ status: "sent", ...sendResult });
        break;
      }
      case "list_calendar_events": {
        const max = Math.min(args.max_results || 5, 10);
        const events = await listEvents(token, max);
        const simplified = events.map((e) => ({
          summary: e.summary,
          start: e.start,
          end: e.end,
          location: e.location || undefined,
        }));
        result = JSON.stringify(simplified);
        break;
      }
      case "create_calendar_event": {
        const event = await createEvent(
          token,
          args.summary,
          args.start_time,
          args.end_time,
          args.description
        );
        result = JSON.stringify({
          status: "created",
          event: {
            summary: event.summary,
            start: event.start,
            end: event.end,
            link: event.htmlLink,
          },
        });
        break;
      }
      case "list_drive_files": {
        const max = Math.min(args.max_results || 10, 20);
        const files = await listFiles(token, undefined, max);
        const simplified = files.map((f) => ({
          name: f.name,
          type: f.mimeType,
          modified: f.modifiedTime,
          link: f.webViewLink,
        }));
        result = JSON.stringify(simplified);
        break;
      }
      case "search_drive_files": {
        const max = Math.min(args.max_results || 10, 20);
        const files = await searchFiles(token, args.query, max);
        const simplified = files.map((f) => ({
          name: f.name,
          type: f.mimeType,
          modified: f.modifiedTime,
          link: f.webViewLink,
        }));
        result = JSON.stringify(simplified);
        break;
      }
      case "list_repos": {
        const max = Math.min(args.max_results || 10, 20);
        const repos = await listRepos(token, max);
        const simplified = repos.map((r) => ({
          name: r.full_name,
          description: r.description,
          language: r.language,
          stars: r.stargazers_count,
          issues: r.open_issues_count,
          updated: r.updated_at,
          private: r.private,
          url: r.html_url,
        }));
        result = JSON.stringify(simplified);
        break;
      }
      case "list_issues": {
        const max = Math.min(args.max_results || 10, 20);
        const issues = await listIssues(
          token,
          args.repo,
          args.state || "open",
          max
        );
        const simplified = issues.map((i) => ({
          number: i.number,
          title: i.title,
          state: i.state,
          author: i.user.login,
          labels: i.labels.map((l) => l.name),
          updated: i.updated_at,
          url: i.html_url,
        }));
        result = JSON.stringify(simplified);
        break;
      }
      case "list_pull_requests": {
        const max = Math.min(args.max_results || 10, 20);
        const prs = await listPullRequests(
          token,
          args.repo,
          args.state || "open",
          max
        );
        const simplified = prs.map((p) => ({
          number: p.number,
          title: p.title,
          state: p.state,
          author: p.user.login,
          branch: `${p.head.ref} -> ${p.base.ref}`,
          draft: p.draft,
          updated: p.updated_at,
          url: p.html_url,
        }));
        result = JSON.stringify(simplified);
        break;
      }
      case "get_notifications": {
        const max = Math.min(args.max_results || 10, 20);
        const notifs = await getNotifications(token, max);
        const simplified = notifs.map((n) => ({
          reason: n.reason,
          title: n.subject.title,
          type: n.subject.type,
          repo: n.repository.full_name,
          unread: n.unread,
          updated: n.updated_at,
        }));
        result = JSON.stringify(simplified);
        break;
      }
      case "create_issue": {
        const issue = await createIssue(
          token,
          args.repo,
          args.title,
          args.body,
          args.labels
        );
        result = JSON.stringify({
          status: "created",
          number: issue.number,
          title: issue.title,
          url: issue.html_url,
        });
        break;
      }
      case "add_comment": {
        const comment = await addComment(
          token,
          args.repo,
          args.issue_number,
          args.body
        );
        result = JSON.stringify({
          status: "commented",
          url: comment.html_url,
        });
        break;
      }
      default:
        result = JSON.stringify({ error: "Unknown tool" });
    }

    await logAction({
      service,
      actionType: name,
      riskTier: classification.tier,
      description: `${name}(${JSON.stringify(args).substring(0, 200)})`,
      scopesUsed: classification.scopes,
      status: "executed",
      reasoning: classification.reasoning,
      metadata: {
        args,
        classification,
        rulesChecked: ruleCheck.appliedRules,
      },
    });

    return result;
  } catch (error: any) {
    await logAction({
      service,
      actionType: name,
      riskTier: classification.tier,
      description: `${name} failed: ${error.message}`,
      scopesUsed: classification.scopes,
      status: "failed",
      reasoning: classification.reasoning,
      metadata: { args, error: error.message },
    });
    return JSON.stringify({ error: error.message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const profile = await getUserProfile(session.user.sub);
    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 500 }
      );
    }

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
      tool_calls:
        aiResponse.tool_calls.length > 0
          ? aiResponse.tool_calls
          : undefined,
    };

    let iterations = 0;
    while (
      assistantMessage.tool_calls &&
      assistantMessage.tool_calls.length > 0 &&
      iterations < 5
    ) {
      chatMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        let result: string;
        try {
          const args = JSON.parse(toolCall.function.arguments);
          result = await executeTool(
            toolCall.function.name,
            args,
            profile.id,
            rules,
            mode
          );
        } catch (error: any) {
          result = JSON.stringify({ error: error.message });
        }

        chatMessages.push({
          role: "tool" as const,
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      aiResponse = await chatCompletion(chatMessages, TOOLS);
      assistantMessage = {
        role: "assistant" as const,
        content: aiResponse.content,
        tool_calls:
          aiResponse.tool_calls.length > 0
            ? aiResponse.tool_calls
            : undefined,
      };
      iterations++;
    }

    return NextResponse.json({
      message: assistantMessage.content,
    });
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error.message || "Agent error" },
      { status: 500 }
    );
  }
}