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
  Github,
  Mail,
  Calendar,
  Mic,
  HardDrive,
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
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block"
            >
              GitHub
            </a>
            <Link
              href="/auth/login?returnTo=/dashboard"
              className="text-sm bg-amber-500 text-zinc-950 px-4 py-1.5 rounded-lg font-medium hover:bg-amber-400 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-6">
            <Shield className="w-3 h-3" />
            Built with Auth0 Token Vault
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50 mb-4 text-balance leading-tight">
            Your AI agent that acts
            <br />
            <span className="text-amber-500">within your rules</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto mb-8 text-balance">
            Axon manages your email, calendar, Drive, and GitHub. You define
            behavioral rules in plain English. Every action is classified,
            approved, and logged.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/login?returnTo=/dashboard"
              className="inline-flex items-center gap-2 bg-amber-500 text-zinc-950 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors w-full sm:w-auto justify-center"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/Onegreatlion/axon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-zinc-900 text-zinc-300 px-6 py-2.5 rounded-lg font-medium text-sm border border-zinc-800 hover:border-zinc-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Github className="w-4 h-4" />
              View Source
            </a>
          </div>
        </div>
      </section>

      <section className="py-12 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: Mail, label: "Gmail" },
              { icon: Calendar, label: "Calendar" },
              { icon: HardDrive, label: "Drive" },
              { icon: Github, label: "GitHub" },
              { icon: Mic, label: "Voice" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-zinc-900/30 border border-zinc-800/50"
              >
                <item.icon className="w-5 h-5 text-zinc-400" />
                <span className="text-xs text-zinc-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            Why Axon is different
          </h2>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-medium text-zinc-200 text-sm">
                Delegated access via Token Vault
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                OAuth tokens are stored in Auth0 Token Vault. This application
                never stores raw credentials. Access is retrieved on demand,
                scoped to each action.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-medium text-zinc-200 text-sm">
                Constitution-driven rules
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Write behavioral rules in plain English. They are enforced at
                runtime before any tool executes. Not prompt suggestions.
                Structural enforcement.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-medium text-zinc-200 text-sm">
                Full action transparency
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Every action is logged with service, risk tier, scopes used,
                rules applied, and outcome. Complete audit trail. Nothing hidden.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            Risk-based intent classification
          </h2>
          <div className="space-y-2">
            {[
              { tier: "Observe", desc: "Read inbox, check calendar, list repos", auth: "Auto-approved", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
              { tier: "Draft", desc: "Create email drafts, prepare content", auth: "Auto-approved", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
              { tier: "Act", desc: "Send emails, create events, create issues", auth: "Approval required", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
              { tier: "Transact", desc: "Delete data, irreversible operations", auth: "Step-up auth", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
              { tier: "Admin", desc: "Permission changes, account modifications", auth: "Manual only", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
            ].map((item) => (
              <div key={item.tier} className="flex items-center gap-3 md:gap-4 bg-zinc-900/30 border border-zinc-800/50 rounded-lg px-4 py-3 md:px-5 md:py-4">
                <span className={`text-[10px] md:text-xs font-mono font-medium px-2 py-0.5 rounded ${item.bg} ${item.color} ${item.border} border shrink-0`}>{item.tier}</span>
                <span className="text-xs md:text-sm text-zinc-400 flex-1">{item.desc}</span>
                <span className="text-[10px] md:text-xs text-zinc-600 hidden sm:block shrink-0">{item.auth}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-10 text-center">
            Security model
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
            {[
              { icon: Shield, title: "Tokens in Auth0 Token Vault", desc: "Third-party credentials never touch the application. Token Vault manages storage, refresh, and retrieval." },
              { icon: Lock, title: "Least privilege by default", desc: "Each action requests only the scopes it needs. Read actions never receive write access." },
              { icon: CheckCircle, title: "Approval queue for risky actions", desc: "Act-tier and higher actions are queued for review. Users approve or reject from a dedicated page." },
              { icon: Eye, title: "Complete audit trail", desc: "Every action logged with service, risk tier, scopes used, rules applied, reasoning, and outcome." },
            ].map((item) => (
              <div key={item.title} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5 md:p-6 space-y-2">
                <div className="flex items-center gap-2 text-zinc-300">
                  <item.icon className="w-4 h-4 text-amber-500/70" />
                  <h3 className="font-medium text-sm">{item.title}</h3>
                </div>
                <p className="text-xs md:text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100">
            Ready to take control?
          </h2>
          <p className="text-sm md:text-base text-zinc-400">
            Connect your services and define your first rule in under two minutes.
          </p>
          <Link
            href="/auth/login?returnTo=/dashboard"
            className="inline-flex items-center gap-2 bg-amber-500 text-zinc-950 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-amber-400 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-600">
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