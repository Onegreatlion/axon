import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login?returnTo=/dashboard");
  }

  const user = session.user;

  return (
    <DashboardShell
      userName={user.name || "User"}
      userEmail={user.email || ""}
    >
      {children}
    </DashboardShell>
  );
}