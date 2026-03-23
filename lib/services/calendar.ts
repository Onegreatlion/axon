interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  status: string;
  htmlLink: string;
}

export async function listEvents(
  accessToken: string,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&timeMin=${now}&singleEvents=true&orderBy=startTime`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.status}`);
  }

  const data = await response.json();

  return (data.items || []).map((event: any) => ({
    id: event.id,
    summary: event.summary || "No title",
    description: event.description || "",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location || "",
    status: event.status || "",
    htmlLink: event.htmlLink || "",
  }));
}

export async function createEvent(
  accessToken: string,
  summary: string,
  startTime: string,
  endTime: string,
  description?: string
): Promise<CalendarEvent> {
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description: description || "",
        start: { dateTime: startTime },
        end: { dateTime: endTime },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Calendar create error: ${JSON.stringify(error)}`);
  }

  const event = await response.json();

  return {
    id: event.id,
    summary: event.summary,
    description: event.description || "",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location || "",
    status: event.status || "",
    htmlLink: event.htmlLink || "",
  };
}