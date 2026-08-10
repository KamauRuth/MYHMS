import { requireStaff } from "@/lib/auth/server"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff(["ADMIN"])
  return children
}
