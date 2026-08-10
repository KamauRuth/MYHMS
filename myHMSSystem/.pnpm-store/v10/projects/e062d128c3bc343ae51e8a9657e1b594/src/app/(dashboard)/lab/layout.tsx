import { requireStaff } from "@/lib/auth/server"
import { LabWorkflowNav } from "@/components/lab/lab-workflow-nav"

export default async function LaboratoryLayout({ children }: { children: React.ReactNode }) {
  await requireStaff(["ADMIN", "LAB"])
  return <div className="min-h-full bg-slate-50"><LabWorkflowNav /><main>{children}</main></div>
}
