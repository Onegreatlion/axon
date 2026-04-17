export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { getConnectionToken } from "@/lib/token-vault";
import { listEmails, sendEmail, getEmailCount } from "@/lib/services/gmail";

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getConnectionToken("google-oauth2");

    const action = request.nextUrl.searchParams.get("action") || "list";

    if (action === "count") {
      const count = await getEmailCount(accessToken);
      return NextResponse.json(count);
    }

    const maxResults = parseInt(
      request.nextUrl.searchParams.get("max") || "10"
    );
    const emails = await listEmails(accessToken, maxResults);

    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error("Gmail error:", error.message);
    return NextResponse.json(
      { error: error.message || "Gmail error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getConnectionToken("google-oauth2");

    const body = await request.json();
    const { to, subject, message } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, message" },
        { status: 400 }
      );
    }

    const result = await sendEmail(accessToken, to, subject, message);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Gmail send error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to send" },
      { status: 500 }
    );
  }
}