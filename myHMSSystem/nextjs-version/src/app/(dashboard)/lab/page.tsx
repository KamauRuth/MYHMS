"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabDashboard() {
  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    inProcess: 0,
    completed: 0,
    revenue: 0,
    criticalAlerts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)

    // Get request counts by status
    const { data: requests, error: reqError } = await supabase
      .from("lab_requests")
      .select("status")

    if (reqError) {
      console.error("Failed to load requests", reqError)
    } else {
      const statusCounts = requests?.reduce((acc: any, req: any) => {
        acc[req.status] = (acc[req.status] || 0) + 1
        return acc
      }, {}) || {}

      setStats(prev => ({
        ...prev,
        totalRequests: requests?.length || 0,
        pending: statusCounts.pending || 0,
        inProcess: statusCounts.in_progress || 0,
        completed: statusCounts.completed || 0
      }))
    }

    // Get revenue (assuming cost field exists)
    const { data: revenueData, error: revError } = await supabase
      .from("lab_requests")
      .select("lab_test_master(cost)")

    if (!revError && revenueData) {
      const totalRevenue = revenueData.reduce((sum: number, req: any) => {
        return sum + (req.lab_test_master?.cost || 0)
      }, 0)
      setStats(prev => ({ ...prev, revenue: totalRevenue }))
    }

    // Get critical alerts count
    const { data: alerts, error: alertError } = await supabase
      .from("lab_critical_alerts")
      .select("id")
      .eq("acknowledged", false)

    if (!alertError) {
      setStats(prev => ({ ...prev, criticalAlerts: alerts?.length || 0 }))
    }

    setLoading(false)
  }

  if (loading) return <p className="p-6">Loading dashboard...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Laboratory Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-800">{stats.totalRequests}</div>
            <div className="text-sm text-blue-600">Total Requests</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-orange-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-800">{stats.inProcess}</div>
            <div className="text-sm text-orange-600">In Process</div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-800">${stats.revenue}</div>
            <div className="text-sm text-purple-600">Revenue</div>
          </div>
          <div className="bg-red-100 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-800">{stats.criticalAlerts}</div>
            <div className="text-sm text-red-600">Critical Alerts</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = "/lab-requests"}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                View All Requests
              </button>
              <button
                onClick={() => window.location.href = "/lab-master"}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Manage Test Catalog
              </button>
              <button
                onClick={() => window.location.href = "/lab/qc"}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Quality Control
              </button>
            </div>
          </div>

          <div className="border rounded p-4">
            <h3 className="font-semibold mb-2">Recent Activity</h3>
            <p className="text-gray-500">Activity feed coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}