import { auth0 } from "@/lib/auth0";

const DOMAIN = process.env.AUTH0_DOMAIN!;
const CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;

export async function getConnectionToken(connection: string): Promise<string> {
  const session = await auth0.getSession();
  if (!session) {
    throw new Error("No session");
  }

  const tokenSet = (session as any).tokenSet;
  if (!tokenSet?.refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await fetch(`https://${DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type:
        "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      subject_token: tokenSet.refreshToken,
      subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
      requested_token_type:
        "http://auth0.com/oauth/token-type/federated-connection-access-token",
      connection,
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(
      data.error_description || data.error || "Token exchange failed"
    );
  }

  return data.access_token;
}

export async function isConnectionActive(
  connection: string
): Promise<boolean> {
  try {
    const token = await getConnectionToken(connection);
    return !!token;
  } catch {
    return false;
  }
}