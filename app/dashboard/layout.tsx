import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import {
  MessageSquare,
  Layers,
  FileText,
  ScrollText,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: MessageSquare },
  { name: "Services", href: "/dashboard/services", icon: Layers },
  { name: "Constitution", href: "/dashboard/constitution", icon: FileText },
  { name: "Logs", href: "/dashboard/logs", icon: ScrollText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-zinc-800/50 flex flex-col">
        {/* Logo */}
        <div className="h-14 px-5 flex items-center gap-2 border-b border-zinc-800/50">
          <div className="w-5 h-5 rounded bg-amber-500/90" />
          <span className="font-semibold text-sm tracking-tight">Axon</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors group"
            >
              <item.icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-400" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-zinc-800/50">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-400">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">
                {user.name || "User"}
              </p>
              <p className="text-[10px] text-zinc-600 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <a
            href="/auth/logout"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors mt-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}