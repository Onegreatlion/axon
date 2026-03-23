import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const connectCode = request.nextUrl.searchParams.get("connect_code");
    const authSession = request.cookies.get("axon_auth_session")?.value;
    const appBaseUrl = process.env.APP_BASE_URL;

    if (!connectCode || !authSession) {
      console.error("Missing connect_code or auth_session");
      return NextResponse.redirect(
        new URL("/dashboard/services?error=missing_params", request.url)
      );
    }

    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;
    const tokenSet = (session as any).tokenSet || {};

    // Get My Account API token
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenSet.refreshToken,
        audience: `https://${domain}/me/`,
        scope: "create:me:connected_accounts",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Failed to get token:", tokenData);
      return NextResponse.redirect(
        new URL("/dashboard/services?error=token_failed", request.url)
      );
    }

    // Complete the Connected Accounts flow
    const completeRes = await fetch(
      `https://${domain}/me/v1/connected-accounts/complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          auth_session: authSession,
          connect_code: connectCode,
          redirect_uri: `${appBaseUrl}/api/connections/callback`,
        }),
      }
    );

    const completeData = await completeRes.json();

    if (completeRes.status === 200 || completeRes.status === 201) {
      console.log("Connected account:", JSON.stringify(completeData));
      const response = NextResponse.redirect(
        new URL("/dashboard/services?connected=true", request.url)
      );
      response.cookies.delete("axon_auth_session");
      return response;
    } else {
      console.error("Complete failed:", JSON.stringify(completeData));
      return NextResponse.redirect(
        new URL("/dashboard/services?error=complete_failed", request.url)
      );
    }
  } catch (error: any) {
    console.error("Callback error:", error.message);
    return NextResponse.redirect(
      new URL("/dashboard/services?error=callback_error", request.url)
    );
  }
}