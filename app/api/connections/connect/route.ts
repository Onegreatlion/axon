export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import crypto from "crypto";

const DOMAIN = process.env.AUTH0_DOMAIN!;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;
const APP_BASE_URL = process.env.APP_BASE_URL!;

export async function GET(request: NextRequest) {
  try {
    const connection = request.nextUrl.searchParams.get("connection");
    if (!connection) {
      return NextResponse.json(
        { error: "Missing connection" },
        { status: 400 }
      );
    }

    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const tokenSet = (session as any).tokenSet;
    if (!tokenSet?.refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available. Please log out and log in again." },
        { status: 400 }
      );
    }

    const tokenRes = await fetch(`https://${DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokenSet.refreshToken,
        audience: `https://${DOMAIN}/me/`,
        scope:
          "openid profile offline_access create:me:connected_accounts read:me:connected_accounts delete:me:connected_accounts",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("My Account API token error:", tokenData);
      return NextResponse.json(
        {
          error: "Could not get account management token",
          details: tokenData.error_description || tokenData.error || "Unknown error",
        },
        { status: 500 }
      );
    }

    const state = crypto.randomBytes(16).toString("hex");
    const redirectUri = `${APP_BASE_URL}/api/connections/callback`;

    let scopes: string[] | undefined;
    if (connection === "github") {
      scopes = ["repo", "read:org", "read:user", "notifications"];
    } else if (connection === "google-oauth2") {
      scopes = [
        "openid",
        "profile",
        "email",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.settings.basic",
        "https://www.googleapis.com/auth/gmail.labels",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.events.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/tasks.readonly",
        "https://www.googleapis.com/auth/contacts.readonly",
      ];
    }

    const connectBody: any = {
      connection,
      redirect_uri: redirectUri,
      state,
    };
    if (scopes) {
      connectBody.scopes = scopes;
    }

    const connectRes = await fetch(
      `https://${DOMAIN}/me/v1/connected-accounts/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify(connectBody),
      }
    );

    const connectData = await connectRes.json();

    if (
      !connectData.connect_uri ||
      !connectData.connect_params?.ticket
    ) {
      console.error("Connect initiation error:", JSON.stringify(connectData));
      return NextResponse.json(
        {
          error: "Failed to start connection flow",
          details: connectData.detail || connectData.message || JSON.stringify(connectData),
        },
        { status: 500 }
      );
    }

    const connectUrl = `${connectData.connect_uri}?ticket=${connectData.connect_params.ticket}`;

    const response = NextResponse.redirect(connectUrl);

    response.cookies.set("axon_connect_auth_session", connectData.auth_session, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    response.cookies.set("axon_connect_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Connect error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate connection",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}