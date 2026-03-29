"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare, Layers, FileText, ScrollText, Settings,
  Shield, LogOut, PanelLeft, X, User, Bot, Activity,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: MessageSquare },
  { name: "Approvals", href: "/dashboard/approvals", icon: Shield },
  { name: "Services", href: "/dashboard/services", icon: Layers },
  { name: "Constitution", href: "/dashboard/constitution", icon: FileText },
  { name: "Logs", href: "/dashboard/logs", icon: ScrollText },
  { name: "Status", href: "/dashboard/status", icon: Activity },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardShell({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const currentTitle = useMemo(() => {
    const active = navigation.find((item) => pathname === item.href);
    if (pathname === "/dashboard/profile") return "Profile";
    return active?.name || "Dashboard";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] border-r border-zinc-800/50 flex-col shrink-0">
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-zinc-800/50">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-zinc-950" />
          </div>
          <span className="font-bold text-sm tracking-tight">Axon</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all ${
                  active
                    ? "bg-zinc-800/80 text-zinc-100 font-medium"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                }`}>
                <item.icon className={`w-4 h-4 ${active ? "text-amber-500" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-800/50">
          <Link href="/dashboard/profile"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{userName}</p>
              <p className="text-[10px] text-zinc-600 truncate">{userEmail}</p>
            </div>
          </Link>
          <button onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 transition-colors mt-1">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-xl">
        <div className="h-full px-4 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-zinc-400 hover:text-zinc-200 transition-colors">
            <PanelLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Bot className="w-3 h-3 text-zinc-950" />
            </div>
            <h1 className="text-sm font-medium text-zinc-200">{currentTitle}</h1>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800/50 flex flex-col">
            <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-zinc-950" />
                </div>
                <span className="font-bold text-sm">Axon</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navigation.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-3 rounded-lg text-sm transition-all ${
                      active ? "bg-zinc-800/80 text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
                    }`}>
                    <item.icon className={`w-4 h-4 ${active ? "text-amber-500" : ""}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-zinc-800/50">
              <Link href="/dashboard/profile" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                  {userName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-300 truncate">{userName}</p>
                  <p className="text-[10px] text-zinc-600 truncate">{userEmail}</p>
                </div>
              </Link>
              <button onClick={() => { setOpen(false); setLogoutOpen(true); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 transition-colors mt-1">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout dialog */}
      {logoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLogoutOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-sm font-semibold text-zinc-100">Sign out of Axon</h2>
            <p className="text-sm text-zinc-500 mt-2">Your chat history and settings will be saved.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setLogoutOpen(false)}
                className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 hover:text-zinc-200 transition-colors">Cancel</button>
              <a href="/auth/logout"
                className="text-xs font-medium text-zinc-950 bg-amber-500 rounded-lg px-4 py-2 hover:bg-amber-400 transition-colors">Sign out</a>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}