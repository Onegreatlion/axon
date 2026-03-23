import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  try {
    const connection = request.nextUrl.searchParams.get("connection");
    if (!connection) {
      return NextResponse.json({ error: "Missing connection" }, { status: 400 });
    }

    const appBaseUrl = process.env.APP_BASE_URL;

    const result = await auth0.connectAccount({
      connection: connection,
      returnTo: `${appBaseUrl}/dashboard/services`,
    });

    return result;
  } catch (error: any) {
    console.error("Connect error:", error.message);
    console.error("Connect cause:", error.cause?.message || error.cause);
    return NextResponse.json(
      { 
        error: "Failed to initiate connect flow",
        details: error.cause?.message || error.message || "unknown"
      },
      { status: error.status || 500 }
    );
  }
}