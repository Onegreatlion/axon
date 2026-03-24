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
  CheckCircle,
} from "lucide-react";

export default async function Home() {
  const session = await auth0.getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500/90" />
            <span className="font-semibold text-sm tracking-tight">Axon</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Onegreatlion/axon"
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

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-6">
            Built with Auth0 Token Vault
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50 mb-4 text-balance">
            AI agents that act
            <br />
            within your rules.
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8 text-balance">
            Axon is a constitution-driven AI agent. You define the rules in
            plain English. Axon enforces them at runtime, through Auth0 Token
            Vault, on every action it takes.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/auth/login?returnTo=/dashboard"
              className="inline-flex items-center gap-2 bg-amber-500 text-zinc-950 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/Onegreatlion/axon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-zinc-900 text-zinc-300 px-5 py-2.5 rounded-lg font-medium text-sm border border-zinc-800 hover:border-zinc-700 hover:text-zinc-100 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            The problem with AI agents today
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="font-medium text-zinc-200">
                OAuth scopes are too broad
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Standard OAuth gives agents access to entire services. A single
                consent grants more power than any single task requires.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                <Eye className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Users cannot see what agents do
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Most agent systems provide no audit trail. Users have no way to
                understand what actions were taken on their behalf.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Rules live in prompts, not in code
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Behavioral constraints are typically injected into model
                prompts. The model can ignore them. There is no structural
                enforcement.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            How Axon solves this
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Delegated access through Token Vault
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Google credentials are managed by Auth0 Token Vault. The
                application never stores raw third-party tokens. Access is
                retrieved on demand, scoped to the action.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Constitution-driven rules
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Users define behavioral rules in plain English. Rules are
                persisted and enforced at runtime before any tool executes, not
                just injected into a prompt.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-medium text-zinc-200">
                Full action transparency
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Every action is logged with service, risk tier, scopes used,
                rules applied, and outcome. Nothing happens without a trace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            Risk-based intent classification
          </h2>
          <div className="space-y-3">
            {[
              {
                tier: "Observe",
                description:
                  "Read-only access. Summarize inbox, check calendar.",
                auth: "Auto-approved",
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                border: "border-emerald-400/20",
              },
              {
                tier: "Draft",
                description:
                  "Create content without publishing. Draft replies.",
                auth: "Auto-approved",
                color: "text-blue-400",
                bg: "bg-blue-400/10",
                border: "border-blue-400/20",
              },
              {
                tier: "Act",
                description: "Send, post, or modify external resources.",
                auth: "Queued for approval",
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
                auth: "Manual confirmation",
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
                  className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${item.bg} ${item.color} ${item.border} border shrink-0`}
                >
                  {item.tier}
                </span>
                <span className="text-sm text-zinc-400 flex-1">
                  {item.description}
                </span>
                <span className="text-xs text-zinc-600 hidden sm:block shrink-0">
                  {item.auth}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            Security model
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: "Tokens stored in Auth0 Token Vault",
                description:
                  "Third-party OAuth credentials never touch the application. Token Vault manages storage, refresh, and retrieval.",
              },
              {
                icon: Lock,
                title: "Least privilege by default",
                description:
                  "Each action requests only the scopes it needs. Read actions never receive write access.",
              },
              {
                icon: CheckCircle,
                title: "Approval queue for risky actions",
                description:
                  "Act-tier and higher actions are queued for user review before executing. Users approve or reject from a dedicated page.",
              },
              {
                icon: Eye,
                title: "Full audit trail",
                description:
                  "Every action is logged with service, risk tier, scopes used, rules applied, reasoning, and outcome.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-6 space-y-3"
              >
                <div className="flex items-center gap-2 text-zinc-300">
                  <item.icon className="w-4 h-4 text-amber-500/70" />
                  <h3 className="font-medium text-sm">{item.title}</h3>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold text-zinc-100">
            Start using Axon
          </h2>
          <p className="text-zinc-400">
            Connect your Google account and define your first constitution rule
            in under two minutes.
          </p>
          <Link
            href="/auth/login?returnTo=/dashboard"
            className="inline-flex items-center gap-2 bg-amber-500 text-zinc-950 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500/60" />
            <span>Axon</span>
          </div>
          <span>Built for the Auth0 Authorized to Act Hackathon</span>
        </div>
      </footer>
    </div>
  );
}