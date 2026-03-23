import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { supabaseAdmin } from "@/lib/supabase";

async function getUserProfile() {
  const session = await auth0.getSession();
  if (!session) return null;

  const auth0Id = session.user.sub;

  let { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("auth0_id", auth0Id)
    .single();

  if (!profile) {
    const { data: newProfile } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        auth0_id: auth0Id,
        display_name: session.user.name || "",
        email: session.user.email || "",
      })
      .select("id")
      .single();
    profile = newProfile;
  }

  return profile;
}

export async function GET() {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: rules } = await supabaseAdmin
      .from("constitution_rules")
      .select("*")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ rules: rules || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { rule_text } = await request.json();
    if (!rule_text || rule_text.trim().length === 0) {
      return NextResponse.json({ error: "Rule text required" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("constitution_rules")
      .select("sort_order")
      .eq("user_id", profile.id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing && existing[0] ? existing[0].sort_order : 0) + 1;

    const { data: rule, error } = await supabaseAdmin
      .from("constitution_rules")
      .insert({
        user_id: profile.id,
        rule_text: rule_text.trim(),
        sort_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ rule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const profile = await getUserProfile();
    if (!profile) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await request.json();

    await supabaseAdmin
      .from("constitution_rules")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", profile.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}