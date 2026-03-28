"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface RecoveryRecord {
  id?: string
  case_id: string
  patient_id: string
  recovery_nurse: string
  time_in_recovery: string
  time_out_recovery?: string
  vital_signs: {
    time: string
    bp: string
    hr: string
    rr: string
    temp: string
    spo2: string
    pain_score: number
    consciousness: string
  }[]
  complications: string[]
  medications_given: {
    time: string
    medication: string
    dose: string
    route: string
  }[]
  fluids_intake: {
    time: string
    type: string
    amount: string
  }[]
  urine_output: {
    time: string
    amount: string
  }[]
  discharge_criteria: {
    stable_vitals: boolean
    pain_controlled: boolean
    no_bleeding: boolean
    able_to_drink: boolean
    oriented: boolean
  }
  discharge_time?: string
  discharge_to: string
  notes: string
}

export default function RecoveryModule() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [recoveryRecord, setRecoveryRecord] = useState<RecoveryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'vitals' | 'medications' | 'fluids' | 'discharge'>('vitals')

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    setLoading(true)
    // Load cases that are in recovery or completed today
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from("theatre_cases")
      .select(`
        *,
        theatre_bookings (
          procedure_name,
          patient_id
        )
      `)
      .in("status", ["recovery", "completed"])
      .gte("time_in", `${today}T00:00:00`)
      .order("time_in", { ascending: false })

    if (error) {
      console.error("Failed to load cases", error)
    } else {
      setCases(data || [])
    }
    setLoading(false)
  }

  const loadRecoveryRecord = async (caseId: string) => {
    const { data, error } = await supabase
      .from("theatre_recovery")
      .select("*")
      .eq("case_id", caseId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found error
      console.error("Failed to load recovery record", error)
      return
    }

    if (data) {
      setRecoveryRecord(data)
    } else {
      // Create new recovery record
      const newRecord: RecoveryRecord = {
        case_id: caseId,
        patient_id: selectedCase.theatre_bookings.patient_id,
        recovery_nurse: 'current_user', // TODO: get from auth
        time_in_recovery: new Date().toISOString(),
        vital_signs: [],
        complications: [],
        medications_given: [],
        fluids_intake: [],
        urine_output: [],
        discharge_criteria: {
          stable_vitals: false,
          pain_controlled: false,
          no_bleeding: false,
          able_to_drink: false,
          oriented: false
        },
        discharge_to: '',
        notes: ''
      }
      setRecoveryRecord(newRecord)
    }
  }

  const saveRecoveryRecord = async () => {
    if (!recoveryRecord) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("theatre_recovery")
        .upsert(recoveryRecord, { onConflict: 'case_id' })

      if (error) throw error

      alert('Recovery record saved successfully')
    } catch (error) {
      console.error('Error saving recovery record:', error)
      alert('Failed to save recovery record')
    } finally {
      setLoading(false)
    }
  }

  const addVitalSign = () => {
    if (!recoveryRecord) return

    const newVital = {
      time: new Date().toLocaleTimeString(),
      bp: '',
      hr: '',
      rr: '',
      temp: '',
      spo2: '',
      pain_score: 0,
      consciousness: 'Alert'
    }

    setRecoveryRecord({
      ...recoveryRecord,
      vital_signs: [...recoveryRecord.vital_signs, newVital]
    })
  }

  const updateVitalSign = (index: number, field: string, value: any) => {
    if (!recoveryRecord) return

    const updatedVitals = [...recoveryRecord.vital_signs]
    updatedVitals[index] = { ...updatedVitals[index], [field]: value }

    setRecoveryRecord({
      ...recoveryRecord,
      vital_signs: updatedVitals
    })
  }

  const addMedication = () => {
    if (!recoveryRecord) return

    const newMed = {
      time: new Date().toLocaleTimeString(),
      medication: '',
      dose: '',
      route: 'IV'
    }

    setRecoveryRecord({
      ...recoveryRecord,
      medications_given: [...recoveryRecord.medications_given, newMed]
    })
  }

  const updateMedication = (index: number, field: string, value: string) => {
    if (!recoveryRecord) return

    const updatedMeds = [...recoveryRecord.medications_given]
    updatedMeds[index] = { ...updatedMeds[index], [field]: value }

    setRecoveryRecord({
      ...recoveryRecord,
      medications_given: updatedMeds
    })
  }

  const addFluid = () => {
    if (!recoveryRecord) return

    const newFluid = {
      time: new Date().toLocaleTimeString(),
      type: '',
      amount: ''
    }

    setRecoveryRecord({
      ...recoveryRecord,
      fluids_intake: [...recoveryRecord.fluids_intake, newFluid]
    })
  }

  const updateFluid = (index: number, field: string, value: string) => {
    if (!recoveryRecord) return

    const updatedFluids = [...recoveryRecord.fluids_intake]
    updatedFluids[index] = { ...updatedFluids[index], [field]: value }

    setRecoveryRecord({
      ...recoveryRecord,
      fluids_intake: updatedFluids
    })
  }

  const addUrineOutput = () => {
    if (!recoveryRecord) return

    const newUrine = {
      time: new Date().toLocaleTimeString(),
      amount: ''
    }

    setRecoveryRecord({
      ...recoveryRecord,
      urine_output: [...recoveryRecord.urine_output, newUrine]
    })
  }

  const updateUrineOutput = (index: number, field: string, value: string) => {
    if (!recoveryRecord) return

    const updatedUrine = [...recoveryRecord.urine_output]
    updatedUrine[index] = { ...updatedUrine[index], [field]: value }

    setRecoveryRecord({
      ...recoveryRecord,
      urine_output: updatedUrine
    })
  }

  const dischargePatient = async () => {
    if (!recoveryRecord) return

    const dischargeTime = new Date().toISOString()

    setRecoveryRecord({
      ...recoveryRecord,
      discharge_time: dischargeTime,
      time_out_recovery: dischargeTime
    })

    // Update case status
    await supabase
      .from("theatre_cases")
      .update({ status: 'completed' })
      .eq("id", selectedCase.id)

    await saveRecoveryRecord()
    alert('Patient discharged from recovery')
  }

  const renderVitalsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vital Signs Monitoring</h3>
        <button
          onClick={addVitalSign}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Vital Signs
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border">Time</th>
              <th className="px-4 py-2 border">BP (mmHg)</th>
              <th className="px-4 py-2 border">HR (bpm)</th>
              <th className="px-4 py-2 border">RR (/min)</th>
              <th className="px-4 py-2 border">Temp (°C)</th>
              <th className="px-4 py-2 border">SpO2 (%)</th>
              <th className="px-4 py-2 border">Pain Score (0-10)</th>
              <th className="px-4 py-2 border">Consciousness</th>
            </tr>
          </thead>
          <tbody>
            {recoveryRecord?.vital_signs.map((vital, index) => (
              <tr key={index}>
                <td className="px-4 py-2 border">{vital.time}</td>
                <td className="px-4 py-2 border">
                  <input
                    type="text"
                    value={vital.bp}
                    onChange={(e) => updateVitalSign(index, 'bp', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                    placeholder="120/80"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <input
                    type="number"
                    value={vital.hr}
                    onChange={(e) => updateVitalSign(index, 'hr', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <input
                    type="number"
                    value={vital.rr}
                    onChange={(e) => updateVitalSign(index, 'rr', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <input
                    type="number"
                    step="0.1"
                    value={vital.temp}
                    onChange={(e) => updateVitalSign(index, 'temp', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <input
                    type="number"
                    value={vital.spo2}
                    onChange={(e) => updateVitalSign(index, 'spo2', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={vital.pain_score}
                    onChange={(e) => updateVitalSign(index, 'pain_score', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </td>
                <td className="px-4 py-2 border">
                  <select
                    value={vital.consciousness}
                    onChange={(e) => updateVitalSign(index, 'consciousness', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="Alert">Alert</option>
                    <option value="Drowsy">Drowsy</option>
                    <option value="Confused">Confused</option>
                    <option value="Unresponsive">Unresponsive</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMedicationsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Medications Administered</h3>
        <button
          onClick={addMedication}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Medication
        </button>
      </div>

      <div className="space-y-4">
        {recoveryRecord?.medications_given.map((med, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="text"
                  value={med.time}
                  onChange={(e) => updateMedication(index, 'time', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Medication</label>
                <input
                  type="text"
                  value={med.medication}
                  onChange={(e) => updateMedication(index, 'medication', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Morphine"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dose</label>
                <input
                  type="text"
                  value={med.dose}
                  onChange={(e) => updateMedication(index, 'dose', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., 5mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Route</label>
                <select
                  value={med.route}
                  onChange={(e) => updateMedication(index, 'route', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="IV">IV</option>
                  <option value="IM">IM</option>
                  <option value="PO">PO</option>
                  <option value="SC">SC</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderFluidsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fluids & Urine Output</h3>
        <div className="space-x-2">
          <button
            onClick={addFluid}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Fluid Intake
          </button>
          <button
            onClick={addUrineOutput}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Add Urine Output
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-4">Fluids Intake</h4>
          <div className="space-y-4">
            {recoveryRecord?.fluids_intake.map((fluid, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input
                      type="text"
                      value={fluid.time}
                      onChange={(e) => updateFluid(index, 'time', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <input
                      type="text"
                      value={fluid.type}
                      onChange={(e) => updateFluid(index, 'type', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., Normal Saline"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (ml)</label>
                    <input
                      type="number"
                      value={fluid.amount}
                      onChange={(e) => updateFluid(index, 'amount', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">Urine Output</h4>
          <div className="space-y-4">
            {recoveryRecord?.urine_output.map((urine, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input
                      type="text"
                      value={urine.time}
                      onChange={(e) => updateUrineOutput(index, 'time', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (ml)</label>
                    <input
                      type="number"
                      value={urine.amount}
                      onChange={(e) => updateUrineOutput(index, 'amount', e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderDischargeTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Discharge from Recovery</h3>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-medium mb-4">Discharge Criteria</h4>
        <div className="space-y-3">
          {Object.entries(recoveryRecord?.discharge_criteria || {}).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setRecoveryRecord(prev => prev ? {
                  ...prev,
                  discharge_criteria: {
                    ...prev.discharge_criteria,
                    [key]: e.target.checked
                  }
                } : null)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Discharge To</label>
          <select
            value={recoveryRecord?.discharge_to || ''}
            onChange={(e) => setRecoveryRecord(prev => prev ? {
              ...prev,
              discharge_to: e.target.value
            } : null)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select destination</option>
            <option value="ward">Ward</option>
            <option value="icu">ICU</option>
            <option value="home">Home</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Additional Notes</label>
          <textarea
            value={recoveryRecord?.notes || ''}
            onChange={(e) => setRecoveryRecord(prev => prev ? {
              ...prev,
              notes: e.target.value
            } : null)}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Any additional notes about recovery..."
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={saveRecoveryRecord}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Recovery Record
        </button>

        {recoveryRecord?.discharge_criteria &&
         Object.values(recoveryRecord.discharge_criteria).every(v => v) &&
         recoveryRecord.discharge_to ? (
          <button
            onClick={dischargePatient}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Discharge Patient
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            Complete all discharge criteria and select destination to enable discharge
          </span>
        )}
      </div>
    </div>
  )

  if (loading && !selectedCase) return <div className="p-6">Loading recovery cases...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">🏥 Recovery Room Documentation - LIFEPOINT HOSPITAL</h1>

        {!selectedCase ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Case for Recovery</h2>
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
                        Time: {case_.time_in ? new Date(case_.time_in).toLocaleTimeString() : 'Not started'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCase(case_)
                        loadRecoveryRecord(case_.id)
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Start Recovery
                    </button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <p className="text-center text-gray-500 py-8">No cases in recovery or completed today</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">{selectedCase.procedure_performed}</h2>
                <p className="text-gray-600">Case ID: {selectedCase.case_id}</p>
                <p className="text-gray-500">
                  Recovery Nurse: {recoveryRecord?.recovery_nurse} |
                  Time In: {recoveryRecord?.time_in_recovery ? new Date(recoveryRecord.time_in_recovery).toLocaleString() : 'Not set'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to Cases
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 border-b">
              {[
                { key: 'vitals', label: 'Vital Signs' },
                { key: 'medications', label: 'Medications' },
                { key: 'fluids', label: 'Fluids & Urine' },
                { key: 'discharge', label: 'Discharge' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 border-b-2 ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {activeTab === 'vitals' && renderVitalsTab()}
              {activeTab === 'medications' && renderMedicationsTab()}
              {activeTab === 'fluids' && renderFluidsTab()}
              {activeTab === 'discharge' && renderDischargeTab()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}