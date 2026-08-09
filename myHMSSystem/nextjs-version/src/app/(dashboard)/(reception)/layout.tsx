import { requireStaff } from "@/lib/auth/server"

export default async function ReceptionLayout({ children }: { children: React.ReactNode }) {
  await requireStaff(["ADMIN", "RECEPTION"])
  return children
}
