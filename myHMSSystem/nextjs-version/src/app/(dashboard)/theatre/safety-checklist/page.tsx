"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface ChecklistItem {
  id?: string
  case_id: string
  checklist_phase: 'pre_op' | 'time_out' | 'post_op'
  item_name: string
  is_completed: boolean
  completed_by?: string
  completed_at?: string
  notes?: string
}

export default function SafetyChecklist() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activePhase, setActivePhase] = useState<'pre_op' | 'time_out' | 'post_op'>('pre_op')

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    setLoading(true)
    // Load cases that are in surgery or completed today
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from("theatre_cases")
      .select(`
        *,
        theatre_bookings (
          procedure_name
        )
      `)
      .in("status", ["prepped", "in_surgery", "recovery", "completed"])
      .gte("time_in", `${today}T00:00:00`)
      .order("time_in", { ascending: false })

    if (error) {
      console.error("Failed to load cases", error)
    } else {
      setCases(data || [])
    }
    setLoading(false)
  }

  const loadChecklist = async (caseId: string) => {
    // First, ensure checklist items exist for this case
    await ensureChecklistItems(caseId)

    // Load checklist items
    const { data, error } = await supabase
      .from("theatre_checklists")
      .select("*")
      .eq("case_id", caseId)
      .order("checklist_phase")

    if (error) {
      console.error("Failed to load checklist", error)
    } else {
      setChecklistItems(data || [])
    }
  }

  const ensureChecklistItems = async (caseId: string) => {
    // Check if checklist items already exist
    const { data: existing, error: checkError } = await supabase
      .from("theatre_checklists")
      .select("id")
      .eq("case_id", caseId)

    if (checkError) {
      console.error("Error checking existing checklist", checkError)
      return
    }

    if (existing && existing.length > 0) return // Already exists

    // Create default checklist items
    const defaultItems = [
      // Pre-op
      { case_id: caseId, checklist_phase: 'pre_op', item_name: 'Patient identity confirmed' },
      { case_id: caseId, checklist_phase: 'pre_op', item_name: 'Procedure confirmed' },
      { case_id: caseId, checklist_phase: 'pre_op', item_name: 'Consent signed' },

      // Time-out
      { case_id: caseId, checklist_phase: 'time_out', item_name: 'Team introduction' },
      { case_id: caseId, checklist_phase: 'time_out', item_name: 'Antibiotics given' },
      { case_id: caseId, checklist_phase: 'time_out', item_name: 'Equipment ready' },

      // Post-op
      { case_id: caseId, checklist_phase: 'post_op', item_name: 'Sponge count correct' },
      { case_id: caseId, checklist_phase: 'post_op', item_name: 'Specimen labeled' },
      { case_id: caseId, checklist_phase: 'post_op', item_name: 'Complications recorded' }
    ]

    const { error: insertError } = await supabase
      .from("theatre_checklists")
      .insert(defaultItems)

    if (insertError) {
      console.error("Error creating checklist items", insertError)
    }
  }

  const updateChecklistItem = async (itemId: string, isCompleted: boolean, notes?: string) => {
    setLoading(true)
    try {
      const updateData: any = {
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      }

      if (isCompleted && !checklistItems.find(item => item.id === itemId)?.completed_at) {
        updateData.completed_by = 'current_user' // TODO: get from auth
        updateData.completed_at = new Date().toISOString()
      }

      if (notes !== undefined) {
        updateData.notes = notes
      }

      const { error } = await supabase
        .from("theatre_checklists")
        .update(updateData)
        .eq("id", itemId)

      if (error) throw error

      // Reload checklist
      if (selectedCase) {
        loadChecklist(selectedCase.id)
      }

    } catch (error) {
      console.error('Error updating checklist item:', error)
      alert('Failed to update checklist item')
    } finally {
      setLoading(false)
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'pre_op': return 'bg-blue-100 border-blue-300'
      case 'time_out': return 'bg-yellow-100 border-yellow-300'
      case 'post_op': return 'bg-green-100 border-green-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  const getPhaseTitle = (phase: string) => {
    switch (phase) {
      case 'pre_op': return 'Pre-Operative Checklist'
      case 'time_out': return 'Time-Out Checklist'
      case 'post_op': return 'Post-Operative Checklist'
      default: return phase
    }
  }

  const getCompletionStatus = (phase: string) => {
    const phaseItems = checklistItems.filter(item => item.checklist_phase === phase)
    const completedItems = phaseItems.filter(item => item.is_completed)
    return `${completedItems.length}/${phaseItems.length} completed`
  }

  const renderChecklist = () => {
    const phaseItems = checklistItems.filter(item => item.checklist_phase === activePhase)

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">{getPhaseTitle(activePhase)}</h3>
          <span className="text-sm text-gray-600">{getCompletionStatus(activePhase)}</span>
        </div>

        {phaseItems.map(item => (
          <div key={item.id} className={`border rounded-lg p-4 ${getPhaseColor(activePhase)}`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={(e) => updateChecklistItem(item.id!, e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex-1">
                <h4 className={`font-medium ${item.is_completed ? 'line-through text-gray-500' : ''}`}>
                  {item.item_name}
                </h4>

                {item.completed_at && (
                  <p className="text-sm text-gray-600 mt-1">
                    Completed by {item.completed_by} at {new Date(item.completed_at).toLocaleString()}
                  </p>
                )}

                <div className="mt-2">
                  <label className="block text-sm text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={item.notes || ''}
                    onChange={(e) => updateChecklistItem(item.id!, item.is_completed, e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="Add any relevant notes..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {phaseItems.length === 0 && (
          <p className="text-center text-gray-500 py-8">No checklist items for this phase</p>
        )}
      </div>
    )
  }

  if (loading && !selectedCase) return <div className="p-6">Loading safety checklists...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">✅ WHO Surgical Safety Checklist - LIFEPOINT HOSPITAL</h1>

        {!selectedCase ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Surgery Case</h2>
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
                        loadChecklist(case_.id)
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Open Checklist
                    </button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active surgery cases for safety checklist</p>
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

            {/* Phase Navigation */}
            <div className="flex space-x-1 mb-6">
              {[
                { key: 'pre_op', label: 'Pre-Op', color: 'bg-blue-600' },
                { key: 'time_out', label: 'Time-Out', color: 'bg-yellow-600' },
                { key: 'post_op', label: 'Post-Op', color: 'bg-green-600' }
              ].map(phase => (
                <button
                  key={phase.key}
                  onClick={() => setActivePhase(phase.key as any)}
                  className={`px-4 py-2 rounded-t-lg text-white ${
                    activePhase === phase.key
                      ? phase.color
                      : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                >
                  {phase.label}
                </button>
              ))}
            </div>

            {/* Checklist Content */}
            <div className="bg-gray-50 p-6 rounded-lg">
              {renderChecklist()}
            </div>

            {/* Progress Summary */}
            <div className="mt-6 bg-white border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Checklist Progress Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getCompletionStatus('pre_op').split('/')[0]}
                  </div>
                  <div className="text-sm text-gray-600">Pre-Op Completed</div>
                  <div className="text-xs text-gray-500">Total: {getCompletionStatus('pre_op').split('/')[1]}</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {getCompletionStatus('time_out').split('/')[0]}
                  </div>
                  <div className="text-sm text-gray-600">Time-Out Completed</div>
                  <div className="text-xs text-gray-500">Total: {getCompletionStatus('time_out').split('/')[1]}</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getCompletionStatus('post_op').split('/')[0]}
                  </div>
                  <div className="text-sm text-gray-600">Post-Op Completed</div>
                  <div className="text-xs text-gray-500">Total: {getCompletionStatus('post_op').split('/')[1]}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}