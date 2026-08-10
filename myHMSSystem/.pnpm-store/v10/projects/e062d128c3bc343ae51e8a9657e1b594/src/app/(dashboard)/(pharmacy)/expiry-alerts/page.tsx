"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function ExpiryAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acknowledging, setAcknowledging] = useState<string | null>(null)

  useEffect(() => {
    loadExpiryAlerts()
    const interval = setInterval(loadExpiryAlerts, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const loadExpiryAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("expiry_alerts")
        .select(
          `
          *,
          drug_batches (
            id,
            batch_number,
            quantity_in_stock,
            expiry_date,
            received_date,
            drugs (id, drug_name, strength),
            suppliers (supplier_name)
          )
        `
        )
        .eq("acknowledged", false)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Failed to load alerts:", error)
      } else {
        setAlerts(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    setAcknowledging(alertId)
    try {
      const { error } = await supabase
        .from("expiry_alerts")
        .update({
          acknowledged: true,
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId)

      if (error) {
        console.error("Failed to acknowledge alert:", error)
        alert("Could not acknowledge alert")
      } else {
        loadExpiryAlerts()
      }
    } finally {
      setAcknowledging(null)
    }
  }

  const getAlertColor = (alertType: string) => {
    const colors: any = {
      "90_days_before": "bg-blue-50 border-l-4 border-blue-400",
      "30_days_before": "bg-orange-50 border-l-4 border-orange-400",
      expired: "bg-red-50 border-l-4 border-red-400",
      near_minimum: "bg-yellow-50 border-l-4 border-yellow-400",
    }
    return colors[alertType] || "bg-gray-50"
  }

  const getAlertBadgeColor = (alertType: string) => {
    const colors: any = {
      "90_days_before": "bg-blue-100 text-blue-800",
      "30_days_before": "bg-orange-100 text-orange-800",
      expired: "bg-red-100 text-red-800",
      near_minimum: "bg-yellow-100 text-yellow-800",
    }
    return colors[alertType] || "bg-gray-100"
  }

  const getAlertLabel = (alertType: string) => {
    const labels: any = {
      "90_days_before": "⏰ 90 Days Before Expiry",
      "30_days_before": "🔴 30 Days Before Expiry",
      expired: "❌ EXPIRED",
      near_minimum: "⚠️ Near Minimum Stock",
    }
    return labels[alertType] || alertType
  }

  const daysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-2">Drug Expiry Alerts</h1>
          <p className="text-gray-600 text-sm">
            Monitor and manage drugs approaching expiry or already expired.
          </p>
        </div>

        {/* Summary Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-b">
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-sm text-gray-600">Expired Drugs</p>
              <p className="text-2xl font-bold text-red-600">
                {alerts.filter((a) => a.alert_type === "expired").length}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded border border-orange-200">
              <p className="text-sm text-gray-600">30 Days Before Expiry</p>
              <p className="text-2xl font-bold text-orange-600">
                {alerts.filter((a) => a.alert_type === "30_days_before").length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <p className="text-sm text-gray-600">90 Days Before Expiry</p>
              <p className="text-2xl font-bold text-blue-600">
                {alerts.filter((a) => a.alert_type === "90_days_before").length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
              <p className="text-sm text-gray-600">Low Stock Alert</p>
              <p className="text-2xl font-bold text-yellow-600">
                {alerts.filter((a) => a.alert_type === "near_minimum").length}
              </p>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-2">✅ No active alerts</p>
            <p className="text-sm text-gray-400">All drugs are within normal limits</p>
          </div>
        ) : (
          <div className="divide-y">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 transition hover:bg-gray-50 ${getAlertColor(alert.alert_type)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Alert Badge */}
                    <div className="mb-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getAlertBadgeColor(alert.alert_type)}`}
                      >
                        {getAlertLabel(alert.alert_type)}
                      </span>
                    </div>

                    {/* Drug Info */}
                    <div className="mb-3">
                      <p className="text-lg font-bold text-gray-800">
                        {alert.drug_batches?.drugs?.drug_name} ({alert.drug_batches?.drugs?.strength})
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-600">Batch Number</p>
                          <p className="font-semibold text-gray-800">{alert.drug_batches?.batch_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Current Stock</p>
                          <p className="font-semibold text-gray-800">{alert.drug_batches?.quantity_in_stock}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Expiry Date</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(alert.drug_batches?.expiry_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Days Until Expiry</p>
                          <p
                            className={`font-semibold ${
                              daysUntilExpiry(alert.drug_batches?.expiry_date) < 0
                                ? "text-red-600"
                                : "text-gray-800"
                            }`}
                          >
                            {daysUntilExpiry(alert.drug_batches?.expiry_date) < 0
                              ? `${Math.abs(daysUntilExpiry(alert.drug_batches?.expiry_date))} days ago`
                              : `${daysUntilExpiry(alert.drug_batches?.expiry_date)} days`}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Supplier: {alert.drug_batches?.suppliers?.supplier_name}
                      </p>
                    </div>

                    {/* Alert Details */}
                    {alert.action_taken && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">Action Taken:</span> {alert.action_taken}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    disabled={acknowledging === alert.id}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition font-semibold whitespace-nowrap"
                  >
                    {acknowledging === alert.id ? "Acknowledging..." : "Acknowledge"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {!loading && alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-bold text-yellow-900 mb-3">⚠️ Recommendations</h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>
              ✓ <span className="font-semibold">Expired drugs:</span> Immediately remove from inventory and safely
              dispose
            </li>
            <li>
              ✓ <span className="font-semibold">30 days before expiry:</span> Consider using these batches first
              (FIFO principle)
            </li>
            <li>
              ✓ <span className="font-semibold">90 days before expiry:</span> Begin planning stock rotation and
              procurement
            </li>
            <li>
              ✓ <span className="font-semibold">Low stock:</span> Place reorder with suppliers to maintain minimum
              levels
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
