import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const tokenSet = (session as any).tokenSet || {};
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;

    // Try all three valid requested_token_types
    const types = [
      "http://auth0.com/oauth/token-type/federated-connection-access-token",
      "http://auth0.com/oauth/token-type/token-vault-access-token",
      "http://auth0.com/oauth/token-type/token-vault-refresh-token",
    ];

    const results: Record<string, any> = {};

    for (const tokenType of types) {
      try {
        const res = await fetch(`https://${domain}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
            client_id: clientId,
            client_secret: clientSecret,
            subject_token: tokenSet.refreshToken,
            subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
            requested_token_type: tokenType,
            connection: "google-oauth2",
          }),
        });
        const data = await res.json();
        const name = tokenType.split("/").pop();
        results[name || tokenType] = {
          status: res.status,
          hasToken: !!data.access_token,
          tokenPreview: data.access_token ? data.access_token.substring(0, 30) + "..." : "none",
          error: data.error,
          errorDescription: data.error_description,
        };
      } catch (e: any) {
        const name = tokenType.split("/").pop();
        results[name || tokenType] = { error: e.message };
      }
    }

    // If any token worked, test Gmail
    let gmailTest = null;
    const workingType = Object.entries(results).find(([_, v]) => v.hasToken);
    
    if (workingType) {
      const tokenType = types.find(t => t.endsWith(workingType[0]));
      const tokenRes2 = await fetch(`https://${domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
          client_id: clientId,
          client_secret: clientSecret,
          subject_token: tokenSet.refreshToken,
          subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
          requested_token_type: tokenType,
          connection: "google-oauth2",
        }),
      });
      const tokenData2 = await tokenRes2.json();

      if (tokenData2.access_token) {
        const gmailRes = await fetch(
          "https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX",
          { headers: { Authorization: `Bearer ${tokenData2.access_token}` } }
        );
        const gmailData = await gmailRes.json();
        gmailTest = {
          status: gmailRes.status,
          unread: gmailData.messagesUnread,
          total: gmailData.messagesTotal,
          error: gmailData.error?.message,
        };
      }
    }

    return NextResponse.json({
      hasRefreshToken: !!tokenSet.refreshToken,
      tokenExchangeResults: results,
      gmailTest,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}