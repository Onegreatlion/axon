import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const DOMAIN = process.env.AUTH0_DOMAIN!;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;
const APP_BASE_URL = process.env.APP_BASE_URL!;

export async function GET(request: NextRequest) {
  try {
    const connectCode = request.nextUrl.searchParams.get("connect_code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      console.error("Connection callback error:", error);
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent(error)}`
      );
    }

    if (!connectCode) {
      console.error("No connect_code in callback");
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent("No authorization code received")}`
      );
    }

    // Read the stored auth_session and state from cookies
    const storedAuthSession = request.cookies.get("axon_connect_auth_session")?.value;
    const storedState = request.cookies.get("axon_connect_state")?.value;

    if (!storedAuthSession) {
      console.error("No auth_session cookie found");
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent("Session expired. Please try connecting again.")}`
      );
    }

    if (storedState && state && storedState !== state) {
      console.error("State mismatch");
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent("Invalid state parameter. Please try again.")}`
      );
    }

    // Get a fresh My Account API token
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent("Not authenticated")}`
      );
    }

    const tokenSet = (session as any).tokenSet;
    if (!tokenSet?.refreshToken) {
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent("No refresh token. Please log out and log in again.")}`
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
          "openid profile offline_access create:me:connected_accounts read:me:connected_accounts",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Failed to get My Account API token for completion:", tokenData);
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent("Failed to complete connection. Please try again.")}`
      );
    }

    // Complete the Connected Accounts flow
    const redirectUri = `${APP_BASE_URL}/api/connections/callback`;

    const completeRes = await fetch(
      `https://${DOMAIN}/me/v1/connected-accounts/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          auth_session: storedAuthSession,
          connect_code: connectCode,
          redirect_uri: redirectUri,
        }),
      }
    );

    const completeData = await completeRes.json();

    if (completeRes.ok && completeData.id) {
      console.log("Connection completed successfully:", completeData);

      // Clear the cookies
      const response = NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?connected=${completeData.connection || "service"}`
      );
      response.cookies.delete("axon_connect_auth_session");
      response.cookies.delete("axon_connect_state");
      return response;
    } else {
      console.error("Connection completion failed:", completeData);
      return NextResponse.redirect(
        `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent(completeData.detail || completeData.message || "Failed to complete connection")}`
      );
    }
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      `${APP_BASE_URL}/dashboard/services?error=${encodeURIComponent(error.message || "Connection callback failed")}`
    );
  }
}