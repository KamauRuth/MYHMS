"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabTest() {

  const params = useSearchParams()
  const id = params.get("id")

  const [request,setRequest] = useState<any>(null)
  const [results,setResults] = useState<any>({})

  useEffect(()=>{ load() },[])

  async function load(){

    const { data } = await supabase
      .from("lab_requests")
      .select(`
        *,
        lab_test_master(template),
        invoices(status)
      `)
      .eq("id",id)
      .single()

    if(data.invoices.status !== "paid"){
      alert("Payment not completed")
      window.location.href="/lab-queue"
      return
    }

    setRequest(data)
  }

  async function saveResults(){

    await supabase
      .from("lab_requests")
      .update({
        results: results,
        status: "DONE",
        completed_at: new Date()
      })
      .eq("id",id)

    alert("Results saved")
  }

  if(!request) return <div>Loading...</div>

  return(
    <div className="p-8 space-y-6">

      <h1 className="text-xl font-bold">
        {request.test_name}
      </h1>

      {request.lab_test_master?.template?.map((field:any)=>(
        <div key={field.field} className="flex gap-4 items-center">
          <label className="w-48">{field.field}</label>
          <input
            className="border p-2 rounded"
            onChange={e=>
              setResults({...results,[field.field]:e.target.value})
            }
          />
          <span>{field.unit}</span>
        </div>
      ))}

      <button
        onClick={saveResults}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Results
      </button>

    </div>
  )
}