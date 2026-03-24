"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"


const supabase = createClient()

// Danger diagnosis keywords
const DANGER_KEYWORDS = [
  "malaria",
  "typhoid",
  "meningitis",
  "sepsis",
  "pneumonia",
  "tuberculosis",
  "cholera",
  "stroke",
  "myocardial",
  "hemorrhage",
]

// ICD → Suggested labs mapping
const ICD_LAB_MAP: Record<string, string[]> = {
  malaria: ["Malaria smear", "RDT malaria"],
  typhoid: ["Widal test", "Blood culture"],
  pneumonia: ["Chest X-ray", "Full blood count"],
  tuberculosis: ["GeneXpert", "Sputum AFB"],
  cholera: ["Stool culture", "Electrolytes"],
}

export default function OPDVisit() {
    const searchParams = useSearchParams()
    const visitId = searchParams.get("visitId")
    const router = useRouter()

  // LOADING STATE
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  // SEARCH STATE
  const [search, setSearch] = useState("")

  // VISIT DATA
  const [visit, setVisit] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [triage, setTriage] = useState<any>(null)

  // CONSULTATION
  const [chiefComplaint, setChiefComplaint] = useState("")
  const [historyOfPresentIllness, setHPI] = useState("")
  const [examination, setExamination] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")

  // ICD
  const [icdResults, setIcdResults] = useState<any[]>([])
  const [selectedICD, setSelectedICD] = useState<any>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [diagnosisLocked, setDiagnosisLocked] = useState(false)
  const [suggestedLabs, setSuggestedLabs] = useState<string[]>([])

  // LABS
  const [labs, setLabs] = useState([""])
  const [labTests, setLabTests] = useState<any[]>([])
  const [labRequests, setLabRequests] = useState<any[]>([])
  const [hasPendingLabs, setHasPendingLabs] = useState(false)

  const isDangerDiagnosis = (title = "") =>
    DANGER_KEYWORDS.some(k => title.toLowerCase().includes(k))

  const filteredLabTests = labTests?.filter((test) =>
    test.test_name.toLowerCase().includes(search.toLowerCase()))

  // PHARMACY
  const [drugs, setDrugs] = useState([{ name: "", dose: "", frequency: "" }])
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
  const [allDrugs, setAllDrugs] = useState([]) 


  // THEATRE / SURGERY
  const [showBooking, setShowBooking] = useState(false)
  const [procedure, setProcedure] = useState("")
  const [urgency, setUrgency] = useState("ELECTIVE")
  const [preferredDate, setPreferredDate] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")



  const generateBookingId = () =>
    `LPH-OT-${Math.floor(1000 + Math.random() * 9000)}`

  // =========================
  // LOAD VISIT + TRIAGE
  // =========================
  useEffect(() => {
    const load = async () => {
      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select(`
          id,
          visit_no,
          patient:patients (id, first_name, last_name)
        `)
        .eq("id", visitId)
        .single()

      if (visitError || !visitData) {
        alert("Visit not found")
        router.push("/opd-queue")
        return
      }

      const { data: triageData } = await supabase
        .from("triage")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setVisit(visitData)
      setPatient(visitData.patient)
      setTriage(triageData)
      setLoading(false)
    }
    load()
  }, [visitId, router])

  // LOAD LAB REQUESTS.

  useEffect(() => {
  const fetchLabs = async () => {
    const { data, error } = await supabase
      .from("lab_test_master")
      .select("id, test_name, price" )

    if (!error) {
      setLabTests(data)
    }
  }

  fetchLabs()
}, [])

  // =========================
  // LOAD LAB REQUESTS
  // =========================
useEffect(() => {

  if (!visitId) return

  const load = async () => {

    try {

      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .select(`
          id,
          visit_no,
          patient:patients (
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", visitId)
        .single()

      if (visitError || !visitData) {
        alert("Visit not found")
        router.push("/opd-queue")
        return
      }

      const { data: triageData } = await supabase
        .from("triage")
        .select("*")
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      setVisit(visitData)
      setPatient(visitData.patient)
      setTriage(triageData)

    } catch (err) {
      console.error(err)
      alert("Failed to load visit")
    }

    setLoading(false)
  }

  load()

}, [visitId])
  // =========================
  // ICD-11 SUGGESTIONS
  // =========================
useEffect(() => {
  if (diagnosisLocked || diagnosis.trim().length < 3) {
    setIcdResults([])
    return
  }

  const timer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/icd11/suggest?q=${encodeURIComponent(diagnosis)}`)

      if (!res.ok) return

      const data = await res.json()
      setIcdResults(Array.isArray(data) ? data.slice(0, 8) : [])

    } catch (err) {
      console.error("ICD fetch error", err)
    }
  }, 400)

  return () => clearTimeout(timer)

}, [diagnosis, diagnosisLocked])

