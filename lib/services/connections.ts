export const SERVICE_CONNECTIONS = {
  google: {
    connectionName: "google-oauth2",
    displayName: "Gmail & Calendar",
    services: ["gmail", "calendar"],
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  },
  github: {
    connectionName: "github",
    displayName: "GitHub",
    services: ["github"],
    scopes: ["repo", "read:org", "read:user"],
  },
} as const;

export type ConnectionKey = keyof typeof SERVICE_CONNECTIONS;