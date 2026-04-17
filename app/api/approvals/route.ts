export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { supabaseAdmin } from "@/lib/supabase";
import { getConnectionToken } from "@/lib/token-vault";
import { sendEmail } from "@/lib/services/gmail";
import { createEvent } from "@/lib/services/calendar";
import { logAction } from "@/lib/action-log";
import { classifyIntent } from "@/lib/classifier";

async function getUserId() {
  const session = await auth0.getSession();
  if (!session) return null;

  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("auth0_id", session.user.sub)
    .single();

  return profile?.id || null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: approvals } = await supabaseAdmin
      .from("approval_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ approvals: approvals || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. Need id and action (approved/rejected)" },
        { status: 400 }
      );
    }

    const { data: approval } = await supabaseAdmin
      .from("approval_requests")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("status", "pending")
      .single();

    if (!approval) {
      return NextResponse.json(
        { error: "Approval not found or already resolved" },
        { status: 404 }
      );
    }

    if (action === "rejected") {
      await supabaseAdmin
        .from("approval_requests")
        .update({ status: "rejected", resolved_at: new Date().toISOString() })
        .eq("id", id);

      await logAction({
        service: approval.service,
        actionType: approval.action_type,
        riskTier: approval.risk_tier,
        description: `${approval.action_type} rejected by user`,
        scopesUsed: approval.scopes_required || [],
        status: "denied",
        reasoning: "User rejected the approval request",
        metadata: { args: approval.args, approvalId: id },
      });

      return NextResponse.json({ status: "rejected" });
    }

    let result: any = null;
    let executionError: string | null = null;

    try {
      const token = await getConnectionToken("google-oauth2");
      const args = approval.args;

      switch (approval.action_type) {
        case "send_email": {
          result = await sendEmail(token, args.to, args.subject, args.body);
          break;
        }
        case "create_calendar_event": {
          result = await createEvent(
            token,
            args.summary,
            args.start_time,
            args.end_time,
            args.description
          );
          break;
        }
        default:
          executionError = `Unknown action type: ${approval.action_type}`;
      }
    } catch (error: any) {
      executionError = error.message;
    }

    const classification = classifyIntent(approval.action_type);

    await supabaseAdmin
      .from("approval_requests")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);

    await logAction({
      service: approval.service,
      actionType: approval.action_type,
      riskTier: approval.risk_tier,
      description: executionError
        ? `${approval.action_type} approved but failed: ${executionError}`
        : `${approval.action_type} approved and executed`,
      scopesUsed: classification.scopes,
      status: executionError ? "failed" : "executed",
      reasoning: `User approved. Rules applied: ${(approval.constitution_rules_applied || []).join(", ") || "none"}`,
      metadata: {
        args: approval.args,
        approvalId: id,
        result,
        error: executionError,
        rulesApplied: approval.constitution_rules_applied,
      },
    });

    return NextResponse.json({
      status: "approved",
      executed: !executionError,
      result,
      error: executionError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}