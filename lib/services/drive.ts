interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  size: string;
}

export async function listFiles(
  accessToken: string,
  query?: string,
  maxResults: number = 10
): Promise<DriveFile[]> {
  let url = `https://www.googleapis.com/drive/v3/files?pageSize=${maxResults}&fields=files(id,name,mimeType,modifiedTime,webViewLink,size)&orderBy=modifiedTime desc`;

  if (query) {
    url += `&q=name contains '${query.replace(/'/g, "\\'")}'`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Drive API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink || "",
    size: f.size || "0",
  }));
}

export async function searchFiles(
  accessToken: string,
  query: string,
  maxResults: number = 10
): Promise<DriveFile[]> {
  return listFiles(accessToken, query, maxResults);
}