import { requireStaff } from "@/lib/auth/server"

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  await requireStaff(["ADMIN", "FINANCE", "RECEPTION"])
  return children
}
