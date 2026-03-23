import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { SERVICE_CONNECTIONS, ConnectionKey } from "@/lib/services/connections";

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const connectionKey = body.connection as ConnectionKey;

    if (!connectionKey || !SERVICE_CONNECTIONS[connectionKey]) {
      return NextResponse.json(
        { error: "Invalid connection" },
        { status: 400 }
      );
    }

    const config = SERVICE_CONNECTIONS[connectionKey];

    const tokenResponse = await auth0.getAccessTokenForConnection(request, {
      connection: config.connectionName,
    });

    return NextResponse.json({
      connected: true,
      accessToken: tokenResponse.accessToken,
      connection: connectionKey,
    });
  } catch (error: any) {
    if (
      error.message?.includes("not found") ||
      error.message?.includes("no token") ||
      error.code === "missing_token"
    ) {
      return NextResponse.json({ connected: false });
    }

    console.error("Token retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get token" },
      { status: 500 }
    );
  }
}