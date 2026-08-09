import Link from "next/link"
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FlaskConical, Microscope, TestTubes } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type LabRequest = { id: string; status: string | null; created_at: string; payment_status: string | null }

async function getLabReport() {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [requestsResult, alertsResult] = await Promise.all([
    supabase
      .from("lab_requests")
      .select("id,status,created_at,payment_status")
      .order("created_at", { ascending: false }),
    supabase
      .from("lab_critical_alerts")
      .select("id", { count: "exact", head: true })
      .eq("acknowledged", false),
  ])

  const requests = (requestsResult.data ?? []) as LabRequest[]
  const normalized = requests.map((request) => ({ ...request, normalizedStatus: request.status?.toLowerCase() ?? "unknown" }))
  const completedStatuses = new Set(["completed", "validated", "delivered"])
  const pendingStatuses = new Set(["pending", "requested"])
  const processingStatuses = new Set(["in_progress", "sample_collected", "processing", "awaiting_validation"])
  const completed = normalized.filter((request) => completedStatuses.has(request.normalizedStatus)).length

  return {
    total: requests.length,
    today: requests.filter((request) => new Date(request.created_at) >= today).length,
    pending: normalized.filter((request) => pendingStatuses.has(request.normalizedStatus)).length,
    processing: normalized.filter((request) => processingStatuses.has(request.normalizedStatus)).length,
    completed,
    completionRate: requests.length ? Math.round((completed / requests.length) * 100) : 0,
    criticalAlerts: alertsResult.count ?? 0,
    recent: normalized.slice(0, 8),
  }
}

export default async function LaboratoryDashboardPage() {
  const report = await getLabReport()

  return (
    <main className="space-y-6 px-4 lg:px-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="outline" className="mb-3">Diagnostic operations</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Laboratory dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Request workload, turnaround progress, validation, and critical-result monitoring.</p>
        </div>
        <Button asChild><Link href="/lab/lab-queue">Open paid queue <ArrowRight className="ml-2 size-4" /></Link></Button>
      </section>

      {report.criticalAlerts > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <div className="flex items-center gap-3"><AlertTriangle className="size-5" /><div><p className="font-semibold">Critical results require acknowledgement</p><p className="text-sm opacity-80">{report.criticalAlerts} active alert{report.criticalAlerts === 1 ? "" : "s"}</p></div></div>
          <Button asChild size="sm" variant="outline"><Link href="/lab/alerts">Review alerts</Link></Button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Requests today" value={report.today} detail={`${report.total} total requests`} icon={TestTubes} />
        <Metric title="Awaiting action" value={report.pending} detail="Requested or pending" icon={Clock3} />
        <Metric title="In process" value={report.processing} detail="Collection or testing underway" icon={Microscope} />
        <Metric title="Completion rate" value={`${report.completionRate}%`} detail={`${report.completed} completed`} icon={CheckCircle2} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card>
          <CardHeader><CardTitle>Recent requests</CardTitle></CardHeader>
          <CardContent>
            {report.recent.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No laboratory requests recorded.</p> : (
              <div className="divide-y">
                {report.recent.map((request) => (
                  <div key={request.id} className="flex items-center justify-between py-3">
                    <div><p className="font-mono text-xs font-medium">{request.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleString("en-KE")}</p></div>
                    <div className="text-right"><Badge variant="secondary" className="capitalize">{request.normalizedStatus.replace(/_/g, " ")}</Badge><p className="mt-1 text-xs capitalize text-muted-foreground">{request.payment_status || "Payment not set"}</p></div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Support tools</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="outline" className="justify-start"><Link href="/lab/lab-queue"><FlaskConical className="mr-2 size-4" />Paid request queue</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/lab/alerts"><AlertTriangle className="mr-2 size-4" />Critical alerts</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/lab/lab-master"><Microscope className="mr-2 size-4" />Test catalogue</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link href="/lab/qc"><TestTubes className="mr-2 size-4" />Quality control</Link></Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Metric({ title, value, detail, icon: Icon }: { title: string; value: string | number; detail: string; icon: typeof FlaskConical }) {
  return <Card><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></div></CardContent></Card>
}
