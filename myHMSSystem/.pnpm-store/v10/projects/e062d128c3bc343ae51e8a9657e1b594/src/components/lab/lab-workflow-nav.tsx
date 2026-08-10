"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckCircle2, FlaskConical, House, Send, TestTubes } from "lucide-react"

const stages = [
  { href: "/lab", label: "Overview", detail: "Workload", icon: House },
  { href: "/lab/lab-queue", label: "Paid requests", detail: "Collect & test", icon: TestTubes },
  { href: "/lab/validation", label: "Validation", detail: "Clinical review", icon: CheckCircle2 },
  { href: "/lab/delivery", label: "Release", detail: "Send results", icon: Send },
]

export function LabWorkflowNav() {
  const pathname = usePathname()
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700"><FlaskConical className="h-4 w-4" /> Diagnostic services</div><h1 className="mt-1 text-2xl font-bold text-slate-950">Laboratory</h1><p className="mt-1 text-sm text-slate-600">Paid request to verified clinical result.</p></div>
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Laboratory workflow">
            {stages.map((stage, index) => { const Icon = stage.icon; const active = stage.href === "/lab" ? pathname === "/lab" : pathname === stage.href || pathname.startsWith(`${stage.href}/`); return <Link key={stage.href} href={stage.href} aria-current={active ? "page" : undefined} className={`flex min-w-[145px] items-center gap-3 rounded-xl border px-3 py-2.5 ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${active ? "bg-white/15" : "bg-slate-100"}`}>{index + 1}</span><span><span className="flex items-center gap-1 text-sm font-semibold"><Icon className="h-3.5 w-3.5" />{stage.label}</span><span className={`block text-[11px] ${active ? "text-blue-100" : "text-slate-500"}`}>{stage.detail}</span></span></Link> })}
          </div>
        </div>
      </div>
    </div>
  )
}
