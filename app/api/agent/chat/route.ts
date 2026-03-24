import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { getConnectionToken } from "@/lib/token-vault";
import { listEmails, sendEmail, getEmailCount } from "@/lib/services/gmail";
import { listEvents, createEvent } from "@/lib/services/calendar";
import { logAction } from "@/lib/action-log";
import { classifyIntent } from "@/lib/classifier";
import { supabaseAdmin } from "@/lib/supabase";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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
];

async function getUserProfile(auth0Id: string) {
  let { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id, mode")
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
      .select("id, mode")
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
        lower.includes("calendar") && lower.includes("approval"))
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
  mode: string
): string {
  let prompt = `You are Axon, an AI agent that helps users manage their email and calendar. You have access to the user's Gmail and Google Calendar through Auth0 Token Vault.

Operating Mode: ${mode?.toUpperCase() || "ASSIST"}
${
  mode === "shadow"
    ? "IMPORTANT: You are in SHADOW mode. You may ONLY observe and summarize. Do NOT draft, send, create, or modify anything. If the user asks you to take action, explain that Shadow mode only allows observation."
    : mode === "autopilot"
    ? "You are in AUTOPILOT mode. You may execute observe and draft actions freely. For act-tier actions (send, create), proceed if the action seems routine and safe. For anything destructive or unusual, still ask for confirmation."
    : "You are in ASSIST mode. You may observe freely. For any action that modifies external resources (sending emails, creating events), ALWAYS draft first and ask for explicit approval before executing."
}

Core Rules:
1. When the user asks about their emails, use the email tools to get real data.
2. When the user asks about their schedule, use the calendar tools.
3. For sending emails: ALWAYS use draft_email first and present the draft to the user. NEVER use send_email unless the user explicitly says "send it", "yes send", "approve", or similar confirmation.
4. For calendar events: show event details and confirm before creating.
5. Be concise and direct.
6. When showing emails, format them clearly with sender, subject, and a brief snippet.
7. When showing calendar events, format them with time, title, and location.
8. If a tool call fails, explain what happened honestly.
9. Do not make up data. Only report what the tools return.
10. Current date and time: ${new Date().toISOString()}`;

  if (rules.length > 0) {
    prompt += `\n\nUser Constitution (MUST be obeyed - these rules override all other behavior):`;
    rules.forEach((rule, i) => {
      prompt += `\n${i + 1}. ${rule.rule_text}`;
    });
    prompt += `\n\nIf any action would violate the user's constitution, refuse to do it and explain which rule prevents it.`;
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

  if (mode === "shadow" && classification.tier !== "observe") {
    await logAction({
      service: name.includes("calendar") ? "calendar" : "gmail",
      actionType: name,
      riskTier: classification.tier,
      description: `${name} blocked: Shadow mode only allows observation`,
      scopesUsed: classification.scopes,
      status: "denied",
      reasoning: "Shadow mode active. Only observe-tier actions are permitted.",
      metadata: { args, mode },
    });

    return JSON.stringify({
      error: "Shadow mode is active. Only observation actions are allowed.",
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
        service: name.includes("calendar") ? "calendar" : "gmail",
        action_type: name,
        risk_tier: classification.tier,
        args: args,
        scopes_required: classification.scopes,
        constitution_rules_applied: ruleCheck.appliedRules,
        reasoning: ruleCheck.explanation || `${classification.tier}-tier action requires approval in ${mode} mode`,
        status: "pending",
      })
      .select("id")
      .single();

    await logAction({
      service: name.includes("calendar") ? "calendar" : "gmail",
      actionType: name,
      riskTier: classification.tier,
      description: `${name} requires approval`,
      scopesUsed: classification.scopes,
      status: "pending",
      reasoning: ruleCheck.explanation || `Approval required in ${mode} mode`,
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
      message: ruleCheck.explanation || "This action requires your approval before it can be executed.",
      rulesApplied: ruleCheck.appliedRules,
      action: name,
      args: args,
    });
  }

  try {
    const token = await getConnectionToken("google-oauth2");
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
      default:
        result = JSON.stringify({ error: "Unknown tool" });
    }

    await logAction({
      service: name.includes("calendar") ? "calendar" : "gmail",
      actionType: name,
      riskTier: classification.tier,
      description: `${name}(${JSON.stringify(args).substring(0, 200)})`,
      scopesUsed: classification.scopes,
      status: "executed",
      reasoning: classification.reasoning,
      metadata: { args, classification, rulesChecked: ruleCheck.appliedRules },
    });

    return result;
  } catch (error: any) {
    await logAction({
      service: name.includes("calendar") ? "calendar" : "gmail",
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
    const systemPrompt = buildSystemPrompt(rules, mode);

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    let response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: chatMessages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    });

    let assistantMessage = response.choices[0].message;

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

      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: chatMessages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens: 1024,
      });

      assistantMessage = response.choices[0].message;
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