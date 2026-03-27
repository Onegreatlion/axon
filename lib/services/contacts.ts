export async function searchContacts(
  accessToken: string,
  query: string,
  maxResults: number = 10
) {
  const res = await fetch(
    `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(query)}&readMask=names,emailAddresses,phoneNumbers,organizations&pageSize=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`People API error: ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r: any) => {
    const p = r.person;
    return {
      name: p.names?.[0]?.displayName || "Unknown",
      email: p.emailAddresses?.[0]?.value || null,
      phone: p.phoneNumbers?.[0]?.value || null,
      organization: p.organizations?.[0]?.name || null,
    };
  });
}

export async function listConnections(
  accessToken: string,
  maxResults: number = 20
) {
  const res = await fetch(
    `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=${maxResults}&sortOrder=LAST_MODIFIED_DESCENDING`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error(`People API error: ${res.status}`);
  const data = await res.json();
  return (data.connections || []).map((p: any) => ({
    name: p.names?.[0]?.displayName || "Unknown",
    email: p.emailAddresses?.[0]?.value || null,
    phone: p.phoneNumbers?.[0]?.value || null,
    organization: p.organizations?.[0]?.name || null,
  }));
}