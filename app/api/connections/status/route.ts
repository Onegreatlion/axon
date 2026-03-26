import { NextRequest, NextResponse } from "next/server";
import { isConnectionActive } from "@/lib/token-vault";

export async function GET(request: NextRequest) {
  try {
    const statuses: Record<string, boolean> = {};

    const [google, github] = await Promise.allSettled([
      isConnectionActive("google-oauth2"),
      isConnectionActive("github"),
    ]);

    statuses["google"] =
      google.status === "fulfilled" ? google.value : false;
    statuses["github"] =
      github.status === "fulfilled" ? github.value : false;

    return NextResponse.json(
      { statuses },
      {
        headers: {
          "Cache-Control": "private, max-age=15",
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