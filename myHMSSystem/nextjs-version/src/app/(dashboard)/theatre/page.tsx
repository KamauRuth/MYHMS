"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function TheatreDashboard() {
  const [stats, setStats] = useState({
    todaysSurgeries: 0,
    upcomingSurgeries: 0,
    emergencyQueue: 0,
    completedCases: 0,
    cancelledCases: 0
  })
  const [todaysCases, setTodaysCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Get today's surgeries
    const { data: todaysData, error: todaysError } = await supabase
      .from("theatre_cases")
      .select(`
        *,
        theatre_bookings (
          procedure_name,
          urgency,
          theatre_team (
            role,
            staff_name
          )
        )
      `)
      .gte("time_in", `${today}T00:00:00`)
      .lte("time_in", `${today}T23:59:59`)

    if (!todaysError && todaysData) {
      setTodaysCases(todaysData)
      setStats(prev => ({
        ...prev,
        todaysSurgeries: todaysData.length,
        completedCases: todaysData.filter(c => c.status === 'completed').length,
        cancelledCases: todaysData.filter(c => c.status === 'cancelled').length
      }))
    }

    // Get upcoming surgeries (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const { data: upcomingData, error: upcomingError } = await supabase
      .from("theatre_bookings")
      .select("*")
      .gte("preferred_date", today)
      .lte("preferred_date", nextWeek.toISOString().split('T')[0])
      .eq("booking_status", "confirmed")

    if (!upcomingError && upcomingData) {
      setStats(prev => ({
        ...prev,
        upcomingSurgeries: upcomingData.length
      }))
    }

    // Get emergency queue
    const { data: emergencyData, error: emergencyError } = await supabase
      .from("theatre_bookings")
      .select("*")
      .eq("urgency", "emergency")
      .eq("booking_status", "booked")

    if (!emergencyError && emergencyData) {
      setStats(prev => ({
        ...prev,
        emergencyQueue: emergencyData.length
      }))
    }

    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_surgery': return 'bg-red-100 text-red-800'
      case 'recovery': return 'bg-yellow-100 text-yellow-800'
      case 'prepped': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const theatreModules = [
    {
      title: "Surgery Booking",
      description: "Book surgeries from OPD/IPD/Maternity/Emergency",
      icon: "📅",
      path: "/theatre/surgery-booking",
      color: "bg-blue-500"
    },
    {
      title: "Surgeon Module",
      description: "Pre-op, intra-op, and post-op documentation",
      icon: "👨‍⚕️",
      path: "/theatre/surgeon",
      color: "bg-green-500"
    },
    {
      title: "Anesthetist Module",
      description: "ASA assessment and live anesthesia charting",
      icon: "💉",
      path: "/theatre/anesthetist",
      color: "bg-purple-500"
    },
    {
      title: "Consumables Management",
      description: "Request and track theatre consumables",
      icon: "📦",
      path: "/theatre/consumables",
      color: "bg-orange-500"
    },
    {
      title: "Safety Checklist",
      description: "WHO Surgical Safety Checklist compliance",
      icon: "✅",
      path: "/theatre/safety-checklist",
      color: "bg-red-500"
    },
    {
      title: "Recovery Room",
      description: "Post-operative monitoring and discharge",
      icon: "🏥",
      path: "/theatre/recovery",
      color: "bg-indigo-500"
    },
    {
      title: "Theatre Billing",
      description: "Generate bills and track payments",
      icon: "💰",
      path: "/theatre/billing",
      color: "bg-yellow-500"
    },
    {
      title: "Doctor Commissions",
      description: "Calculate and pay doctor commissions",
      icon: "💼",
      path: "/theatre/commissions",
      color: "bg-teal-500"
    },
    {
      title: "Reports & Analytics",
      description: "Theatre utilization and performance reports",
      icon: "📊",
      path: "/theatre/reports",
      color: "bg-pink-500"
    }
  ]

  if (loading) return <div className="p-6">Loading theatre dashboard...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6">🏥 LIFEPOINT HOSPITAL - Theatre Management System</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Today's Surgeries</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.todaysSurgeries}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Upcoming</h3>
            <p className="text-3xl font-bold text-green-600">{stats.upcomingSurgeries}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800">Emergency Queue</h3>
            <p className="text-3xl font-bold text-red-600">{stats.emergencyQueue}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">Completed Today</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.completedCases}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800">Cancelled Today</h3>
            <p className="text-3xl font-bold text-gray-600">{stats.cancelledCases}</p>
          </div>
        </div>

        {/* Theatre Modules Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Theatre Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {theatreModules.map((module, index) => (
              <Link key={index} href={module.path}>
                <div className={`${module.color} text-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer`}>
                  <div className="text-3xl mb-2">{module.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                  <p className="text-sm opacity-90">{module.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Cases */}
        <div className="bg-white border rounded-lg">
          <h2 className="text-xl font-semibold p-4 border-b">Today's Surgery Cases</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Case ID</th>
                  <th className="px-4 py-2 text-left">Procedure</th>
                  <th className="px-4 py-2 text-left">Surgeon</th>
                  <th className="px-4 py-2 text-left">Time In</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {todaysCases.map(case_ => (
                  <tr key={case_.id} className="border-t">
                    <td className="px-4 py-2">{case_.case_id}</td>
                    <td className="px-4 py-2">{case_.procedure_performed}</td>
                    <td className="px-4 py-2">
                      {case_.theatre_team?.find((t: any) => t.role === 'surgeon')?.staff_name || 'Not assigned'}
                    </td>
                    <td className="px-4 py-2">
                      {case_.time_in ? new Date(case_.time_in).toLocaleTimeString() : 'Not started'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(case_.status)}`}>
                        {case_.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {todaysCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No surgeries scheduled for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}