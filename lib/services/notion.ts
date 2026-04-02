const NOTION_API = "https://api.notion.com/v1";

export async function searchNotion(token: string, query: string) {
  const res = await fetch(`${NOTION_API}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      query,
      page_size: 10,
    }),
  });
  if (!res.ok) throw new Error(`Notion API error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r: any) => ({
    id: r.id,
    type: r.object,
    title: r.properties?.title?.title?.[0]?.plain_text ||
           r.properties?.Name?.title?.[0]?.plain_text ||
           r.title?.[0]?.plain_text || "Untitled",
    url: r.url,
    lastEdited: r.last_edited_time,
  }));
}

export async function createNotionPage(
  token: string,
  parentPageId: string,
  title: string,
  content: string
) {
  const children = content.split("\n").filter(Boolean).map((line) => ({
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: {
      rich_text: [{ type: "text" as const, text: { content: line } }],
    },
  }));

  const res = await fetch(`${NOTION_API}/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: { title: [{ text: { content: title } }] },
      },
      children,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Notion create error: ${JSON.stringify(err)}`);
  }
  const page = await res.json();
  return { id: page.id, url: page.url, title };
}

export async function listNotionDatabases(token: string) {
  const res = await fetch(`${NOTION_API}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      filter: { property: "object", value: "database" },
      page_size: 10,
    }),
  });
  if (!res.ok) throw new Error(`Notion API error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((db: any) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text || "Untitled",
    url: db.url,
  }));
}