"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Github,
  MessageSquare,
  Check,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";

interface ServiceConfig {
  id: string;
  connectionKey: string | null;
  connectionName: string | null;
  name: string;
  description: string;
  icon: React.ElementType;
  scopes: string[];
  available: boolean;
}

const services: ServiceConfig[] = [
  {
    id: "gmail",
    connectionKey: "google",
    connectionName: "google-oauth2",
    name: "Gmail & Calendar",
    description:
      "Read, draft, and send emails. View and manage calendar events.",
    icon: Mail,
    scopes: [
      "gmail.readonly",
      "gmail.send",
      "calendar.events",
      "calendar.events.readonly",
    ],
    available: true,
  },
  {
    id: "github",
    connectionKey: "github",
    connectionName: "github",
    name: "GitHub",
    description: "Access repositories, pull requests, and issues.",
    icon: Github,
    scopes: ["repo", "read:org", "read:user"],
    available: false,
  },
  {
    id: "slack",
    connectionKey: null,
    connectionName: null,
    name: "Slack",
    description: "Read and send messages across your workspace.",
    icon: MessageSquare,
    scopes: ["channels:read", "chat:write", "im:read"],
    available: false,
  },
];

export default function ServicesPage() {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatuses();
  }, []);

  async function checkStatuses() {
    try {
      const res = await fetch("/api/connections/status");
      const data = await res.json();
      if (data.statuses) {
        setStatuses(data.statuses);
      }
    } catch (err) {
      console.error("Failed to check statuses:", err);
    } finally {
      setLoading(false);
    }
  }

  function connectService(connectionName: string) {
    window.location.href = `/api/connections/connect?connection=${connectionName}`;
  }

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-4 md:px-6 flex items-center border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Services</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-sm text-zinc-400">
              Connect services to let Axon act on your behalf. Each connection
              uses OAuth through Auth0 Token Vault. Tokens are stored securely
              and never pass through this application.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const isConnected = service.connectionKey
                  ? statuses[service.connectionKey] === true
                  : false;

                return (
                  <div
                    key={service.id}
                    className={`border rounded-xl p-4 md:p-5 ${
                      isConnected
                        ? "bg-emerald-400/5 border-emerald-400/20"
                        : "bg-zinc-900/50 border-zinc-800/50"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 ${
                            isConnected
                              ? "bg-emerald-400/10 border-emerald-400/20"
                              : "bg-zinc-800 border-zinc-700/50"
                          }`}
                        >
                          <service.icon
                            className={`w-4 h-4 ${
                              isConnected
                                ? "text-emerald-400"
                                : "text-zinc-400"
                            }`}
                          />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-zinc-200">
                              {service.name}
                            </h3>
                            {isConnected && (
                              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded px-1.5 py-0.5">
                                Connected
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-zinc-500">
                            {service.description}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {service.scopes.map((scope) => (
                              <span
                                key={scope}
                                className="text-[10px] font-mono text-zinc-600 bg-zinc-800/50 border border-zinc-800 rounded px-1.5 py-0.5"
                              >
                                {scope}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {service.available && !isConnected && (
                          <button
                            onClick={() =>
                              service.connectionName &&
                              connectService(service.connectionName)
                            }
                            className="w-full sm:w-auto text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg px-3.5 py-2 transition-colors flex items-center justify-center gap-1.5"
                          >
                            Connect
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {isConnected && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </div>
                        )}

                        {!service.available && (
                          <span className="text-[10px] text-zinc-600">
                            Coming soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
            <h3 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1.5">
              <Info className="w-3 h-3" />
              How Token Vault works
            </h3>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li>
                Each service uses Auth0 Connected Accounts to securely store
                OAuth tokens in Token Vault.
              </li>
              <li>
                Axon retrieves tokens from Token Vault on demand. Tokens never
                pass through the browser or get stored in this application.
              </li>
              <li>Token refresh is handled automatically by Token Vault.</li>
              <li>You can disconnect any service to revoke access instantly.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}