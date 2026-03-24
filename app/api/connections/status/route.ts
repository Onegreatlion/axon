import { NextRequest, NextResponse } from "next/server";
import { isConnectionActive } from "@/lib/token-vault";

export async function GET(request: NextRequest) {
  try {
    const statuses: Record<string, boolean> = {};

    statuses["google"] = await isConnectionActive("google-oauth2");
    statuses["github"] = false;

    return NextResponse.json(
      { statuses },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      }
    );
  } catch (error: any) {
    console.error("Status check error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}