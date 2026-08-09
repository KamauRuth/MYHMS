import { requireStaff } from "@/lib/auth/server"

export default async function TriageLayout({ children }: { children: React.ReactNode }) {
  await requireStaff(["ADMIN", "DOCTOR", "NURSE"])
  return children
}
