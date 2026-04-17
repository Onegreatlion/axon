export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("telegram_chat_id")
      .eq("auth0_id", session.user.sub)
      .single();
      
    if (error) throw error;
    return NextResponse.json({ connected: !!data?.telegram_chat_id });
  } catch (error: any) {
    console.error("Telegram GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    
    const { chatId } = await request.json();
    
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ telegram_chat_id: chatId })
      .eq("auth0_id", session.user.sub);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Telegram POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({ telegram_chat_id: null })
      .eq("auth0_id", session.user.sub);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Telegram DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}