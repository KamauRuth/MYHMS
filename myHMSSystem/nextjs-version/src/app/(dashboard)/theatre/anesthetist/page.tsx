"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface AnesthesiaRecord {
  id?: string
  case_id: string
  asa_classification?: string
  airway_assessment?: string
  allergies?: string
  risk_factors?: string
  anesthesia_type?: string
  induction_time?: string
  emergence_time?: string
}

interface AnesthesiaChart {
  id?: string
  case_id: string
  recorded_time: string
  blood_pressure?: string
  pulse?: number
  oxygen_saturation?: number
  temperature?: number
  respiratory_rate?: number
  drugs_administered?: any[]
  iv_fluids?: any[]
  notes?: string
  emergency_flag?: boolean
}

export default function AnesthetistModule() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'assessment' | 'chart'>('assessment')
  const [assessment, setAssessment] = useState<AnesthesiaRecord>({
    case_id: ''
  })
  const [chartEntries, setChartEntries] = useState<AnesthesiaChart[]>([])
  const [currentChart, setCurrentChart] = useState<AnesthesiaChart>({
    case_id: '',
    recorded_time: new Date().toISOString()
  })
  const [loading, setLoading] = useState(true)
  const [autoChartInterval, setAutoChartInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadAnesthetistCases()
    return () => {
      if (autoChartInterval) clearInterval(autoChartInterval)
    }
  }, [])

  const loadAnesthetistCases = async () => {
    setLoading(true)
    // Load cases where current user is the anesthetist
    const { data, error } = await supabase
      .from("theatre_cases")
      .select(`
        *,
        theatre_bookings (
          procedure_name,
          urgency,
          preferred_date
        ),
        anesthetist:staff!anesthetist_id (
          first_name,
          last_name,
          specialty
        )
      `)
      .eq("anesthetist_id", "current_user") // TODO: get from auth
      .in("status", ["prepped", "in_surgery", "recovery", "completed"])
      .order("time_in", { ascending: false })

    if (error) {
      console.error("Failed to load cases", error)
    } else {
      setCases(data || [])
    }
    setLoading(false)
  }

  const loadAssessment = async (caseId: string) => {
    const { data, error } = await supabase
      .from("anesthesia_records")
      .select("*")
      .eq("case_id", caseId)
      .single()

    if (!error && data) {
      setAssessment(data)
    } else {
      setAssessment({ case_id: caseId })
    }
  }

  const loadChartEntries = async (caseId: string) => {
    const { data, error } = await supabase
      .from("anesthesia_chart")
      .select("*")
      .eq("case_id", caseId)
      .order("recorded_time", { ascending: false })

    if (!error && data) {
      setChartEntries(data)
    }
  }

  const saveAssessment = async () => {
    setLoading(true)
    try {
      const assessmentData = {
        ...assessment,
        created_by: 'current_user' // TODO: get from auth
      }

      const { error } = await supabase
        .from("anesthesia_records")
        .upsert([assessmentData])

      if (error) throw error

      alert('Pre-anesthesia assessment saved successfully!')
    } catch (error) {
      console.error('Error saving assessment:', error)
      alert('Failed to save assessment')
    } finally {
      setLoading(false)
    }
  }

  const saveChartEntry = async () => {
    setLoading(true)
    try {
      const chartData = {
        ...currentChart,
        recorded_by: 'current_user' // TODO: get from auth
      }

      const { error } = await supabase
        .from("anesthesia_chart")
        .insert([chartData])

      if (error) throw error

      // Reload chart entries
      loadChartEntries(selectedCase.id)

      // Reset current chart
      setCurrentChart({
        case_id: selectedCase.id,
        recorded_time: new Date().toISOString()
      })

      alert('Chart entry saved successfully!')
    } catch (error) {
      console.error('Error saving chart entry:', error)
      alert('Failed to save chart entry')
    } finally {
      setLoading(false)
    }
  }

  const startAutoChart = () => {
    const interval = setInterval(() => {
      // Auto-save current entry and create new one
      if (currentChart.blood_pressure || currentChart.pulse || currentChart.oxygen_saturation) {
        saveChartEntry()
      }
    }, 5 * 60 * 1000) // Every 5 minutes

    setAutoChartInterval(interval)
    alert('Auto-charting started (every 5 minutes)')
  }

  const stopAutoChart = () => {
    if (autoChartInterval) {
      clearInterval(autoChartInterval)
      setAutoChartInterval(null)
      alert('Auto-charting stopped')
    }
  }

  const asaClassifications = [
    { value: 'ASA1', label: 'ASA 1 - Normal healthy patient' },
    { value: 'ASA2', label: 'ASA 2 - Patient with mild systemic disease' },
    { value: 'ASA3', label: 'ASA 3 - Patient with severe systemic disease' },
    { value: 'ASA4', label: 'ASA 4 - Patient with severe systemic disease that is a constant threat to life' },
    { value: 'ASA5', label: 'ASA 5 - Moribund patient who is not expected to survive without the operation' },
    { value: 'ASA6', label: 'ASA 6 - Brain-dead patient whose organs are being removed for donor purposes' }
  ]

  const renderAssessment = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">ASA Classification</label>
          <select
            value={assessment.asa_classification || ''}
            onChange={(e) => setAssessment({...assessment, asa_classification: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select ASA Class</option>
            {asaClassifications.map(asa => (
              <option key={asa.value} value={asa.value}>{asa.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Airway Assessment</label>
          <select
            value={assessment.airway_assessment || ''}
            onChange={(e) => setAssessment({...assessment, airway_assessment: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Assessment</option>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Difficult">Difficult</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Allergies</label>
          <textarea
            value={assessment.allergies || ''}
            onChange={(e) => setAssessment({...assessment, allergies: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Drug allergies, latex allergy, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Risk Factors</label>
          <textarea
            value={assessment.risk_factors || ''}
            onChange={(e) => setAssessment({...assessment, risk_factors: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Cardiac, respiratory, renal risks, etc."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Anesthesia Type</label>
          <select
            value={assessment.anesthesia_type || ''}
            onChange={(e) => setAssessment({...assessment, anesthesia_type: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Type</option>
            <option value="General">General Anesthesia</option>
            <option value="Spinal">Spinal Anesthesia</option>
            <option value="Epidural">Epidural Anesthesia</option>
            <option value="Local">Local Anesthesia</option>
            <option value="Sedation">Conscious Sedation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Induction Time</label>
          <input
            type="datetime-local"
            value={assessment.induction_time ? new Date(assessment.induction_time).toISOString().slice(0, 16) : ''}
            onChange={(e) => setAssessment({...assessment, induction_time: e.target.value})}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Emergence Time</label>
          <input
            type="datetime-local"
            value={assessment.emergence_time ? new Date(assessment.emergence_time).toISOString().slice(0, 16) : ''}
            onChange={(e) => setAssessment({...assessment, emergence_time: e.target.value})}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
    </div>
  )

  const renderChart = () => (
    <div className="space-y-6">
      {/* Auto-chart Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Live Anesthesia Chart</h3>
        <div className="flex gap-2">
          {!autoChartInterval ? (
            <button
              onClick={startAutoChart}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Start Auto-Chart (5min)
            </button>
          ) : (
            <button
              onClick={stopAutoChart}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Stop Auto-Chart
            </button>
          )}
        </div>
      </div>

      {/* Current Entry Form */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold mb-4">New Chart Entry</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Time</label>
            <input
              type="datetime-local"
              value={currentChart.recorded_time.slice(0, 16)}
              onChange={(e) => setCurrentChart({...currentChart, recorded_time: e.target.value})}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">BP (mmHg)</label>
            <input
              type="text"
              value={currentChart.blood_pressure || ''}
              onChange={(e) => setCurrentChart({...currentChart, blood_pressure: e.target.value})}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="120/80"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pulse (bpm)</label>
            <input
              type="number"
              value={currentChart.pulse || ''}
              onChange={(e) => setCurrentChart({...currentChart, pulse: parseInt(e.target.value)})}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SpO2 (%)</label>
            <input
              type="number"
              value={currentChart.oxygen_saturation || ''}
              onChange={(e) => setCurrentChart({...currentChart, oxygen_saturation: parseInt(e.target.value)})}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              value={currentChart.temperature || ''}
              onChange={(e) => setCurrentChart({...currentChart, temperature: parseFloat(e.target.value)})}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">RR (breaths/min)</label>
            <input
              type="number"
              value={currentChart.respiratory_rate || ''}
              onChange={(e) => setCurrentChart({...currentChart, respiratory_rate: parseInt(e.target.value)})}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input
              type="text"
              value={currentChart.notes || ''}
              onChange={(e) => setCurrentChart({...currentChart, notes: e.target.value})}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Any observations..."
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentChart.emergency_flag || false}
              onChange={(e) => setCurrentChart({...currentChart, emergency_flag: e.target.checked})}
              className="mr-2"
            />
            Emergency Flag
          </label>

          <button
            onClick={saveChartEntry}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Chart History */}
      <div className="bg-white border rounded-lg">
        <h4 className="font-semibold p-4 border-b">Chart History</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">BP</th>
                <th className="px-4 py-2 text-left">Pulse</th>
                <th className="px-4 py-2 text-left">SpO2</th>
                <th className="px-4 py-2 text-left">Temp</th>
                <th className="px-4 py-2 text-left">RR</th>
                <th className="px-4 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {chartEntries.map(entry => (
                <tr key={entry.id} className="border-t">
                  <td className="px-4 py-2">{new Date(entry.recorded_time).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">{entry.blood_pressure || '-'}</td>
                  <td className="px-4 py-2">{entry.pulse || '-'}</td>
                  <td className="px-4 py-2">{entry.oxygen_saturation || '-'}</td>
                  <td className="px-4 py-2">{entry.temperature || '-'}</td>
                  <td className="px-4 py-2">{entry.respiratory_rate || '-'}</td>
                  <td className="px-4 py-2">{entry.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  if (loading && !selectedCase) return <div className="p-6">Loading anesthetist cases...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">💉 Anesthetist Module - LIFEPOINT HOSPITAL</h1>

        {!selectedCase ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Anesthesia Cases</h2>
            <div className="space-y-4">
              {cases.map(case_ => (
                <div key={case_.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{case_.procedure_performed}</h3>
                      <p className="text-sm text-gray-600">
                        Case ID: {case_.case_id} | Status: {case_.status.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Date: {case_.time_in ? new Date(case_.time_in).toLocaleDateString() : 'Not scheduled'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCase(case_)
                        loadAssessment(case_.id)
                        loadChartEntries(case_.id)
                        setCurrentChart({
                          case_id: case_.id,
                          recorded_time: new Date().toISOString()
                        })
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Open Case
                    </button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <p className="text-center text-gray-500 py-8">No anesthesia cases assigned</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">{selectedCase.procedure_performed}</h2>
                <p className="text-gray-600">Case ID: {selectedCase.case_id}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to Cases
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('assessment')}
                className={`px-4 py-2 rounded-t-lg ${
                  activeTab === 'assessment'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Pre-Anesthesia Assessment
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-4 py-2 rounded-t-lg ${
                  activeTab === 'chart'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Anesthesia Chart
              </button>
            </div>

            {/* Content */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {activeTab === 'assessment' && renderAssessment()}
              {activeTab === 'chart' && renderChart()}

              {activeTab === 'assessment' && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={saveAssessment}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Assessment'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}