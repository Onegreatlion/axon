export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { getConnectionToken } from "@/lib/token-vault";
import { listEvents, createEvent } from "@/lib/services/calendar";

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getConnectionToken("google-oauth2");

    const maxResults = parseInt(
      request.nextUrl.searchParams.get("max") || "10"
    );
    const events = await listEvents(accessToken, maxResults);

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Calendar error:", error.message);
    return NextResponse.json(
      { error: error.message || "Calendar error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getConnectionToken("google-oauth2");

    const body = await request.json();
    const { summary, startTime, endTime, description } = body;

    if (!summary || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: summary, startTime, endTime" },
        { status: 400 }
      );
    }

    const event = await createEvent(
      accessToken,
      summary,
      startTime,
      endTime,
      description
    );

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Calendar create error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}