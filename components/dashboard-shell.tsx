"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, Layers, FileText, ScrollText, Settings, LogOut, PanelLeft, X, Shield } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: MessageSquare },
  { name: "Approvals", href: "/dashboard/approvals", icon: Shield },
  { name: "Services", href: "/dashboard/services", icon: Layers },
  { name: "Constitution", href: "/dashboard/constitution", icon: FileText },
  { name: "Logs", href: "/dashboard/logs", icon: ScrollText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardShell({ userName, userEmail, children }: { userName: string; userEmail: string; children: React.ReactNode; }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const currentTitle = useMemo(() => {
    const active = navigation.find((item) => pathname === item.href);
    return active?.name || "Dashboard";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 md:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 border-r border-zinc-800/50 flex-col shrink-0">
        <div className="h-14 px-5 flex items-center gap-2 border-b border-zinc-800/50">
          <div className="w-5 h-5 rounded bg-amber-500/90" />
          <span className="font-semibold text-sm tracking-tight">Axon</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${active ? "bg-zinc-800/70 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}>
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-800/50">
          <button onClick={() => setLogoutOpen(true)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors mt-1">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur">
        <div className="h-full px-4 flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">
            <PanelLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-medium text-zinc-200 truncate">{currentTitle}</h1>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800/50 flex flex-col">
            <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-amber-500/90" />
                <span className="font-semibold text-sm tracking-tight text-zinc-100">Axon</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-2.5 px-2.5 py-3 rounded-md text-sm transition-colors ${active ? "bg-zinc-800/70 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}>
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-zinc-800/50">
              <button onClick={() => { setOpen(false); setLogoutOpen(true); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors mt-1">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {logoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setLogoutOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-sm font-medium text-zinc-100">Sign out</h2>
            <p className="text-sm text-zinc-500 mt-2">Are you sure you want to sign out of Axon?</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setLogoutOpen(false)} className="text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 hover:text-zinc-200 hover:border-zinc-700 transition-colors">No</button>
              <a href="/auth/logout" className="text-xs font-medium text-zinc-950 bg-amber-500 rounded-lg px-3.5 py-2 hover:bg-amber-400 transition-colors">Yes, sign out</a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Properly Handles Mobile Height */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 h-screen overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}