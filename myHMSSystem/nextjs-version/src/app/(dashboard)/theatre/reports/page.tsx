"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface ReportData {
  totalSurgeries: number
  emergencySurgeries: number
  completedSurgeries: number
  averageDuration: number
  theatreUtilization: number
  revenue: number
  topProcedures: Array<{ procedure: string; count: number; revenue: number }>
  surgeonStats: Array<{ surgeon: string; surgeries: number; revenue: number }>
  monthlyTrend: Array<{ month: string; surgeries: number; revenue: number }>
  complicationRate: number
  averageRecoveryTime: number
}

export default function TheatreReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateReport()
  }, [selectedPeriod, selectedDate])

  const generateReport = async () => {
    setLoading(true)

    try {
      // Calculate date range
      const startDate = getStartDate()
      const endDate = getEndDate()

      // Get theatre cases
      const { data: cases, error: casesError } = await supabase
        .from("theatre_cases")
        .select(`
          *,
          theatre_bookings (
            procedure_name,
            urgency,
            surgeon_id,
            anesthetist_id
          ),
          theatre_bills (
            total_amount,
            status
          )
        `)
        .gte("time_in", startDate)
        .lt("time_in", endDate)

      if (casesError) throw casesError

      // Get recovery data for complications and recovery time
      const { data: recoveryData, error: recoveryError } = await supabase
        .from("theatre_recovery")
        .select("complications, time_in_recovery, time_out_recovery")
        .in("case_id", cases?.map(c => c.case_id) || [])

      if (recoveryError) console.error("Recovery data error:", recoveryError)

      // Process data
      const processedData = processReportData(cases || [], recoveryData || [])
      setReportData(processedData)

    } catch (error) {
      console.error("Error generating report:", error)
      alert("Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = (): string => {
    const now = new Date()
    switch (selectedPeriod) {
      case 'month':
        return `${selectedDate}-01`
      case 'quarter':
        const quarterStart = new Date(selectedDate + '-01')
        quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3)
        return quarterStart.toISOString().slice(0, 10)
      case 'year':
        return `${selectedDate.slice(0, 4)}-01-01`
      default:
        return `${selectedDate}-01`
    }
  }

  const getEndDate = (): string => {
    const start = new Date(getStartDate())
    switch (selectedPeriod) {
      case 'month':
        start.setMonth(start.getMonth() + 1)
        break
      case 'quarter':
        start.setMonth(start.getMonth() + 3)
        break
      case 'year':
        start.setFullYear(start.getFullYear() + 1)
        break
    }
    return start.toISOString().slice(0, 10)
  }

  const processReportData = (cases: any[], recoveryData: any[]): ReportData => {
    const totalSurgeries = cases.length
    const emergencySurgeries = cases.filter(c => c.theatre_bookings?.urgency === 'emergency').length
    const completedSurgeries = cases.filter(c => c.status === 'completed').length

    // Average duration
    const durations = cases
      .filter(c => c.duration_minutes)
      .map(c => c.duration_minutes)
    const averageDuration = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
      : 0

    // Theatre utilization (assuming 8 hours/day, 20 days/month)
    const totalMinutes = cases.reduce((sum, c) => sum + (c.duration_minutes || 0), 0)
    const totalAvailableMinutes = selectedPeriod === 'month' ? 8 * 60 * 20 : selectedPeriod === 'quarter' ? 8 * 60 * 60 : 8 * 60 * 240
    const theatreUtilization = Math.round((totalMinutes / totalAvailableMinutes) * 100)

    // Revenue
    const revenue = cases
      .filter(c => c.theatre_bills?.[0]?.status === 'paid')
      .reduce((sum, c) => sum + (c.theatre_bills?.[0]?.total_amount || 0), 0)

    // Top procedures
    const procedureStats = cases.reduce((acc, c) => {
      const procedure = c.theatre_bookings?.procedure_name || 'Unknown'
      const billAmount = c.theatre_bills?.[0]?.total_amount || 0

      if (!acc[procedure]) {
        acc[procedure] = { count: 0, revenue: 0 }
      }
      acc[procedure].count++
      acc[procedure].revenue += billAmount
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const topProcedures = Object.entries(procedureStats)
      .map(([procedure, stats]) => ({ procedure, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Surgeon stats
    const surgeonStats = cases.reduce((acc, c) => {
      const surgeon = c.theatre_bookings?.surgeon_id || 'Unknown'
      const billAmount = c.theatre_bills?.[0]?.total_amount || 0

      if (!acc[surgeon]) {
        acc[surgeon] = { surgeries: 0, revenue: 0 }
      }
      acc[surgeon].surgeries++
      acc[surgeon].revenue += billAmount
      return acc
    }, {} as Record<string, { surgeries: number; revenue: number }>)

    const surgeonStatsArray = Object.entries(surgeonStats)
      .map(([surgeon, stats]) => ({ surgeon, ...stats }))
      .sort((a, b) => b.surgeries - a.surgeries)
      .slice(0, 5)

    // Monthly trend (simplified)
    const monthlyTrend = [
      { month: 'Current', surgeries: totalSurgeries, revenue: revenue }
    ]

    // Complication rate
    const totalComplications = recoveryData.reduce((sum, r) => sum + (r.complications?.length || 0), 0)
    const complicationRate = totalSurgeries > 0 ? Math.round((totalComplications / totalSurgeries) * 100) : 0

    // Average recovery time
    const recoveryTimes = recoveryData
      .filter(r => r.time_in_recovery && r.time_out_recovery)
      .map(r => {
        const inTime = new Date(r.time_in_recovery)
        const outTime = new Date(r.time_out_recovery)
        return (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60) // hours
      })
    const averageRecoveryTime = recoveryTimes.length > 0
      ? Math.round(recoveryTimes.reduce((sum, t) => sum + t, 0) / recoveryTimes.length)
      : 0

    return {
      totalSurgeries,
      emergencySurgeries,
      completedSurgeries,
      averageDuration,
      theatreUtilization,
      revenue,
      topProcedures,
      surgeonStats: surgeonStatsArray,
      monthlyTrend,
      complicationRate,
      averageRecoveryTime
    }
  }

  const exportReport = () => {
    if (!reportData) return

    const reportText = `
THEATRE REPORT - LIFEPOINT HOSPITAL
Period: ${selectedPeriod} - ${selectedDate}

SUMMARY STATISTICS:
- Total Surgeries: ${reportData.totalSurgeries}
- Emergency Surgeries: ${reportData.emergencySurgeries}
- Completed Surgeries: ${reportData.completedSurgeries}
- Average Duration: ${reportData.averageDuration} minutes
- Theatre Utilization: ${reportData.theatreUtilization}%
- Total Revenue: KES ${reportData.revenue.toLocaleString()}
- Complication Rate: ${reportData.complicationRate}%
- Average Recovery Time: ${reportData.averageRecoveryTime} hours

TOP PROCEDURES:
${reportData.topProcedures.map(p => `- ${p.procedure}: ${p.count} surgeries, KES ${p.revenue.toLocaleString()}`).join('\n')}

TOP SURGEONS:
${reportData.surgeonStats.map(s => `- ${s.surgeon}: ${s.surgeries} surgeries, KES ${s.revenue.toLocaleString()}`).join('\n')}
    `

    const blob = new Blob([reportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `theatre-report-${selectedPeriod}-${selectedDate}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-6">Generating theatre report...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📊 Theatre Analytics & Reports - LIFEPOINT HOSPITAL</h1>
          <button
            onClick={exportReport}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Export Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border rounded px-3 py-2"
            >
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {selectedPeriod === 'month' ? 'Month' : selectedPeriod === 'quarter' ? 'Quarter Start' : 'Year'}
            </label>
            <input
              type={selectedPeriod === 'year' ? 'number' : 'month'}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-3 py-2"
              min="2020"
              max={new Date().getFullYear().toString()}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Generate Report
            </button>
          </div>
        </div>

        {reportData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-blue-600">Total Surgeries</h3>
                <p className="text-3xl font-bold text-blue-800">{reportData.totalSurgeries}</p>
                <p className="text-sm text-blue-600">Emergency: {reportData.emergencySurgeries}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-green-600">Completion Rate</h3>
                <p className="text-3xl font-bold text-green-800">
                  {reportData.totalSurgeries > 0 ? Math.round((reportData.completedSurgeries / reportData.totalSurgeries) * 100) : 0}%
                </p>
                <p className="text-sm text-green-600">{reportData.completedSurgeries} completed</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-purple-600">Theatre Utilization</h3>
                <p className="text-3xl font-bold text-purple-800">{reportData.theatreUtilization}%</p>
                <p className="text-sm text-purple-600">Avg: {reportData.averageDuration}min</p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-yellow-600">Total Revenue</h3>
                <p className="text-3xl font-bold text-yellow-800">KES {reportData.revenue.toLocaleString()}</p>
                <p className="text-sm text-yellow-600">From completed surgeries</p>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-red-600">Complication Rate</h3>
                <p className="text-3xl font-bold text-red-800">{reportData.complicationRate}%</p>
                <p className="text-sm text-red-600">Quality indicator</p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-indigo-600">Recovery Time</h3>
                <p className="text-3xl font-bold text-indigo-800">{reportData.averageRecoveryTime}h</p>
                <p className="text-sm text-indigo-600">Average recovery duration</p>
              </div>
            </div>

            {/* Top Procedures */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Procedures</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Procedure</th>
                      <th className="text-center py-2">Count</th>
                      <th className="text-right py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProcedures.map((proc, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{proc.procedure}</td>
                        <td className="text-center py-2">{proc.count}</td>
                        <td className="text-right py-2">KES {proc.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Surgeon Performance */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Surgeon Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Surgeon</th>
                      <th className="text-center py-2">Surgeries</th>
                      <th className="text-right py-2">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.surgeonStats.map((surgeon, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{surgeon.surgeon}</td>
                        <td className="text-center py-2">{surgeon.surgeries}</td>
                        <td className="text-right py-2">KES {surgeon.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Period</th>
                      <th className="text-center py-2">Surgeries</th>
                      <th className="text-right py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyTrend.map((trend, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{trend.month}</td>
                        <td className="text-center py-2">{trend.surgeries}</td>
                        <td className="text-right py-2">KES {trend.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}