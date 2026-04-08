'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function AdminDashboard() {
  const [expanded, setExpanded] = useState<string | null>(null)

  const adminModules = [
    {
      id: 'master-data',
      title: '📊 Master Data Management',
      description: 'Configure system master data and settings',
      items: [
        {
          name: 'Dental Procedures',
          description: 'Add, edit, and manage dental procedures',
          href: '/admin/dental-procedures',
          icon: '🦷'
        }
      ]
    },
    {
      id: 'billing',
      title: '💰 Billing Management',
      description: 'Manage invoices and payments',
      items: [
        {
          name: 'View All Invoices',
          description: 'View all patient invoices',
          href: '/billing/all-invoices',
          icon: '📄'
        },
        {
          name: 'Unpaid Invoices',
          description: 'Follow up on unpaid invoices',
          href: '/billing/unpaid-patients',
          icon: '⚠️'
        },
        {
          name: 'Paid Invoices',
          description: 'View successfully collected payments',
          href: '/billing/paid-patients',
          icon: '✅'
        }
      ]
    },
    {
      id: 'users',
      title: '👥 User Management',
      description: 'Manage system users and roles',
      items: [
        {
          name: 'Create Test Users',
          description: 'Create bulk test users',
          href: '/admin/create-users',
          icon: '🔧'
        }
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage system configuration, master data, and users</p>
      </div>

      {/* Modules Grid */}
      <div className="space-y-6">
        {adminModules.map(module => (
          <div
            key={module.id}
            className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            {/* Module Header */}
            <button
              onClick={() => setExpanded(expanded === module.id ? null : module.id)}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition flex justify-between items-center text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-800">{module.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
              </div>
              <span className={`text-2xl transition-transform ${expanded === module.id ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Module Items */}
            {expanded === module.id && (
              <div className="p-6 space-y-3 bg-white">
                {module.items.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition flex items-center gap-2">
                          {item.icon} {item.name}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <span className="text-2xl text-gray-300 group-hover:text-blue-400 transition">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">⚙️</div>
          <h3 className="font-semibold mt-2">Master Data</h3>
          <p className="text-blue-100 text-sm mt-1">Configure system procedures and pricing</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">💰</div>
          <h3 className="font-semibold mt-2">Billing</h3>
          <p className="text-green-100 text-sm mt-1">Track invoices and payments</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="text-3xl font-bold">👤</div>
          <h3 className="font-semibold mt-2">Users</h3>
          <p className="text-purple-100 text-sm mt-1">Manage roles and permissions</p>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 Getting Started</h3>
        <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
          <li><strong>Add Dental Procedures:</strong> Go to Master Data → Dental Procedures to add available procedures</li>
          <li><strong>Procedure Pricing:</strong> Each procedure has a fixed price set here, automatically used in billing</li>
          <li><strong>Track Billing:</strong> All invoices automatically appear in the Billing section when procedures are recorded</li>
        </ol>
      </div>
    </div>
  )
}
