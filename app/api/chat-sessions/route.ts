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
  if (!profile) {
    const { data: newProfile } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        auth0_id: session.user.sub,
        display_name: session.user.name || "",
        email: session.user.email || "",
      })
      .select("id")
      .single();
    return newProfile?.id || null;
  }
  return profile.id;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: sessions } = await supabaseAdmin
      .from("chat_sessions")
      .select("id, name, messages, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const { action, sessionId, name, messages } = body;

    if (action === "create") {
      const { data: session } = await supabaseAdmin
        .from("chat_sessions")
        .insert({ user_id: userId, name: name || "New chat", messages: messages || [] })
        .select("id, name, messages, created_at, updated_at")
        .single();
      return NextResponse.json({ session });
    }

    if (action === "update" && sessionId) {
      const updates: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (messages !== undefined) updates.messages = messages;

      const { data: session } = await supabaseAdmin
        .from("chat_sessions")
        .update(updates)
        .eq("id", sessionId)
        .eq("user_id", userId)
        .select("id, name, messages, created_at, updated_at")
        .single();
      return NextResponse.json({ session });
    }

    if (action === "delete" && sessionId) {
      await supabaseAdmin
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", userId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}