export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { supabaseAdmin } from "@/lib/supabase";

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
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("mode, tone")
      .eq("auth0_id", session.user.sub)
      .single();
    return NextResponse.json({
      mode: profile?.mode || "assist",
      tone: profile?.tone || "professional",
    });
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
    const { mode, tone } = body;
    const updates: any = {};
    if (mode && ["shadow", "assist", "autopilot"].includes(mode)) {
      updates.mode = mode;
    }
    if (tone && ["professional", "casual", "direct"].includes(tone)) {
      updates.tone = tone;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }
    await supabaseAdmin
      .from("user_profiles")
      .update(updates)
      .eq("id", userId);
    return NextResponse.json({ success: true, ...updates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}