'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  ClipboardPlus,
  HeartPulse,
  LogOut,
  Pill,
  Search,
  Scissors,
  Users,
} from 'lucide-react'
import { getActiveAdmissions, getIPDStats } from '@/lib/ipd/api'
import { formatDate, getDaysInAdmission } from '@/lib/ipd/utils'
import type { AdmissionWithPatient, IPDStats } from '@/lib/ipd/types'

const careSteps = [
  { title: 'Receive admission', detail: 'Confirm patient, ward and bed', href: '/ipd/admissions', icon: ClipboardPlus, tone: 'blue' },
  { title: 'Baseline assessment', detail: 'Record observations and vitals', href: '/ipd/vitals', icon: HeartPulse, tone: 'rose' },
  { title: 'Daily treatment', detail: 'Medication orders and MAR', href: '/ipd/medications', icon: Pill, tone: 'emerald' },
  { title: 'Clinical procedures', detail: 'Schedule and document care', href: '/ipd/procedures', icon: Scissors, tone: 'violet' },
  { title: 'Discharge patient', detail: 'Summary, advice and follow-up', href: '/ipd/discharge', icon: LogOut, tone: 'amber' },
] as const

const tones = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
}

export default function IPDDashboard() {
  const [admissions, setAdmissions] = useState<AdmissionWithPatient[]>([])
  const [stats, setStats] = useState<IPDStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [admissionsData, statsData] = await Promise.all([getActiveAdmissions(), getIPDStats()])
        setAdmissions(admissionsData)
        setStats(statsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load IPD data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const visibleAdmissions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return admissions
    return admissions.filter((admission) => {
      const patientName = `${admission.patient?.first_name || ''} ${admission.patient?.last_name || ''}`.toLowerCase()
      return patientName.includes(query) || admission.ward?.toLowerCase().includes(query) || admission.patient_id.toLowerCase().includes(query)
    })
  }, [admissions, search])

  const wardCount = new Set(admissions.map((admission) => admission.ward).filter(Boolean)).size
  const longestStay = admissions.reduce((maximum, admission) => Math.max(maximum, getDaysInAdmission(admission.admitted_at)), 0)

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {error && (
        <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div><p className="font-semibold">IPD data could not be loaded</p><p>{error}</p></div>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div><h2 className="text-lg font-bold text-slate-950">Today&apos;s ward snapshot</h2><p className="text-sm text-slate-600">Items requiring attention across inpatient care.</p></div>
          <span className="text-xs text-slate-500">Live clinical overview</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Active patients', value: stats?.total_active_admissions ?? admissions.length, icon: Users, detail: 'Currently admitted', color: 'text-blue-700 bg-blue-50' },
            { label: 'Occupied wards', value: wardCount, icon: BedDouble, detail: 'With active patients', color: 'text-cyan-700 bg-cyan-50' },
            { label: 'Critical notes', value: stats?.critical_notes_count ?? 0, icon: AlertCircle, detail: 'Review immediately', color: 'text-rose-700 bg-rose-50' },
            { label: 'Urgent procedures', value: stats?.urgent_procedures_count ?? 0, icon: CalendarClock, detail: 'Pending attention', color: 'text-amber-700 bg-amber-50' },
            { label: 'Discharged today', value: stats?.total_discharges_today ?? 0, icon: CheckCircle2, detail: `Longest stay ${longestStay}d`, color: 'text-emerald-700 bg-emerald-50' },
          ].map(({ label, value, icon: Icon, detail, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-3xl font-bold text-slate-950">{loading ? '—' : value}</p></div><span className={`rounded-xl p-2.5 ${color}`}><Icon className="h-5 w-5" /></span></div>
              <p className="mt-3 text-xs text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-bold text-slate-950">IPD care flow</h2><p className="text-sm text-slate-600">Follow these stages for every admitted patient.</p></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {careSteps.map((step, index) => {
            const Icon = step.icon
            return (
              <Link key={step.title} href={step.href} className="group relative rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                <div className="flex items-center justify-between"><span className={`rounded-lg border p-2 ${tones[step.tone]}`}><Icon className="h-5 w-5" /></span><span className="text-xs font-bold text-slate-400">0{index + 1}</span></div>
                <h3 className="mt-4 font-semibold text-slate-950">{step.title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
                <span className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-700">Open stage <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div><h2 className="text-lg font-bold text-slate-950">Current inpatients</h2><p className="text-sm text-slate-600">Select a patient to open their complete care record.</p></div>
          <div className="flex w-full gap-2 md:w-auto">
            <label className="relative flex-1 md:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or ward" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
            <Link href="/ipd/admissions" className="inline-flex items-center whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">All patients</Link>
          </div>
        </div>

        {loading ? <div className="p-10 text-center text-sm text-slate-500">Loading ward list…</div> : visibleAdmissions.length === 0 ? (
          <div className="p-10 text-center"><BedDouble className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-medium text-slate-700">No active admissions found</p><p className="text-sm text-slate-500">Patients admitted from OPD will appear here.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleAdmissions.map((admission) => (
              <Link key={admission.id} href={`/ipd/admission/${admission.id}`} className="grid gap-3 p-4 transition hover:bg-blue-50/60 md:grid-cols-[minmax(220px,1.5fr)_1fr_1fr_2fr_auto] md:items-center">
                <div><p className="font-semibold text-slate-950">{admission.patient?.first_name} {admission.patient?.last_name}</p><p className="text-xs text-slate-500">{admission.patient_id}</p></div>
                <div><p className="text-xs text-slate-500">Location</p><p className="text-sm font-medium text-slate-800">{admission.ward || 'Not assigned'}</p></div>
                <div><p className="text-xs text-slate-500">Length of stay</p><p className="text-sm font-medium text-slate-800">{getDaysInAdmission(admission.admitted_at)} day(s)</p></div>
                <div className="min-w-0"><p className="text-xs text-slate-500">Admission reason · {formatDate(admission.admitted_at)}</p><p className="truncate text-sm text-slate-700">{admission.reason || 'No reason documented'}</p></div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Open <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
