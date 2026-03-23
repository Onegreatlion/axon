interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isUnread: boolean;
  labels: string[];
}

export async function listEmails(
  accessToken: string,
  maxResults: number = 10
): Promise<Email[]> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.messages || data.messages.length === 0) {
    return [];
  }

  const emails: Email[] = [];

  for (const msg of data.messages.slice(0, maxResults)) {
    const detail = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!detail.ok) continue;

    const message = await detail.json();
    const headers = message.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find(
        (h: { name: string; value: string }) =>
          h.name.toLowerCase() === name.toLowerCase()
      )?.value || "";

    let body = "";
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    } else if (message.payload?.parts) {
      const textPart = message.payload.parts.find(
        (p: any) => p.mimeType === "text/plain"
      );
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    emails.push({
      id: message.id,
      threadId: message.threadId,
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      snippet: message.snippet || "",
      body: body,
      date: getHeader("Date"),
      isUnread: (message.labelIds || []).includes("UNREAD"),
      labels: message.labelIds || [],
    });
  }

  return emails;
}

export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string
): Promise<{ id: string; threadId: string }> {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gmail send error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function getEmailCount(
  accessToken: string
): Promise<{ total: number; unread: number }> {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels/INBOX",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    total: data.messagesTotal || 0,
    unread: data.messagesUnread || 0,
  };
}