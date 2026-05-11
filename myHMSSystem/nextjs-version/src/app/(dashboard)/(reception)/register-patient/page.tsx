"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function RegisterPatientTableForm() {
  const [patients, setPatients] = useState<any[]>([])
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
    payment_type: "CASH"
  })

  useEffect(() => {
    loadPatients()
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
      payment_type: "CASH"
    })
  }

  async function loadPatients() {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })

    setPatients(data || [])
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

      const visitType = "General"
      const clinic = form.clinic || "GENERAL"
      const paymentMethod = form.payment_type || "Cash"

      const { error: visitError } = await supabase.from("visits").insert({
        patient_id: patient.id,
        visit_type: visitType,
        clinic,
        payment_method: paymentMethod,
        payment_status: "paid",
        visit_no: `OPD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "TRIAGE",
        triage_status: "pending"
      })

      if (visitError) throw visitError

      alert(`Visit created for ${patient.first_name} ${patient.last_name}.`)
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

  function onChange(e: any) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function registerPatient() {
    try {
      setIsSubmitting(true)

      const existingPatient = findExistingPatient()

      if (existingPatient) {
        await createVisitForPatient(existingPatient)
        return
      }

      const { error } = await supabase
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

      if (error) throw error

      alert("Patient registered successfully.")

      resetForm()
      await loadPatients()
    } catch (error: any) {
      alert("Error: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Patient Registration</h2>

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
            {creatingVisitForPatientId ? "Creating Visit..." : "Create Visit for Found Patient"}
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

        <button
          onClick={registerPatient}
          disabled={isSubmitting || creatingVisitForPatientId !== null}
          className="col-span-2 bg-blue-600 text-white p-3 rounded mt-4 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Register Patient"}
        </button>
      </div>
    </div>
  )
}