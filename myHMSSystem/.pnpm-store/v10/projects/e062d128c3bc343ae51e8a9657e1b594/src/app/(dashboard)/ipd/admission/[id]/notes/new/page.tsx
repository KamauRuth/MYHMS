'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, FileText } from 'lucide-react'
import { createDailyNote, getAdmissionByIdWithPatient } from '@/lib/ipd/api'
import type { AdmissionWithPatient, CreateDailyNoteInput } from '@/lib/ipd/types'

type NoteType = CreateDailyNoteInput['note_type']
type Priority = NonNullable<CreateDailyNoteInput['priority']>

export default function NewDailyNotePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [admission, setAdmission] = useState<AdmissionWithPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [noteType, setNoteType] = useState<NoteType>('NURSING')
  const [priority, setPriority] = useState<Priority>('NORMAL')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [isCritical, setIsCritical] = useState(false)

  useEffect(() => {
    getAdmissionByIdWithPatient(id)
      .then(setAdmission)
      .finally(() => setLoading(false))
  }, [id])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!notes.trim()) return
    try {
      setSubmitting(true)
      await createDailyNote({
        admission_id: id,
        note_type: noteType,
        title: title.trim() || undefined,
        notes: notes.trim(),
        priority: isCritical ? 'URGENT' : priority,
        is_critical: isCritical,
      })
      router.push(`/ipd/admission/${id}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save clinical note')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-sm text-slate-500">Loading inpatient record…</div>

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Link href={`/ipd/admission/${id}`} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to patient chart</Link>
      <div className="mb-6 rounded-2xl bg-slate-950 p-6 text-white">
        <div className="flex items-center gap-2 text-blue-300"><FileText className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">Clinical documentation</span></div>
        <h1 className="mt-2 text-2xl font-bold">Add daily note</h1>
        <p className="mt-1 text-sm text-slate-300">{admission?.patient?.first_name} {admission?.patient?.last_name} · {admission?.ward || 'Ward not assigned'}</p>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Note type<select value={noteType} onChange={(event) => setNoteType(event.target.value as NoteType)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"><option value="NURSING">Nursing note</option><option value="DOCTOR">Doctor note</option><option value="CLINICAL">Clinical review</option><option value="OBSERVATION">Observation</option></select></label>
          <label className="text-sm font-medium text-slate-700">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} disabled={isCritical} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 disabled:bg-slate-100"><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Title (optional)<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Morning ward review" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
        <label className="block text-sm font-medium text-slate-700">Clinical note<textarea required rows={8} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Document assessment, changes, interventions and plan…" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${isCritical ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`}><input type="checkbox" checked={isCritical} onChange={(event) => setIsCritical(event.target.checked)} className="mt-1" /><AlertTriangle className="h-5 w-5 text-rose-600" /><span><span className="block text-sm font-semibold text-slate-900">Mark as critical</span><span className="text-xs text-slate-600">Highlights this note for urgent review on the IPD dashboard.</span></span></label>
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-5"><Link href={`/ipd/admission/${id}`} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</Link><button disabled={submitting || !notes.trim()} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Saving…' : 'Save clinical note'}</button></div>
      </form>
    </div>
  )
}
