import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Shield,
  FileText,
  Activity,
  Zap,
  Lock,
  Eye,
} from "lucide-react";

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/90" />
            <span className="font-semibold text-sm tracking-tight">Axon</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/docs"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Docs
            </Link>
            <a
              href="https://github.com/YOUR_USERNAME/axon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/auth/login?returnTo=/dashboard"
              className="text-sm bg-zinc-50 text-zinc-900 px-3.5 py-1.5 rounded-md font-medium hover:bg-zinc-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-6">
            Built with Auth0 Token Vault
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50 mb-4 text-balance">
            Your AI agent,
            <br />
            authorized to act.
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 text-balance">
            One agent handles your email, calendar, code, and messages. You
            define the rules. Every action scoped, gated, and logged through
            Auth0 Token Vault.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/auth/login?returnTo=/dashboard"
              className="inline-flex items-center gap-2 bg-amber-500 text-zinc-950 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 bg-zinc-900 text-zinc-300 px-5 py-2.5 rounded-lg font-medium text-sm border border-zinc-800 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Connect your services
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Gmail, Calendar, GitHub, Slack. Each connected with explicit
                OAuth scopes through Auth0 Token Vault. You see exactly what
                the agent can access.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Write your constitution
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Define what your agent can and cannot do in plain English.
                Rules are parsed and mapped to scope restrictions, behavioral
                constraints, and step-up triggers.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Agent works, you watch
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Axon reads, drafts, and acts on your behalf. Every action
                classified by risk, checked against your constitution, and
                logged for full transparency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Model */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            Security model
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <Shield className="w-4 h-4 text-amber-500/70" />
                <h3 className="font-medium text-sm">
                  Five-tier intent classification
                </h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Every agent action is classified as Observe, Draft, Act,
                Transact, or Admin. Each tier has different authorization
                requirements. Destructive and financial actions always require
                step-up authentication.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <Lock className="w-4 h-4 text-amber-500/70" />
                <h3 className="font-medium text-sm">
                  Least privilege by default
                </h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Axon resolves the minimum OAuth scopes required for each
                action. Replying to one email requests send access scoped to
                that recipient, not unrestricted send access to your entire
                account.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <Eye className="w-4 h-4 text-amber-500/70" />
                <h3 className="font-medium text-sm">
                  Full action transparency
                </h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Every action is logged with what was requested, which
                constitution rules applied, what scopes were used, and the
                outcome. You can audit everything your agent has ever done.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <Zap className="w-4 h-4 text-amber-500/70" />
                <h3 className="font-medium text-sm">
                  Instant revocation
                </h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Disconnect any service with one click. All associated tokens
                are invalidated immediately through Token Vault. A global
                kill switch revokes everything at once.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Tiers */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            Intent classification
          </h2>
          <div className="space-y-3">
            {[
              {
                tier: "Observe",
                description: "Read-only access. Summarize inbox, check calendar.",
                auth: "Auto-approved",
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                border: "border-emerald-400/20",
              },
              {
                tier: "Draft",
                description: "Create content without publishing. Draft replies, prepare posts.",
                auth: "Auto-approved",
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                border: "border-blue-400/20",
              },
              {
                tier: "Act",
                description: "Send, post, or modify external resources.",
                auth: "Requires approval",
                color: "text-amber-400",
                bg: "bg-amber-400/10",
                border: "border-amber-400/20",
              },
              {
                tier: "Transact",
                description: "Financial or irreversible operations.",
                auth: "Step-up authentication",
                color: "text-orange-400",
                bg: "bg-orange-400/10",
                border: "border-orange-400/20",
              },
              {
                tier: "Admin",
                description: "Permission changes, account modifications.",
                auth: "Manual confirmation + MFA",
                color: "text-red-400",
                bg: "bg-red-400/10",
                border: "border-red-400/20",
              },
            ].map((item) => (
              <div
                key={item.tier}
                className="flex items-center gap-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-5 py-4"
              >
                <span
                  className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${item.bg} ${item.color} ${item.border} border`}
                >
                  {item.tier}
                </span>
                <span className="text-sm text-zinc-400 flex-1">
                  {item.description}
                </span>
                <span className="text-xs text-zinc-600 hidden sm:block">
                  {item.auth}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Developers */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
            For developers
          </h2>
          <p className="text-zinc-400 mb-8 text-balance">
            The authorization engine is available as a standalone library.
            Drop it into your own agent projects.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            </div>
            <pre className="text-sm font-mono">
              <code>
                <span className="text-zinc-500">
                  {"// Install the authorization engine\n"}
                </span>
                <span className="text-amber-400">{"npm install "}</span>
                <span className="text-zinc-300">{"axon-shield\n\n"}</span>
                <span className="text-zinc-500">
                  {"// Classify any agent intent\n"}
                </span>
                <span className="text-blue-400">{"import "}</span>
                <span className="text-zinc-300">{"{ classifyIntent }"}</span>
                <span className="text-blue-400">{" from "}</span>
                <span className="text-emerald-400">
                  {"'axon-shield'\n\n"}
                </span>
                <span className="text-blue-400">{"const "}</span>
                <span className="text-zinc-300">{"result = "}</span>
                <span className="text-blue-400">{"await "}</span>
                <span className="text-zinc-300">
                  {'classifyIntent(\n  "Send a reply to Sarah"\n)\n\n'}
                </span>
                <span className="text-zinc-500">
                  {"// result.tier → 'act'\n"}
                </span>
                <span className="text-zinc-500">
                  {"// result.requires_approval → true\n"}
                </span>
                <span className="text-zinc-500">
                  {"// result.scopes → ['gmail.send']"}
                </span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Built With */}
      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-8">
            Built with
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-600">
            <span>Auth0 Token Vault</span>
            <span className="text-zinc-800">·</span>
            <span>Next.js</span>
            <span className="text-zinc-800">·</span>
            <span>Groq</span>
            <span className="text-zinc-800">·</span>
            <span>Supabase</span>
            <span className="text-zinc-800">·</span>
            <span>TypeScript</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500/60" />
            <span>Axon</span>
          </div>
          <span>
            Built for the Auth0 Authorized to Act Hackathon
          </span>
        </div>
      </footer>
    </div>
  );
}