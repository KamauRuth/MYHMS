"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabSamples() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get("requestId")

  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    if (requestId) {
      loadRequest()
      loadSamples()
      loadUser()
    }
  }, [requestId])

  const loadUser = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Failed to load user", error)
    } else {
      setUser(data.user)
    }
  }

  const loadRequest = async () => {
    const { data, error } = await supabase
      .from("lab_requests")
      .select(`
        *,
        visits!inner (
          patient:patients(*)
        ),
        lab_test_master(*)
      `)
      .eq("id", requestId)
      .single()

    if (error) {
      console.error("Failed to load request", error)
    } else {
      setRequest(data)
    }
  }

  const loadSamples = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("lab_samples")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load samples", error)
    } else {
      setSamples(data || [])
    }
    setLoading(false)
  }

  const addSample = async (sample: any) => {
    const { error } = await supabase
      .from("lab_samples")
      .insert([{ ...sample, request_id: requestId }])

    if (error) {
      console.error("Failed to add sample", error)
      alert("Could not add sample")
    } else {
      loadSamples()
    }
  }

  const updateSample = async (id: string, updates: any) => {
    const { error } = await supabase
      .from("lab_samples")
      .update(updates)
      .eq("id", id)

    if (error) {
      console.error("Failed to update sample", error)
    } else {
      loadSamples()
    }
  }

  if (loading) return <p className="p-6">Loading samples...</p>
  if (!request) return <p className="p-6">Request not found.</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Sample Management</h1>
        <p className="text-lg">
          {request.visits?.patient?.first_name} {request.visits?.patient?.last_name} - {request.lab_test_master?.test_name}
        </p>
        <p className="text-sm text-gray-500">Request ID: {request.id}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-4">Samples</h3>
        <div className="space-y-2">
          {samples.map(sample => (
            <div key={sample.id} className="border rounded p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <strong>Sample ID:</strong> {sample.id}
                </div>
                <div>
                  <strong>Type:</strong> {sample.sample_type}
                </div>
                <div>
                  <strong>Status:</strong>
                  <select
                    value={sample.status}
                    onChange={(e) => updateSample(sample.id, { status: e.target.value })}
                    className="ml-2 border rounded px-2 py-1"
                  >
                    <option value="collected">Collected</option>
                    <option value="rejected">Rejected</option>
                    <option value="processed">Processed</option>
                  </select>
                </div>
                <div>
                  <strong>Collected:</strong> {sample.collected_at ? new Date(sample.collected_at).toLocaleString() : "Not set"}
                </div>
                <div>
                  <strong>Collected By:</strong> {sample.collected_by || "Unknown"}
                </div>
              </div>
              {sample.status === "rejected" && (
                <div className="mt-2">
                  <strong>Rejection Reason:</strong>
                  <input
                    type="text"
                    value={sample.rejection_reason || ""}
                    onChange={(e) => updateSample(sample.id, { rejection_reason: e.target.value })}
                    className="ml-2 border rounded px-2 py-1 w-full"
                    placeholder="Reason for rejection"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-2">Add New Sample</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              addSample({
                sample_type: formData.get("sample_type"),
                collected_at: new Date().toISOString(),
                collected_by: user?.id,
                storage_status: "collected"
              })
              ;(e.target as HTMLFormElement).reset()
            }}
            className="grid grid-cols-2 gap-4"
          >
            <input name="sample_type" placeholder="Sample Type (Blood, Urine, etc.)" required className="border rounded px-3 py-2" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 col-span-2">
              Add Sample
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}