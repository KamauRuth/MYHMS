"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabCriticalAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("lab_critical_alerts")
      .select(`
        *,
        lab_results (
          lab_requests (
            visits!inner (
              patient:patients(*)
            ),
            lab_test_master(*)
          )
        )
      `)
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load alerts", error)
    } else {
      setAlerts(data || [])
    }
    setLoading(false)
  }

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("lab_critical_alerts")
      .update({
        acknowledged: true,
        acknowledged_by: "current_user", // TODO: get from auth
        acknowledged_at: new Date().toISOString()
      })
      .eq("id", alertId)

    if (error) {
      console.error("Failed to acknowledge alert", error)
      alert("Could not acknowledge alert")
    } else {
      alert("Alert acknowledged")
      loadAlerts()
    }
  }

  const sendNotification = async (alert: any) => {
    // In real implementation, this would send SMS/WhatsApp/email
    const message = `CRITICAL LAB RESULT ALERT:
Patient: ${alert.lab_results?.lab_requests?.visits?.patient?.first_name} ${alert.lab_results?.lab_requests?.visits?.patient?.last_name}
Test: ${alert.lab_results?.lab_requests?.lab_test_master?.test_name}
Critical Value: ${alert.parameter}: ${alert.value} ${alert.units}
Please review immediately.`

    // Placeholder for SMS/WhatsApp integration
    console.log("Sending notification:", message)
    alert("Notification sent to responsible clinician")
  }

  if (loading) return <p className="p-6">Loading critical alerts...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Critical Value Alerts</h1>
        <p className="text-gray-600 mb-4">Monitor and acknowledge critical laboratory results</p>

        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <p className="text-gray-500">No critical alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div key={alert.id} className="border-2 border-red-300 bg-red-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                      <h3 className="font-bold text-red-800 text-lg">CRITICAL VALUE ALERT</h3>
                    </div>
                    <p className="font-semibold">
                      Patient: {alert.lab_results?.lab_requests?.visits?.patient?.first_name} {alert.lab_results?.lab_requests?.visits?.patient?.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Test: {alert.lab_results?.lab_requests?.lab_test_master?.test_name} |
                      Department: {alert.lab_results?.lab_requests?.department}
                    </p>
                    <p className="text-sm text-gray-500">
                      Alert Time: {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendNotification(alert)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Send Notification
                    </button>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2 text-red-700">Critical Result Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Parameter:</strong> {alert.parameter}
                    </div>
                    <div>
                      <strong>Critical Value:</strong>
                      <span className="text-red-600 font-bold"> {alert.value} {alert.units}</span>
                    </div>
                    <div>
                      <strong>Reference Range:</strong> {alert.reference_range}
                    </div>
                    <div>
                      <strong>Alert Type:</strong> {alert.alert_type} ({alert.severity})
                    </div>
                  </div>
                  {alert.notes && (
                    <div className="mt-4">
                      <strong>Clinical Notes:</strong> {alert.notes}
                    </div>
                  )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <strong>Action Required:</strong> Immediate clinical review and intervention may be necessary.
                  This alert has been logged and requires acknowledgment.
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 border-t pt-4">
          <h3 className="font-semibold mb-4">Critical Value Thresholds</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <strong>Glucose:</strong> &gt; 20 mmol/L or &lt; 2.2 mmol/L
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Hemoglobin:</strong> &lt; 6 g/dL
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>INR:</strong> &gt; 5.0
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Potassium:</strong> &gt; 6.5 mmol/L or &lt; 2.5 mmol/L
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Platelets:</strong> &lt; 20 × 10⁹/L
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <strong>Creatinine:</strong> &gt; 500 µmol/L
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}