const handleDiagnosisKeyDown = (e: any) => {
  if (icdResults.length === 0) return
    if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex(i => (i + 1) % icdResults.length)
    } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex(i => (i - 1 + icdResults.length) % icdResults.length)
    } else if (e.key === "Enter") {
        e.preventDefault()
        const selected = icdResults[activeIndex]
        if (selected) selectedICD(selected)
    }  
} 

  const selectDiagnosis = async (r: any) => {
    setDiagnosis(r.title)
    setSelectedICD(r)
    setDiagnosisLocked(true)
    setIcdResults([])
    setActiveIndex(-1)

    const key = Object.keys(ICD_LAB_MAP).find(k =>
      r.title.toLowerCase().includes(k)
    )
    if (key) setSuggestedLabs(ICD_LAB_MAP[key])

    if (isDangerDiagnosis(r.title) && triage?.severity !== "HIGH") {
      await supabase
        .from("triage")
        .update({ severity: "HIGH" })
        .eq("visit_id", visitId)

      setTriage((t: any) => ({ ...t, severity: "HIGH" }))
    }
  }

  // =========================
  // ACTIONS
  // =========================
  async function saveConsultation() {

  if (!visit?.id) {
    alert("Visit not found")
    return
  }

  if (!selectedICD) {
    alert("Select diagnosis")
    return
  }

  const icdCode = selectedICD.code
  const diagnosisName = selectedICD.title

  // 1️⃣ Check if diagnosis already exists locally
  const { data: existing } = await supabase
    .from("diagnoses")
    .select("*")
    .eq("icd11_code", icdCode)
    .maybeSingle()

  let diagnosisId = existing?.id

  // 2️⃣ If not → insert new diagnosis
  if (!diagnosisId) {
    const { data: newDiag, error } = await supabase
      .from("diagnoses")
      .insert({
        icd11_code: icdCode,
        diagnosis_name: diagnosisName,
        full_data: selectedICD
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    diagnosisId = newDiag.id
  }

  // 3️⃣ Save consultation
  const { error: consultError } = await supabase
    .from("consultations")
    .insert({
      visit_id: visit.id,
      notes: notes ?? null
    })

  if (consultError) {
    alert(consultError.message)
    return
  }

  // 4️⃣ Link diagnosis to visit
  const { error: visitDiagError } = await supabase
    .from("visit_diagnoses")
    .insert({
      visit_id: visit.id,
      diagnosis_id: diagnosisId,
      diagnosis_type: "PRIMARY"
    })

  if (visitDiagError) {
    alert(visitDiagError.message)
    return
  }

  alert("Consultation & ICD-11 diagnosis saved successfully")
}

 async function sendLab() {

  for (const selectedTestId of labs) {

    if (!selectedTestId) continue;

    // 1️⃣ Fetch test details
    const { data: test, error } = await supabase
      .from("lab_test_master")
      .select("id, test_name, price")
      .eq("id", selectedTestId)
      .single();

    if (error || !test) {
      console.error(error);
      continue;
    }

    // 2️⃣ Prevent duplicate requests
    const { data: existing } = await supabase
      .from("lab_requests")
      .select("id")
      .eq("visit_id", visit.id)
      .eq("test_id", test.id)
      .maybeSingle();

    if (existing) {
      console.log(`Lab test ${test.id} already requested`);
      continue;
    }

    // 3️⃣ Get invoice for this visit
    let { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("visit_id", visit.id)
      .maybeSingle();

    // 4️⃣ Create invoice if none exists
    if (!invoice) {

      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          visit_id: visit.id,
          patient_id: visit.patient_id,
          invoice_number: `INV-${Date.now()}`,
          status: "unpaid",
          total_amount: 0,
          paid_amount: 0,
          balance: 0
        })
        .select()
        .single();

      if (invoiceError) {
        console.error(invoiceError);
        continue;
      }

      invoice = newInvoice;
    }

    // 5️⃣ Create lab request
    const { data: labRequest, error: requestError } = await supabase
      .from("lab_requests")
      .insert({
        visit_id: visit.id,
        test_id: test.id,
        lab_amount: test.price,
        status: "PENDING",
        payment_status: "UNPAID"
      })
      .select()
      .single();

    if (requestError) {
      console.error(requestError);
      continue;
    }

    // 6️⃣ Add item to invoice
    const { error: itemError } = await supabase
      .from("invoice_items")
      .insert({
        invoice_id: invoice.id,
        item_type: "lab",
        item_id: test.id,
        description: test.test_name,
        quantity: 1,
        unit_price: test.price,
        total_price: test.price
      });

    if (itemError) {
      console.error(itemError);
      continue;
    }

    console.log(`Lab request created and billed: ${test.test_name}`);
  }

  alert("Lab requests created and added to billing.");
}
 const sendPrescription = async () => {
  try {
    const clean = drugs.filter(d => d.drug_id && d.quantity)
    if (!clean.length) return alert("Add medication")

    if (!selectedDepartmentId) {
      return alert("Select department")
    }

    const payload = clean.map(d => ({
      patient_visit_id: visitId,
      drug_id: d.drug_id,
      quantity: d.quantity,
      status: "PENDING",
      department_id: selectedDepartmentId,
      prescribed_by: "doctor-user-id"
    }))

    const { error } = await supabase
      .from("prescriptions")
      .insert(payload)

    if (error) throw error

    alert("Sent to pharmacy")
    setDrugs([])
  } catch (err) {
    console.error(err)
    alert("Failed to send prescription")
  }
}
  const closeConsultation = async () => {
    if (!selectedICD) return alert("Diagnosis required before closing consultation")
    setClosing(true)

    await supabase
      .from("consultations")
      .update({ status: "CLOSED", closed_at: new Date().toISOString() })
      .eq("visit_id", visitId)

    await supabase
      .from("visits")
      .update({ status: "COMPLETED" })
      .eq("id", visitId)

    alert("Consultation closed")
    router.push("/opd")
  }

  const admitToIPD = async () => {
    if (!selectedICD) return alert("Diagnosis required before admission")
    setClosing(true)

    await supabase.from("ipd_admissions").insert({
      visit_id: visitId,
      patient_id: patient.id,
      admitted_at: new Date().toISOString(),
      status: "ACTIVE",
    })

    await supabase
      .from("consultations")
      .update({ status: "CLOSED", closed_at: new Date().toISOString() })
      .eq("visit_id", visitId)

    await supabase
      .from("visits")
      .update({ status: "ADMITTED" })
      .eq("id", visitId)

    alert("Patient admitted to IPD")
    router.push("/ipd")
  }

  const bookForSurgery = async () => {
    if (!selectedICD || !procedure || !preferredDate) {
      alert("Diagnosis, procedure, and preferred date are required")
      return
    }

    const { error } = await supabase.from("theatre_bookings").insert({
      booking_id: generateBookingId(),
      patient_id: patient.id,
      visit_id: visitId,
      source: "OPD",
      procedure_name: procedure,
      urgency,
      preferred_date: preferredDate,
      estimated_duration_minutes: parseInt(estimatedDuration) || 0,
      status: "BOOKED",
    })

    if (error) return alert("Failed to book surgery")
    alert("Surgery booked successfully")
    setShowBooking(false)
  }

  if (loading) return <div>Loading…</div>

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8 space-y-8">

  {/* HEADER */}
  <div className="border-b pb-4">
    <h2 className="text-2xl font-bold text-blue-700">
      {visit?.visit_no} — {patient?.first_name} {patient?.last_name}
    </h2>

    {triage && (
      <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        Temp {triage.temperature}°C • Pulse {triage.pulse} •
        BP {triage.bp_systolic}/{triage.bp_diastolic} • SpO₂ {triage.spo2}%
      </div>
    )}
  </div>

  {/* CONSULTATION */}
  <div className="space-y-4">
    <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">
      Consultation
    </h3>

    <div className="grid gap-4">
      <input
        className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none"
        placeholder="Chief Complaint"
        value={chiefComplaint}
        onChange={e => setChiefComplaint(e.target.value)}
      />

      <textarea
        className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none min-h-[100px]"
        placeholder="History of Present Illness"
        value={historyOfPresentIllness}
        onChange={e => setHPI(e.target.value)}
      />

      <textarea
        className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none min-h-[100px]"
        placeholder="Examination Findings"
        value={examination}
        onChange={e => setExamination(e.target.value)}
      />
    </div>

    {/* Diagnosis */}
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-700">Diagnosis (ICD-11)</h4>

      <input
        className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none disabled:bg-gray-100"
        placeholder={hasPendingLabs ? "Diagnosis locked until labs reviewed" : "Type diagnosis (e.g. malaria)"}
        value={diagnosis}
        disabled={hasPendingLabs}
        onChange={e => {
          setDiagnosis(e.target.value)
          setSelectedICD(null)
          setDiagnosisLocked(false)
        }}
        onKeyDown={handleDiagnosisKeyDown}
      />

      {icdResults.map((item) => (
        <div
          key={item.code}
          className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition"
          onClick={() => selectDiagnosis(item)}
        >
          {item.title}
          <span className="text-gray-500 ml-2">({item.code})</span>
        </div>
      ))}

      {suggestedLabs.length > 0 && (
        <div className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          Suggested Labs: {suggestedLabs.join(", ")}
        </div>
      )}

      <textarea
        className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-400 outline-none min-h-[100px]"
        placeholder="Doctor Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <button
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        onClick={saveConsultation}
      >
        Save Consultation
      </button>
    </div>
  </div>

  {/* LABS */}
  <div className="space-y-4">
  <h3 className="text-xl font-semibold border-b pb-2">
    Send to Lab
  </h3>

  {/* Search Box */}
  <input
    type="text"
    placeholder="Search lab test..."
    className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  {/* Lab Select */}
  {labs.map((l, i) => (
    <select
      key={i}
      className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none"
      value={l}
      onChange={(e) => {
        const updated = [...labs]
        updated[i] = e.target.value
        setLabs(updated)
      }}
    >
      <option value="">Select Lab Test</option>

      {filteredLabTests?.map((test) => (
        <option key={test.id} value={test.id}>
          {test.test_name} - KES {test.price}
        </option>
      ))}
    </select>
  ))}

  <div className="flex gap-3">
    <button
      className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
      onClick={() => setLabs([...labs, ""])}
    >
      + Add Lab
    </button>

    <button
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      onClick={() => {
        const hasSelectedTests = labs.some(l => l)
        if (hasSelectedTests) sendLab()
      }}
    >
      Send to Lab
    </button>
  </div>
</div>

  {/* PRESCRIPTION */}
  <div className="space-y-6">
  <h3 className="text-xl font-semibold border-b pb-2">
    Prescription
  </h3>

  {/* Department Selection */}
  <div>
    <label className="block mb-1 font-medium">Department</label>
    <select
      value={selectedDepartmentId}
      onChange={(e) => setSelectedDepartmentId(e.target.value)}
      className="border rounded-lg p-3 w-full"
    >
      <option value="">Select Department</option>
      {departments.map(dep => (
        <option key={dep.id} value={dep.id}>
          {dep.name}
        </option>
      ))}
    </select>
  </div>

  {/* Drug Rows */}
  {drugs.map((d, i) => (
    <div key={i} className="grid md:grid-cols-5 gap-3">
      
      {/* Drug Select */}
      <select
        className="border rounded-lg p-3"
        value={d.drug_id || ""}
        onChange={e => {
          const selected = allDrugs.find(dr => dr.id === e.target.value)
          const c = [...drugs]
          c[i].drug_id = selected.id
          c[i].name = selected.generic_name
          c[i].price = selected.selling_price
          setDrugs(c)
        }}
      >
        <option value="">Select Drug</option>
        {allDrugs.map(dr => (
          <option key={dr.id} value={dr.id}>
            {dr.generic_name} ({dr.brand_name})
          </option>
        ))}
      </select>

      {/* Quantity */}
      <input
        type="number"
        className="border rounded-lg p-3"
        placeholder="Qty"
        value={d.quantity || ""}
        onChange={e => {
          const c = [...drugs]
          c[i].quantity = parseInt(e.target.value)
          setDrugs(c)
        }}
      />

      {/* Dose */}
      <input
        className="border rounded-lg p-3"
        placeholder="Dose"
        value={d.dose || ""}
        onChange={e => {
          const c = [...drugs]
          c[i].dose = e.target.value
          setDrugs(c)
        }}
      />

      {/* Frequency */}
      <input
        className="border rounded-lg p-3"
        placeholder="Frequency"
        value={d.frequency || ""}
        onChange={e => {
          const c = [...drugs]
          c[i].frequency = e.target.value
          setDrugs(c)
        }}
      />

      {/* Price Display */}
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-2">
        {d.price ? `KES ${d.price}` : "-"}
      </div>
    </div>
  ))}

  {/* Actions */}
  <div className="flex gap-3">
    <button
      className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
      onClick={() =>
        setDrugs([
          ...drugs,
          { drug_id: "", name: "", quantity: 1, dose: "", frequency: "", price: 0 }
        ])
      }
    >
      + Add Drug
    </button>

    <button
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      onClick={sendPrescription}
    >
      Send to Pharmacy
    </button>
  </div>
</div>

  {/* SURGERY MODAL */}
  {showBooking && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold">Surgery Booking</h3>

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Procedure"
          value={procedure}
          onChange={e => setProcedure(e.target.value)}
        />

        <select
          className="border rounded-lg p-3 w-full"
          value={urgency}
          onChange={e => setUrgency(e.target.value)}
        >
          <option value="ELECTIVE">Elective</option>
          <option value="EMERGENCY">Emergency</option>
        </select>

        <input
          type="date"
          className="border rounded-lg p-3 w-full"
          value={preferredDate}
          onChange={e => setPreferredDate(e.target.value)}
        />

        <input
          className="border rounded-lg p-3 w-full"
          placeholder="Estimated Duration"
          value={estimatedDuration}
          onChange={e => setEstimatedDuration(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            className="bg-gray-200 px-4 py-2 rounded-lg"
            onClick={() => setShowBooking(false)}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={bookForSurgery}
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  )}

  {/* FINAL ACTIONS */}
  <div className="flex flex-wrap gap-4 pt-6 border-t">
    <button
      className="bg-purple-600 text-white px-4 py-2 rounded-lg"
      onClick={() => setShowBooking(true)}
    >
      Book for Surgery
    </button>

    <button
      onClick={() =>
        router.push(`/admit?visit_id=${visit.id}&patient_id=${patient.patient_id}`)
      }
      className="bg-purple-600 text-white px-4 py-2 rounded"
      >
      Admit to IPD
    </button>

    <button
      className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
      onClick={closeConsultation}
      disabled={closing}
    >
      Close Consultation
    </button>
  </div>

  <button
    className="text-blue-600 hover:underline"
    onClick={() => router.push("/opd-queue")}
  >
    ← Back
  </button>

</div>
  )

}
