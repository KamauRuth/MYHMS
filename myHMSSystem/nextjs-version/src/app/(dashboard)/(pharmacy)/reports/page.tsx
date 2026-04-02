"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function ReportsPage() {
  const [dailyStats, setDailyStats] = useState({
    revenue: 0,
    itemsDispensed: 0,
    totalProfit: 0,
    costOfGoods: 0,
  })
  const [monthlyStats, setMonthlyStats] = useState({
    revenue: 0,
    itemsDispensed: 0,
    topDrugs: [] as any[],
    topRecipes: [] as any[],
  })
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("today")

  useEffect(() => {
    loadReportData()
  }, [timeframe])

  const loadReportData = async () => {
    setLoading(true)
    try {
      let startDate: string

      if (timeframe === "today") {
        startDate = new Date().toISOString().split("T")[0]
      } else if (timeframe === "this_week") {
        const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate = weekAgo.toISOString().split("T")[0]
      } else {
        const monthAgo = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
        startDate = monthAgo.toISOString().split("T")[0]
      }

      // Get dispensing data
      const { data: dispensing, error: dispensingError } = await supabase
        .from("pharmacy_dispensing")
        .select("*")
        .gte("dispensed_at", startDate)

      if (dispensing) {
        const revenue = dispensing.reduce((sum, item) => sum + (item.selling_price_total || 0), 0)
        const profit = dispensing.reduce((sum, item) => sum + (item.profit || 0), 0)
        const cost = dispensing.reduce((sum, item) => sum + (item.cost_price_total || 0), 0)

        setDailyStats({
          revenue,
          itemsDispensed: dispensing.length,
          totalProfit: profit,
          costOfGoods: cost,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const profitMargin = dailyStats.revenue > 0 ? ((dailyStats.totalProfit / dailyStats.revenue) * 100).toFixed(1) : 0

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-4">Pharmacy Reports & Analytics</h1>

          {/* Timeframe Filter */}
          <div className="flex gap-2">
            {["today", "this_week", "this_month"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded transition ${
                  timeframe === tf
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tf === "today" ? "Today" : tf === "this_week" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading reports...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              <div className="bg-blue-50 p-6 rounded border border-blue-200">
                <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-blue-600">
                  KES {(dailyStats.revenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded border border-green-200">
                <p className="text-gray-600 text-sm mb-2">Total Profit</p>
                <p className="text-3xl font-bold text-green-600">
                  KES {(dailyStats.totalProfit || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded border border-purple-200">
                <p className="text-gray-600 text-sm mb-2">Items Dispensed</p>
                <p className="text-3xl font-bold text-purple-600">{dailyStats.itemsDispensed}</p>
              </div>
              <div className="bg-orange-50 p-6 rounded border border-orange-200">
                <p className="text-gray-600 text-sm mb-2">Profit Margin</p>
                <p className="text-3xl font-bold text-orange-600">{profitMargin}%</p>
              </div>
            </div>

            {/* Financial Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Cost Breakdown */}
              <div className="border rounded p-6">
                <h3 className="font-bold text-lg mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700">Cost of Goods Sold</p>
                    <p className="font-semibold">KES {(dailyStats.costOfGoods || 0).toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700">Gross Profit</p>
                    <p className="font-semibold text-green-600">
                      KES {(dailyStats.totalProfit || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-900 font-bold">Total Revenue</p>
                      <p className="font-bold text-lg">KES {(dailyStats.revenue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="border rounded p-6 bg-blue-50">
                <h3 className="font-bold text-lg mb-4">📊 Key Insights</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    ✓ Average transaction value: KES{" "}
                    {dailyStats.itemsDispensed > 0
                      ? ((dailyStats.revenue || 0) / dailyStats.itemsDispensed).toLocaleString()
                      : 0}
                  </p>
                  <p>
                    ✓ Profit per transaction: KES{" "}
                    {dailyStats.itemsDispensed > 0
                      ? ((dailyStats.totalProfit || 0) / dailyStats.itemsDispensed).toLocaleString()
                      : 0}
                  </p>
                  <p>✓ Pharmacy is generating {profitMargin}% profit margin on sales</p>
                  <p className="mt-3 font-semibold text-blue-900">
                    💡 Focus on high-margin drugs to improve profitability
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Reports */}
            <div className="p-6 border-t">
              <h3 className="font-bold text-lg mb-4">Quick Report Downloads</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: "Daily Dispensing", icon: "📋" },
                  { title: "Profit Analysis", icon: "📈" },
                  { title: "Expiry Report", icon: "⏰" },
                  { title: "Low Stock Alert", icon: "⚠️" },
                  { title: "Supplier Payable", icon: "💳" },
                  { title: "Department Usage", icon: "🏥" },
                ].map((report) => (
                  <button
                    key={report.title}
                    className="border rounded p-4 hover:bg-gray-50 transition text-left"
                  >
                    <p className="text-2xl mb-2">{report.icon}</p>
                    <p className="font-semibold text-gray-800">{report.title}</p>
                    <p className="text-xs text-gray-500">Download as PDF/Excel</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
