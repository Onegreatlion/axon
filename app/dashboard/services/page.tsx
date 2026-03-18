import { Mail, Calendar, Github, MessageSquare, ExternalLink } from "lucide-react";

const services = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Read, draft, and send emails on your behalf.",
    icon: Mail,
    scopes: ["gmail.readonly", "gmail.send", "gmail.modify"],
    connected: false,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "View, create, and manage calendar events.",
    icon: Calendar,
    scopes: ["calendar.readonly", "calendar.events"],
    connected: false,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Access repositories, pull requests, and issues.",
    icon: Github,
    scopes: ["repo", "read:org", "read:user"],
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Read and send messages across your workspace.",
    icon: MessageSquare,
    scopes: ["channels:read", "chat:write", "im:read"],
    connected: false,
  },
];

export default function ServicesPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="h-14 px-6 flex items-center border-b border-zinc-800/50 shrink-0">
        <h1 className="text-sm font-medium text-zinc-200">Services</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <p className="text-sm text-zinc-400">
              Connect services to let Axon act on your behalf. Each connection
              uses OAuth through Auth0 Token Vault. You can review and revoke
              access at any time.
            </p>
          </div>

          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center mt-0.5">
                      <service.icon className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-zinc-200">
                        {service.name}
                      </h3>
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

                  <button className="text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg px-3.5 py-2 transition-colors flex items-center gap-1.5 shrink-0">
                    Connect
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
            <h3 className="text-xs font-medium text-zinc-400 mb-2">
              How connections work
            </h3>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li>
                Each service connection initiates an OAuth flow managed by
                Auth0 Token Vault.
              </li>
              <li>
                Tokens are stored securely in Token Vault, never in this
                application.
              </li>
              <li>
                Token refresh is handled automatically. You connect once.
              </li>
              <li>
                You can disconnect any service instantly. Tokens are revoked
                immediately.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}