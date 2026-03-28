import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import {
  ArrowRight, Shield, FileText, Activity, Zap, Lock, Eye,
  CheckCircle, Github, Mail, Calendar, HardDrive, Mic,
  GitBranch, ListTodo, Users, Bot, Sparkles, Layers,
} from "lucide-react";

export default async function Home() {
  const session = await auth0.getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-zinc-950" />
            </div>
            <span className="font-bold text-base tracking-tight">Axon</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://github.com/Onegreatlion/axon" target="_blank" rel="noopener noreferrer"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block">Source</a>
            <Link href="/auth/login?returnTo=/dashboard"
              className="text-sm bg-amber-500 text-zinc-950 px-4 py-1.5 rounded-lg font-semibold hover:bg-amber-400 transition-colors">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-amber-500/90 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Auth0 Token Vault
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Your AI agent that
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              acts within your rules
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Axon manages your email, calendar, files, code, tasks, and contacts.
            You define behavioral rules in plain English. Every action is classified,
            approved, and logged.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/login?returnTo=/dashboard"
              className="inline-flex items-center gap-2.5 bg-amber-500 text-zinc-950 px-7 py-3 rounded-xl font-semibold text-sm hover:bg-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/20 w-full sm:w-auto justify-center">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://github.com/Onegreatlion/axon" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-zinc-900 text-zinc-300 px-7 py-3 rounded-xl font-semibold text-sm border border-zinc-800 hover:border-zinc-700 transition-all w-full sm:w-auto justify-center">
              <Github className="w-4 h-4" /> View Source
            </a>
          </div>
        </div>
      </section>

      {/* Connected Services Strip */}
      <section className="py-8 px-6 border-y border-zinc-900/80">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
            {[
              { icon: Mail, label: "Gmail" },
              { icon: Calendar, label: "Calendar" },
              { icon: HardDrive, label: "Drive" },
              { icon: Github, label: "GitHub" },
              { icon: ListTodo, label: "Tasks" },
              { icon: Users, label: "Contacts" },
              { icon: Mic, label: "Voice" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 py-4 rounded-xl bg-zinc-900/30 border border-zinc-800/30">
                <item.icon className="w-5 h-5 text-zinc-500" />
                <span className="text-[11px] text-zinc-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Axon Different */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Not just another AI assistant</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Most AI agents get broad access and operate without boundaries. Axon is different.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Delegated access via Token Vault",
                desc: "OAuth tokens stored and managed by Auth0. This application never stores raw credentials. Access retrieved on demand, scoped to each action.",
              },
              {
                icon: FileText,
                title: "Constitution-driven rules",
                desc: "Write behavioral rules in plain English. They are enforced at runtime before any tool executes. Not prompt suggestions — structural enforcement.",
              },
              {
                icon: Activity,
                title: "Full action transparency",
                desc: "Every action logged with service, risk tier, scopes used, rules applied, and outcome. Complete audit trail. Nothing hidden.",
              },
            ].map((item) => (
              <div key={item.title} className="group p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/15 transition-colors">
                  <item.icon className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-zinc-200 mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">How it works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-0">
            {[
              { step: "01", title: "Connect", desc: "Link your Google account and GitHub through Auth0 Token Vault. Scopes are explicit." },
              { step: "02", title: "Define rules", desc: "Write plain-English rules like 'Never send emails without my approval.' Enforced at runtime." },
              { step: "03", title: "Chat", desc: "Ask Axon to manage your inbox, schedule meetings, review PRs, create tasks." },
              { step: "04", title: "Stay in control", desc: "Every action classified by risk. High-risk actions require your approval. Full audit trail." },
            ].map((item, i) => (
              <div key={item.step} className="relative p-6">
                {i < 3 && <div className="hidden md:block absolute top-1/2 right-0 w-px h-8 -translate-y-1/2 bg-zinc-800" />}
                <span className="text-[10px] font-mono text-amber-500/60 mb-3 block">{item.step}</span>
                <h3 className="font-semibold text-zinc-200 mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Classification */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Risk-based intent classification</h2>
            <p className="text-zinc-500">Every action classified before execution. Higher risk requires more authorization.</p>
          </div>
          <div className="space-y-2">
            {[
              { tier: "Observe", desc: "Read inbox, check calendar, list repos", auth: "Auto-approved", color: "text-emerald-400", bg: "bg-emerald-400/8", border: "border-emerald-400/15" },
              { tier: "Draft", desc: "Create email drafts, prepare content", auth: "Auto-approved", color: "text-blue-400", bg: "bg-blue-400/8", border: "border-blue-400/15" },
              { tier: "Act", desc: "Send emails, create events, create issues", auth: "Approval required", color: "text-amber-400", bg: "bg-amber-400/8", border: "border-amber-400/15" },
              { tier: "Transact", desc: "Delete data, irreversible operations", auth: "Step-up auth", color: "text-orange-400", bg: "bg-orange-400/8", border: "border-orange-400/15" },
              { tier: "Admin", desc: "Permission changes, account modifications", auth: "Manual only", color: "text-red-400", bg: "bg-red-400/8", border: "border-red-400/15" },
            ].map((item) => (
              <div key={item.tier} className={`flex items-center gap-4 ${item.bg} border ${item.border} rounded-xl px-5 py-4`}>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${item.bg} ${item.color} ${item.border} border shrink-0 min-w-[70px] text-center`}>
                  {item.tier}
                </span>
                <span className="text-sm text-zinc-400 flex-1">{item.desc}</span>
                <span className="text-[11px] text-zinc-600 hidden sm:block shrink-0 font-medium">{item.auth}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Security model</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Shield, title: "Tokens in Auth0 Token Vault", desc: "Third-party credentials never touch the application. Token Vault manages storage, refresh, and retrieval." },
              { icon: Lock, title: "Least privilege by default", desc: "Each action requests only the scopes it needs. Read actions never receive write access." },
              { icon: CheckCircle, title: "Approval queue for risky actions", desc: "Act-tier and higher actions queued for review. Users approve or reject from a dedicated page." },
              { icon: Eye, title: "Complete audit trail", desc: "Every action logged with service, risk tier, scopes used, rules applied, reasoning, and outcome." },
            ].map((item) => (
              <div key={item.title} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 space-y-3 hover:border-zinc-700/50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4.5 h-4.5 text-amber-500/70" />
                  <h3 className="font-semibold text-sm text-zinc-200">{item.title}</h3>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider mb-6">Built with</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
            {["Next.js 16", "Auth0 Token Vault", "Supabase", "Gemini AI", "Groq", "Vercel"].map((t) => (
              <span key={t} className="hover:text-zinc-300 transition-colors">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to take control?</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            Connect your services and define your first rule in under two minutes.
          </p>
          <Link href="/auth/login?returnTo=/dashboard"
            className="inline-flex items-center gap-2.5 bg-amber-500 text-zinc-950 px-7 py-3 rounded-xl font-semibold text-sm hover:bg-amber-400 transition-all hover:shadow-lg hover:shadow-amber-500/20">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-amber-500/60 flex items-center justify-center">
              <Bot className="w-3 h-3 text-zinc-950" />
            </div>
            <span className="font-medium">Axon</span>
          </div>
          <span>Built for the Auth0 Authorized to Act Hackathon</span>
          <a href="https://github.com/Onegreatlion/axon" target="_blank" rel="noopener noreferrer"
            className="hover:text-zinc-400 transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}