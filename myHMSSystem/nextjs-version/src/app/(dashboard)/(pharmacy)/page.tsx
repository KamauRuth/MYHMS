"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function PharmacyDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    lowStockDrugs: 0,
    expiringDrugs: 0,
    todayDispensed: 0,
    todayRevenue: 0,
    departmentRequests: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        // Get pending prescriptions
        const { data: pendingPrescriptions, error: e1 } = await supabase
          .from("prescriptions")
          .select("id")
          .eq("status", "pending")

        // Get low stock drugs
        const { data: lowStockDrugs, error: e2 } = await supabase
          .from("drug_batches")
          .select("id")
          .lt("quantity_in_stock", "reorder_level")

        // Get drugs expiring within 30 days
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const { data: expiringDrugs, error: e3 } = await supabase
          .from("drug_batches")
          .select("id")
          .lt("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
          .gt("expiry_date", now.toISOString().split("T")[0])

        // Get today's dispensed items count
        const { data: todayDispensed, error: e4 } = await supabase
          .from("pharmacy_dispensing")
          .select("id, selling_price_total")
          .gte("dispensed_at", startOfDay.toISOString())

        // Get pending department requests
        const { data: deptRequests, error: e5 } = await supabase
          .from("department_stock_requests")
          .select("id")
          .eq("status", "pending")

        const todayRevenue =
          todayDispensed?.reduce((sum, item) => sum + (item.selling_price_total || 0), 0) || 0

        setStats({
          pendingPrescriptions: pendingPrescriptions?.length || 0,
          lowStockDrugs: lowStockDrugs?.length || 0,
          expiringDrugs: expiringDrugs?.length || 0,
          todayDispensed: todayDispensed?.length || 0,
          todayRevenue: todayRevenue,
          departmentRequests: deptRequests?.length || 0,
        })
      } catch (error) {
        console.error("Error loading statistics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStatistics()
    const interval = setInterval(loadStatistics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const StatCard = ({ title, value, color, href }: any) => (
    <Link href={href} className="block">
      <div className={`bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer border-l-4 ${color}`}>
        <p className="text-gray-600 text-sm mb-2">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{loading ? "..." : value}</p>
      </div>
    </Link>
  )

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pharmacy Module</h1>
          <p className="text-gray-600">LIFEPOINT HOSPITAL - Central Drug & Stock Management</p>
        </div>
        <Link
          href="/pharmacy/stock-in"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          + Add Stock
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Pending Prescriptions"
          value={stats.pendingPrescriptions}
          color="border-blue-500"
          href="/pharmacy/prescriptions"
        />
        <StatCard
          title="Low Stock Drugs"
          value={stats.lowStockDrugs}
          color="border-orange-500"
          href="/pharmacy/stock-levels"
        />
        <StatCard
          title="Expiring Soon (30 days)"
          value={stats.expiringDrugs}
          color="border-red-500"
          href="/pharmacy/expiry-alerts"
        />
        <StatCard
          title="Dispensed Today"
          value={stats.todayDispensed}
          color="border-green-500"
          href="/pharmacy/dispensing"
        />
        <StatCard
          title="Today's Revenue"
          value={`KES ${(stats.todayRevenue || 0).toLocaleString()}`}
          color="border-green-600"
          href="/pharmacy/reports"
        />
        <StatCard
          title="Pending Dept. Requests"
          value={stats.departmentRequests}
          color="border-purple-500"
          href="/pharmacy/department-requests"
        />
      </div>

      {/* Main Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Stock Management",
            description: "Add new stock, manage batches",
            icon: "📦",
            href: "/pharmacy/stock-in",
          },
          {
            title: "Prescriptions",
            description: "View & dispense prescriptions",
            icon: "💊",
            href: "/pharmacy/prescriptions",
          },
          {
            title: "Dispensing",
            description: "Record dispensed medications",
            icon: "🏥",
            href: "/pharmacy/dispensing",
          },
          {
            title: "Department Requests",
            description: "Manage dept. stock requests",
            icon: "🏛️",
            href: "/pharmacy/department-requests",
          },
          {
            title: "Suppliers",
            description: "Manage suppliers & orders",
            icon: "🚚",
            href: "/pharmacy/suppliers",
          },
          {
            title: "Stock Levels",
            description: "View current inventory",
            icon: "📊",
            href: "/pharmacy/stock-levels",
          },
          {
            title: "Expiry Alerts",
            description: "Monitor expiring drugs",
            icon: "⏰",
            href: "/pharmacy/expiry-alerts",
          },
          {
            title: "Reports",
            description: "Generate analytics & reports",
            icon: "📈",
            href: "/pharmacy/reports",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-blue-50 border border-blue-200 p-4 rounded text-left hover:bg-blue-100 transition">
            <p className="font-semibold text-blue-900">Create Purchase Order</p>
            <p className="text-sm text-blue-700">Order drugs from suppliers</p>
          </button>
          <button className="bg-green-50 border border-green-200 p-4 rounded text-left hover:bg-green-100 transition">
            <p className="font-semibold text-green-900">Physical Stock Count</p>
            <p className="text-sm text-green-700">Reconcile inventory</p>
          </button>
          <button className="bg-purple-50 border border-purple-200 p-4 rounded text-left hover:bg-purple-100 transition">
            <p className="font-semibold text-purple-900">View Audit Log</p>
            <p className="text-sm text-purple-700">All pharmacy transactions</p>
          </button>
          <button className="bg-orange-50 border border-orange-200 p-4 rounded text-left hover:bg-orange-100 transition">
            <p className="font-semibold text-orange-900">Supplier Payables</p>
            <p className="text-sm text-orange-700">Outstanding payments</p>
          </button>
        </div>
      </div>
    </div>
  )
}
