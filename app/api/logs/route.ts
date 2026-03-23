import { NextRequest, NextResponse } from "next/server";
import { getActionLogs } from "@/lib/action-log";

export async function GET(request: NextRequest) {
  try {
    const logs = await getActionLogs(50);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}