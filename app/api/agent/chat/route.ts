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
      description: "Get the number of total and unread emails in the user's inbox",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_emails",
      description: "List recent emails from the user's inbox with sender, subject, and snippet",
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
      description: "Draft an email reply or new email. Returns the draft for user approval before sending.",
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
      description: "Send an email that was previously drafted and approved by the user. Only call this after the user explicitly says to send.",
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
          start_time: { type: "string", description: "Start time in ISO 8601 format" },
          end_time: { type: "string", description: "End time in ISO 8601 format" },
          description: { type: "string", description: "Event description (optional)" },
        },
        required: ["summary", "start_time", "end_time"],
      },
    },
  },
];

async function getConstitutionRules(auth0Id: string): Promise<string[]> {
  try {
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("auth0_id", auth0Id)
      .single();

    if (!profile) return [];

    const { data: rules } = await supabaseAdmin
      .from("constitution_rules")
      .select("rule_text")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return (rules || []).map((r) => r.rule_text);
  } catch {
    return [];
  }
}

function buildSystemPrompt(constitutionRules: string[]): string {
  let prompt = `You are Axon, an AI agent that helps users manage their email and calendar. You have access to the user's Gmail and Google Calendar through Auth0 Token Vault.

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

  if (constitutionRules.length > 0) {
    prompt += `\n\nUser Constitution (MUST be obeyed — these rules override all other behavior):`;
    constitutionRules.forEach((rule, i) => {
      prompt += `\n${i + 1}. ${rule}`;
    });
    prompt += `\n\nIf any action would violate the user's constitution, refuse to do it and explain which rule prevents it.`;
  }

  return prompt;
}

async function executeTool(name: string, args: any): Promise<string> {
  const classification = classifyIntent(name);

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
        const sendResult = await sendEmail(token, args.to, args.subject, args.body);
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
      metadata: { args, classification },
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
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { messages } = await request.json();

    const constitutionRules = await getConstitutionRules(session.user.sub);
    const systemPrompt = buildSystemPrompt(constitutionRules);

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
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < 5) {
      chatMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        let result: string;
        try {
          const args = JSON.parse(toolCall.function.arguments);
          result = await executeTool(toolCall.function.name, args);
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