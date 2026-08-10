import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Baby,
  BedDouble,
  CircleDollarSign,
  Clock3,
  FlaskConical,
  Pill,
  Stethoscope,
  UserRoundPlus,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { requireStaff } from "@/lib/auth/server"

type DashboardStats = {
  patients: number | null
  visitsToday: number | null
  waitingForTriage: number | null
  unpaidInvoices: number | null
  admittedPatients: number | null
  pendingLabs: number | null
  pendingPrescriptions: number | null
}

async function getDashboardStats(): Promise<DashboardStats> {
  const empty: DashboardStats = {
    patients: null,
    visitsToday: null,
    waitingForTriage: null,
    unpaidInvoices: null,
    admittedPatients: null,
    pendingLabs: null,
    pendingPrescriptions: null,
  }

  try {
    const supabase = await createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [patients, visits, triage, invoices, admissions, labs, prescriptions] =
      await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }),
        supabase
          .from("visits")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
        supabase
          .from("visits")
          .select("id", { count: "exact", head: true })
          .eq("status", "TRIAGE"),
        supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .neq("status", "PAID"),
        supabase
          .from("admissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "ADMITTED"),
        supabase
          .from("lab_requests")
          .select("id", { count: "exact", head: true })
          .in("status", ["REQUESTED", "PENDING", "SAMPLE_COLLECTED"]),
        supabase
          .from("prescriptions")
          .select("id", { count: "exact", head: true })
          .in("status", ["PENDING", "PRESCRIBED"]),
      ])

    return {
      patients: patients.count,
      visitsToday: visits.count,
      waitingForTriage: triage.count,
      unpaidInvoices: invoices.count,
      admittedPatients: admissions.count,
      pendingLabs: labs.count,
      pendingPrescriptions: prescriptions.count,
    }
  } catch {
    return empty
  }
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string
  value: number | null
  detail: string
  icon: typeof Users
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {value === null ? "—" : value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  )
}

const careQueues = [
  {
    title: "Triage",
    description: "Record vitals and prioritize waiting patients",
    href: "/triage-queue",
    icon: Activity,
    stat: "waitingForTriage" as const,
  },
  {
    title: "Laboratory",
    description: "Collect samples and process pending requests",
    href: "/lab/lab-requests",
    icon: FlaskConical,
    stat: "pendingLabs" as const,
  },
  {
    title: "Pharmacy",
    description: "Review and dispense active prescriptions",
    href: "/prescriptions",
    icon: Pill,
    stat: "pendingPrescriptions" as const,
  },
  {
    title: "Inpatient",
    description: "Monitor admitted patients and ward activity",
    href: "/ipd/admissions",
    icon: BedDouble,
    stat: "admittedPatients" as const,
  },
]

export default async function DashboardPage() {
  await requireStaff(["ADMIN"])
  const stats = await getDashboardStats()
  const dateLabel = new Intl.DateTimeFormat("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  return (
    <main className="flex-1 space-y-6 px-4 pt-0 lg:px-6">
      <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground shadow-sm">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-28 size-52 rounded-full bg-white/5" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/10">
              <span className="mr-2 size-1.5 rounded-full bg-emerald-300" />
              24/7 hospital operations
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Good day, LifePoint team
            </h1>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/80">
              A single view of today&apos;s patient flow and the clinical queues that need attention.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary-foreground/80">
            <Clock3 className="size-4" />
            {dateLabel}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Registered patients" value={stats.patients} detail="All patient records" icon={Users} />
        <MetricCard title="Visits today" value={stats.visitsToday} detail="Since midnight" icon={Stethoscope} />
        <MetricCard title="Currently admitted" value={stats.admittedPatients} detail="Active IPD admissions" icon={BedDouble} />
        <MetricCard title="Accounts outstanding" value={stats.unpaidInvoices} detail="Invoices requiring action" icon={CircleDollarSign} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Care queues</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Live workload across key service points</p>
            </div>
            <Badge variant="outline">Operational</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {careQueues.map((queue) => {
              const Icon = queue.icon
              const value = stats[queue.stat]
              return (
                <Link
                  key={queue.title}
                  href={queue.href}
                  className="group rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-muted p-2 text-primary"><Icon className="size-5" /></div>
                    <span className="text-2xl font-semibold">{value === null ? "—" : value}</span>
                  </div>
                  <h2 className="mt-4 font-semibold">{queue.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{queue.description}</p>
                  <span className="mt-3 flex items-center text-xs font-medium text-primary">
                    Open queue <ArrowRight className="ml-1 size-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <p className="text-sm text-muted-foreground">Start common hospital workflows</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild size="lg" className="h-auto justify-start py-3">
              <Link href="/register-patient"><UserRoundPlus className="mr-3 size-5" /><span className="text-left"><span className="block">Registration</span><span className="block text-xs font-normal opacity-80">Create a new patient record</span></span></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto justify-start py-3">
              <Link href="/opd-queue"><Stethoscope className="mr-3 size-5 text-primary" /><span className="text-left"><span className="block">Open OPD queue</span><span className="block text-xs font-normal text-muted-foreground">Continue clinical consultations</span></span></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto justify-start py-3">
              <Link href="/maternity-queue"><Baby className="mr-3 size-5 text-primary" /><span className="text-left"><span className="block">Maternity care</span><span className="block text-xs font-normal text-muted-foreground">Review active maternity cases</span></span></Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
