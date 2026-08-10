'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  BedDouble,
  ClipboardList,
  HeartPulse,
  House,
  LogOut,
  Pill,
  Scissors,
} from 'lucide-react'

const navItems = [
  { href: '/ipd', label: 'Overview', description: 'Ward snapshot', icon: House },
  { href: '/ipd/admissions', label: 'Patients', description: 'Active admissions', icon: BedDouble },
  { href: '/ipd/vitals', label: 'Vitals', description: 'Observations', icon: HeartPulse },
  { href: '/ipd/medications', label: 'Medication', description: 'Orders & MAR', icon: Pill },
  { href: '/ipd/procedures', label: 'Procedures', description: 'Clinical tasks', icon: Scissors },
  { href: '/ipd/discharge', label: 'Discharge', description: 'Summary & exit', icon: LogOut },
]

export default function IPDLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                <Activity className="h-4 w-4" /> Clinical workspace
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-950">Inpatient Department</h1>
              <p className="mt-1 text-sm text-slate-600">One patient journey from admission through discharge.</p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <ClipboardList className="h-4 w-4 shrink-0" />
              Open a patient record before entering clinical care.
            </div>
          </div>

          <nav aria-label="IPD workflow" className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item, index) => {
              const active = item.href === '/ipd'
                ? pathname === '/ipd'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex min-w-[150px] items-center gap-3 rounded-xl border px-3 py-3 transition ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${active ? 'bg-white/15' : 'bg-slate-100 group-hover:bg-white'}`}>
                    {index + 1}
                  </span>
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-4 w-4" />{item.label}</span>
                    <span className={`block text-[11px] ${active ? 'text-blue-100' : 'text-slate-500'}`}>{item.description}</span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
