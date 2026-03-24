import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  try {
    const connection = request.nextUrl.searchParams.get("connection");

    if (!connection) {
      return NextResponse.json(
        { error: "Missing connection" },
        { status: 400 }
      );
    }

    return await auth0.connectAccount(request, {
      connection,
    });
  } catch (error: any) {
    console.error("Connect error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate connect flow",
        details: error.cause?.message || error.message || "unknown",
      },
      { status: error.status || 500 }
    );
  }
}