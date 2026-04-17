export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const DOMAIN = process.env.AUTH0_DOMAIN!;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { connection } = await request.json();
    if (!connection) {
      return NextResponse.json(
        { error: "Missing connection" },
        { status: 400 }
      );
    }

    const tokenSet = (session as any).tokenSet;
    if (!tokenSet?.refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 400 }
      );
    }

    const connectionName =
      connection === "google" ? "google-oauth2" : connection;

    // Get My Account API token
    const tokenRes = await fetch(`https://${DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: tokenSet.refreshToken,
        audience: `https://${DOMAIN}/me/`,
        scope: "delete:me:connected_accounts read:me:connected_accounts",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Could not get account management token" },
        { status: 500 }
      );
    }

    // List connected accounts to find the one to delete
    const accountsRes = await fetch(
      `https://${DOMAIN}/me/v1/connected-accounts/accounts?connection=${connectionName}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const accountsData = await accountsRes.json();

    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No connected account found to disconnect",
      });
    }

    // Delete ALL connected accounts for this connection
    const deleteResults = [];
    for (const account of accountsData.accounts) {
      const delRes = await fetch(
        `https://${DOMAIN}/me/v1/connected-accounts/accounts/${account.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );
      deleteResults.push({
        id: account.id,
        status: delRes.status,
      });
    }

    return NextResponse.json({
      success: true,
      deleted: deleteResults,
      message: "Disconnected. Reconnect to grant updated permissions.",
    });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}