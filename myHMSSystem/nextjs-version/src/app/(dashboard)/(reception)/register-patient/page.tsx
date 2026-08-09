"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { PAYMENT_STATUS, TRIAGE_STATUS, VISIT_STATUS } from "@/lib/workflows/encounters"

const supabase = createClient()

export default function RegisterPatientTableForm() {
  const [patients, setPatients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [clearedInvoices, setClearedInvoices] = useState<any[]>([])
  const [loadingCleared, setLoadingCleared] = useState(false)
  const [searchFirstName, setSearchFirstName] = useState("")
  const [searchLastName, setSearchLastName] = useState("")
  const [searchIdNumber, setSearchIdNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [creatingVisitForPatientId, setCreatingVisitForPatientId] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    gender: "Male",
    dob: "",
    phone: "",
    id_number: "",
    address: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    clinic: "GENERAL",
    payment_type: "CASH",
    service_id: ""
  })

  useEffect(() => {
    loadPatients()
    loadServices()
    loadClearedInvoices()
    const interval = setInterval(loadClearedInvoices, 10000)
    return () => clearInterval(interval)
  }, [])

  const resetForm = () => {
    setForm({
      first_name: "",
      last_name: "",
      gender: "Male",
      dob: "",
      phone: "",
      id_number: "",
      address: "",
      next_of_kin_name: "",
      next_of_kin_phone: "",
      clinic: "GENERAL",
      payment_type: "CASH",
      service_id: ""
    })
  }

  async function loadPatients() {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })

    setPatients(data || [])
  }

  async function loadServices() {
    const { data } = await supabase
      .from("services")
      .select("id,name,price")
      .order("name")
    setServices(data || [])
  }

  async function loadClearedInvoices() {
    const { data } = await supabase
      .from("invoices")
      .select(`
        id,
        invoice_number,
        total_amount,
        paid_amount,
        patient_id,
        patients(id, first_name, last_name),
        invoice_items(id, item_id, item_type, description)
      `)
      .eq("status", "paid")
      .is("visit_id", null)
      .order("created_at", { ascending: true })

    const receptionInvoices = (data || []).filter((invoice: any) =>
      invoice.invoice_items?.some((item: any) => item.item_type === "reception_service")
    )
    setClearedInvoices(receptionInvoices)
  }

  const normalize = (value: string) => value.trim().toLowerCase()

  const findExistingPatient = () => {
    const firstName = normalize(form.first_name)
    const lastName = normalize(form.last_name)
    const idNumber = normalize(form.id_number)

    return patients.find((patient) => {
      const patientFirstName = normalize(patient.first_name || "")
      const patientLastName = normalize(patient.last_name || "")
      const patientIdNumber = normalize(patient.id_number || "")

      const nameMatches =
        firstName.length > 0 &&
        lastName.length > 0 &&
        patientFirstName === firstName &&
        patientLastName === lastName

      const idMatches = idNumber.length > 0 && patientIdNumber === idNumber

      return nameMatches || idMatches
    })
  }

  const findPatientFromSearch = () => {
    const firstName = normalize(searchFirstName)
    const lastName = normalize(searchLastName)
    const idNumber = normalize(searchIdNumber)

    return patients.find((patient) => {
      const patientFirstName = normalize(patient.first_name || "")
      const patientLastName = normalize(patient.last_name || "")
      const patientIdNumber = normalize(patient.id_number || "")

      const firstNameMatches = !firstName || patientFirstName === firstName
      const lastNameMatches = !lastName || patientLastName === lastName
      const idNumberMatches = !idNumber || patientIdNumber === idNumber

      return firstNameMatches && lastNameMatches && idNumberMatches
    })
  }

  async function createVisitForPatient(patient: any) {
    try {
      setCreatingVisitForPatientId(patient.id)

      const selectedService = services.find((service) => service.id === form.service_id)
      if (!selectedService) throw new Error("Select a service before creating the visit")

      const visitType = selectedService.name
      const servicePrice = Number(selectedService.price || 0)
      const clinic = form.clinic || "GENERAL"
      const paymentMethod = form.payment_type || "Cash"

      if (servicePrice > 0) {
        const { data: invoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            patient_id: patient.id,
            invoice_number: `INV-${Date.now()}`,
            status: PAYMENT_STATUS.UNPAID,
            total_amount: servicePrice,
            paid_amount: 0,
            balance: servicePrice,
          })
          .select()
          .single()

        if (invoiceError) throw new Error(`Billing request failed: ${invoiceError.message}`)

        const { error: itemError } = await supabase.from("invoice_items").insert({
          invoice_id: invoice.id,
          item_type: "reception_service",
          item_id: form.service_id,
          description: selectedService.name,
          quantity: 1,
          unit_price: servicePrice,
          total_price: servicePrice,
        })

        if (itemError) {
          await supabase.from("invoices").delete().eq("id", invoice.id)
          throw new Error(`Billing item failed: ${itemError.message}`)
        }

        alert(`Invoice ${invoice.invoice_number} created for ${patient.first_name} ${patient.last_name}. Send the patient to Finance.`)
        resetForm()
        setSearchFirstName("")
        setSearchLastName("")
        setSearchIdNumber("")
        await loadPatients()
        return
      }

      const { data: visit, error: visitError } = await supabase.from("visits").insert({
        patient_id: patient.id,
        visit_type: visitType,
        clinic,
        payment_method: paymentMethod,
        payment_status: servicePrice > 0 ? PAYMENT_STATUS.UNPAID : PAYMENT_STATUS.PAID,
        visit_no: `OPD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        status: VISIT_STATUS.TRIAGE,
        triage_status: TRIAGE_STATUS.PENDING
      }).select().single()

      if (visitError) throw visitError

      alert(`Free-service visit created for ${patient.first_name} ${patient.last_name}. Patient is ready for triage.`)
      resetForm()
      setSearchFirstName("")
      setSearchLastName("")
      setSearchIdNumber("")
      await loadPatients()
    } catch (error: any) {
      alert("Error creating visit: " + error.message)
    } finally {
      setCreatingVisitForPatientId(null)
    }
  }

  const inferClinic = (description: string) => {
    const value = description.toLowerCase()
    if (value.includes("dental") || value.includes("tooth") || value.includes("teeth")) return "DENTAL"
    if (value.includes("postnatal")) return "POSTNATAL"
    if (value.includes("antenatal") || value.includes("anc")) return "ANC"
    if (value.includes("maternity") || value.includes("obstetric")) return "MATERNITY"
    return "GENERAL"
  }

  async function createVisitFromPaidInvoice(invoice: any) {
    try {
      setLoadingCleared(true)
      const item = invoice.invoice_items?.find((entry: any) => entry.item_type === "reception_service")
      if (!item) throw new Error("The invoice has no reception service")

      const { data: visit, error: visitError } = await supabase
        .from("visits")
        .insert({
          patient_id: invoice.patient_id,
          visit_type: item.description,
          clinic: inferClinic(item.description || ""),
          payment_method: "PAID",
          payment_status: PAYMENT_STATUS.PAID,
          visit_no: `OPD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          status: VISIT_STATUS.TRIAGE,
          triage_status: TRIAGE_STATUS.PENDING,
        })
        .select()
        .single()

      if (visitError) throw visitError

      const { data: linkedInvoice, error: linkError } = await supabase
        .from("invoices")
        .update({ visit_id: visit.id })
        .eq("id", invoice.id)
        .is("visit_id", null)
        .select("id")
        .maybeSingle()

      if (linkError || !linkedInvoice) {
        await supabase.from("visits").delete().eq("id", visit.id)
        throw new Error(linkError?.message || "This payment was already used to create a visit")
      }

      alert(`${invoice.patients?.first_name} ${invoice.patients?.last_name} has been sent to triage.`)
      await loadClearedInvoices()
    } catch (error: any) {
      alert(`Unable to create visit: ${error.message}`)
    } finally {
      setLoadingCleared(false)
    }
  }

  function onChange(e: any) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function registerPatient() {
    try {
      setIsSubmitting(true)

      if (!form.first_name.trim() || !form.last_name.trim() || !form.dob || !form.service_id) {
        throw new Error("First name, last name, date of birth, and service are required")
      }

      const existingPatient = findExistingPatient()

      if (existingPatient) {
        await createVisitForPatient(existingPatient)
        return
      }

      const { data: newPatient, error } = await supabase
        .from("patients")
        .insert({
          first_name: form.first_name,
          last_name: form.last_name,
          gender: form.gender,
          dob: form.dob,
          phone: form.phone,
          id_number: form.id_number,
          address: form.address,
          next_of_kin_name: form.next_of_kin_name,
          next_of_kin_phone: form.next_of_kin_phone
        })
        .select()
        .single()

      if (error) throw error
      if (!newPatient) throw new Error("Patient record was not returned")

      await createVisitForPatient(newPatient)
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Patient Registration</h2>

      <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-emerald-950">Payments confirmed — ready for visit</h3>
            <p className="text-sm text-emerald-800">Finance-approved registrations waiting to be sent to triage.</p>
          </div>
          <button type="button" onClick={loadClearedInvoices} className="rounded border border-emerald-300 bg-white px-3 py-2 text-sm text-emerald-800">Refresh</button>
        </div>
        {clearedInvoices.length === 0 ? (
          <p className="text-sm text-emerald-800">No paid registrations are waiting.</p>
        ) : (
          <div className="space-y-2">
            {clearedInvoices.map((invoice) => (
              <div key={invoice.id} className="flex flex-col justify-between gap-3 rounded-md border bg-white p-3 sm:flex-row sm:items-center">
                <div>
                  <p className="font-medium">{invoice.patients?.first_name} {invoice.patients?.last_name}</p>
                  <p className="text-sm text-gray-600">{invoice.invoice_number} · {invoice.invoice_items?.[0]?.description} · KES {Number(invoice.paid_amount || invoice.total_amount || 0).toLocaleString()}</p>
                </div>
                <button type="button" disabled={loadingCleared} onClick={() => createVisitFromPaidInvoice(invoice)} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  Create visit & send to triage
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 border p-4 rounded bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Search Existing Patient</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={searchFirstName}
            onChange={(e) => setSearchFirstName(e.target.value)}
            placeholder="Search first name"
            className="border p-2 rounded"
          />
          <input
            value={searchLastName}
            onChange={(e) => setSearchLastName(e.target.value)}
            placeholder="Search last name"
            className="border p-2 rounded"
          />
          <input
            value={searchIdNumber}
            onChange={(e) => setSearchIdNumber(e.target.value)}
            placeholder="Search ID number"
            className="border p-2 rounded"
          />
          <button
            type="button"
            onClick={() => {
              const matchedPatient = findPatientFromSearch()
              if (!matchedPatient) {
                alert("No matching patient found.")
                return
              }

              void createVisitForPatient(matchedPatient)
            }}
            disabled={creatingVisitForPatientId !== null}
            className="bg-green-600 text-white p-3 rounded disabled:opacity-50"
          >
            {creatingVisitForPatientId ? "Preparing Bill..." : "Send Found Patient to Billing"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border p-6 rounded">
        {/* (ALL INPUTS REMAIN SAME — NO CHANGE) */}

        <input name="first_name" placeholder="First Name" value={form.first_name} onChange={onChange} className="border p-2 rounded"/>
        <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={onChange} className="border p-2 rounded"/>

        <select name="gender" value={form.gender} onChange={onChange} className="border p-2 rounded">
          <option>Male</option>
          <option>Female</option>
        </select>

        <input type="date" name="dob" value={form.dob} onChange={onChange} className="border p-2 rounded"/>

        <input name="phone" placeholder="Phone" value={form.phone} onChange={onChange} className="border p-2 rounded"/>
        <input name="id_number" placeholder="ID Number" value={form.id_number} onChange={onChange} className="border p-2 rounded"/>

        <input name="address" placeholder="Address" value={form.address} onChange={onChange} className="border p-2 rounded col-span-2"/>

        <input name="next_of_kin_name" placeholder="Next of Kin Name" value={form.next_of_kin_name} onChange={onChange} className="border p-2 rounded"/>
        <input name="next_of_kin_phone" placeholder="Next of Kin Phone" value={form.next_of_kin_phone} onChange={onChange} className="border p-2 rounded"/>

        <select name="clinic" value={form.clinic} onChange={onChange} className="border p-2 rounded">
          <option value="GENERAL">General OPD</option>
          <option value="DENTAL">Dental</option>
          <option value="MATERNITY">Maternity</option>
          <option value="ANC">Antenatal clinic</option>
          <option value="POSTNATAL">Postnatal clinic</option>
        </select>

        <select name="payment_type" value={form.payment_type} onChange={onChange} className="border p-2 rounded">
          <option value="CASH">Cash</option>
          <option value="MPESA">M-Pesa</option>
          <option value="SHA">SHA</option>
          <option value="MAKL">MAKL</option>
          <option value="PRIVATE_INSURANCE">Private insurance</option>
        </select>

        <select name="service_id" value={form.service_id} onChange={onChange} className="col-span-2 border p-2 rounded" required>
          <option value="">Select consultation or service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — KES {Number(service.price || 0).toLocaleString()}
            </option>
          ))}
        </select>

        <button
          onClick={registerPatient}
          disabled={isSubmitting || creatingVisitForPatientId !== null}
          className="col-span-2 bg-blue-600 text-white p-3 rounded mt-4 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Complete Registration"}
        </button>
      </div>
    </div>
  )
}
