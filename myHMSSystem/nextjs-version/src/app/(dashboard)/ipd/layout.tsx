'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, FileText, Calendar, LogOut, Home } from 'lucide-react'

interface IPDLayoutProps {
  children: ReactNode
}

export default function IPDLayout({ children }: IPDLayoutProps) {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.includes(path)

  const navItems = [
    { href: '/ipd', label: 'Dashboard', icon: Home },
    { href: '/ipd/admissions', label: 'Admissions', icon: Activity },
    { href: '/ipd/vitals', label: 'Vitals', icon: Activity },
    { href: '/ipd/medications', label: 'Medications', icon: FileText },
    { href: '/ipd/procedures', label: 'Procedures', icon: Calendar },
    { href: '/ipd/discharge', label: 'Discharge', icon: LogOut },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">IPD Module</h2>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href.split('/')[2])
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  active
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
