import { DashboardShell } from "@/components/layouts/dashboard-shell"
import { requireStaff } from "@/lib/auth/server"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff()

  return <DashboardShell staff={staff}>{children}</DashboardShell>
}
