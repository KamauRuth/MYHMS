"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface SurgeryNote {
  id?: string
  case_id: string
  note_type: 'pre_op' | 'intra_op' | 'post_op'
  diagnosis?: string
  indication?: string
  consent_confirmed?: boolean
  risks_explained?: string
  pre_op_plan?: string
  procedure_details?: string
  findings?: string
  complications?: string
  closure_details?: string
  post_op_orders?: any
}

export default function SurgeonModule() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'pre_op' | 'intra_op' | 'post_op'>('pre_op')
  const [notes, setNotes] = useState<SurgeryNote>({
    case_id: '',
    note_type: 'pre_op'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSurgeonCases()
  }, [])

  const loadSurgeonCases = async () => {
    setLoading(true)
    // Load cases where current user is the surgeon
    const { data, error } = await supabase
      .from("theatre_cases")
      .select(`
        *,
        theatre_bookings (
          procedure_name,
          urgency,
          preferred_date
        ),
        surgeon:staff!surgeon_id (
          first_name,
          last_name,
          specialty
        )
      `)
      .eq("surgeon_id", "current_user") // TODO: get from auth
      .in("status", ["prepped", "in_surgery", "recovery", "completed"])
      .order("time_in", { ascending: false })

    if (error) {
      console.error("Failed to load cases", error)
    } else {
      setCases(data || [])
    }
    setLoading(false)
  }

  const loadNotes = async (caseId: string, noteType: string) => {
    const { data, error } = await supabase
      .from("surgery_notes")
      .select("*")
      .eq("case_id", caseId)
      .eq("note_type", noteType)
      .single()

    if (!error && data) {
      setNotes(data)
    } else {
      setNotes({
        case_id: caseId,
        note_type: noteType as 'pre_op' | 'intra_op' | 'post_op'
      })
    }
  }

  const saveNotes = async () => {
    setLoading(true)
    try {
      const noteData = {
        ...notes,
        created_by: 'current_user', // TODO: get from auth
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from("surgery_notes")
        .upsert([noteData])

      if (error) throw error

      alert(`${activeTab.replace('_', ' ').toUpperCase()} notes saved successfully!`)
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Failed to save notes')
    } finally {
      setLoading(false)
    }
  }

  const renderPreOpNotes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Diagnosis</label>
          <textarea
            value={notes.diagnosis || ''}
            onChange={(e) => setNotes({...notes, diagnosis: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Patient diagnosis..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Indication for Surgery</label>
          <textarea
            value={notes.indication || ''}
            onChange={(e) => setNotes({...notes, indication: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Why is surgery indicated..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Consent Confirmed</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="consent"
                checked={notes.consent_confirmed === true}
                onChange={() => setNotes({...notes, consent_confirmed: true})}
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="consent"
                checked={notes.consent_confirmed === false}
                onChange={() => setNotes({...notes, consent_confirmed: false})}
                className="mr-2"
              />
              No
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Risks Explained</label>
          <textarea
            value={notes.risks_explained || ''}
            onChange={(e) => setNotes({...notes, risks_explained: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Risks explained to patient..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Pre-operative Plan</label>
        <textarea
          value={notes.pre_op_plan || ''}
          onChange={(e) => setNotes({...notes, pre_op_plan: e.target.value})}
          className="w-full border rounded px-3 py-2 h-32"
          placeholder="Surgical plan, approach, expected difficulties..."
        />
      </div>
    </div>
  )

  const renderIntraOpNotes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Procedure Performed</label>
          <textarea
            value={notes.procedure_details || ''}
            onChange={(e) => setNotes({...notes, procedure_details: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Detailed procedure description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Incision Type</label>
          <select
            value={notes.closure_details?.split(',')[0] || ''}
            onChange={(e) => setNotes({...notes, closure_details: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Incision</option>
            <option value="Midline">Midline</option>
            <option value="Pfannenstiel">Pfannenstiel</option>
            <option value="Subcostal">Subcostal</option>
            <option value="Thoracotomy">Thoracotomy</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Findings</label>
          <textarea
            value={notes.findings || ''}
            onChange={(e) => setNotes({...notes, findings: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Intra-operative findings..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Complications</label>
          <textarea
            value={notes.complications || ''}
            onChange={(e) => setNotes({...notes, complications: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Any complications encountered..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Estimated Blood Loss (ml)</label>
          <input
            type="number"
            value={notes.closure_details?.split(',')[1] || ''}
            onChange={(e) => setNotes({...notes, closure_details: `${notes.closure_details?.split(',')[0] || ''},${e.target.value}`})}
            className="w-full border rounded px-3 py-2"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Specimens Sent to Lab</label>
          <input
            type="text"
            value={notes.closure_details?.split(',')[2] || ''}
            onChange={(e) => setNotes({...notes, closure_details: `${notes.closure_details?.split(',')[0] || ''},${notes.closure_details?.split(',')[1] || ''},${e.target.value}`})}
            className="w-full border rounded px-3 py-2"
            placeholder="Tissue samples, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Closure Details</label>
          <input
            type="text"
            value={notes.closure_details?.split(',')[3] || ''}
            onChange={(e) => setNotes({...notes, closure_details: `${notes.closure_details?.split(',')[0] || ''},${notes.closure_details?.split(',')[1] || ''},${notes.closure_details?.split(',')[2] || ''},${e.target.value}`})}
            className="w-full border rounded px-3 py-2"
            placeholder="Sutures used, etc."
          />
        </div>
      </div>
    </div>
  )

  const renderPostOpNotes = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Antibiotics</label>
          <input
            type="text"
            value={notes.post_op_orders?.antibiotics || ''}
            onChange={(e) => setNotes({
              ...notes,
              post_op_orders: {...notes.post_op_orders, antibiotics: e.target.value}
            })}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Ceftriaxone 1g IV q12h"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">IV Fluids</label>
          <input
            type="text"
            value={notes.post_op_orders?.iv_fluids || ''}
            onChange={(e) => setNotes({
              ...notes,
              post_op_orders: {...notes.post_op_orders, iv_fluids: e.target.value}
            })}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Normal Saline 100ml/hr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Analgesics</label>
          <input
            type="text"
            value={notes.post_op_orders?.analgesics || ''}
            onChange={(e) => setNotes({
              ...notes,
              post_op_orders: {...notes.post_op_orders, analgesics: e.target.value}
            })}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Paracetamol 1g q6h"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Monitoring Instructions</label>
        <textarea
          value={notes.post_op_orders?.monitoring || ''}
          onChange={(e) => setNotes({
            ...notes,
            post_op_orders: {...notes.post_op_orders, monitoring: e.target.value}
          })}
          className="w-full border rounded px-3 py-2 h-24"
          placeholder="Vital signs monitoring, drain care, wound care instructions..."
        />
      </div>
    </div>
  )

  if (loading && !selectedCase) return <div className="p-6">Loading surgeon cases...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">👨‍⚕️ Surgeon Module - LIFEPOINT HOSPITAL</h1>

        {!selectedCase ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Surgery Cases</h2>
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
                        loadNotes(case_.id, 'pre_op')
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Open Case
                    </button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <p className="text-center text-gray-500 py-8">No surgery cases assigned</p>
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
              {[
                { key: 'pre_op', label: 'Pre-Operative' },
                { key: 'intra_op', label: 'Intra-Operative' },
                { key: 'post_op', label: 'Post-Operative' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key as any)
                    loadNotes(selectedCase.id, tab.key)
                  }}
                  className={`px-4 py-2 rounded-t-lg ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notes Form */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {activeTab === 'pre_op' && renderPreOpNotes()}
              {activeTab === 'intra_op' && renderIntraOpNotes()}
              {activeTab === 'post_op' && renderPostOpNotes()}

              <div className="flex justify-end mt-6">
                <button
                  onClick={saveNotes}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}