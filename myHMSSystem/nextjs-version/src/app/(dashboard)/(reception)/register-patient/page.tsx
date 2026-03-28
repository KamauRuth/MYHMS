"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function RegisterPatientTableForm() {
  const [patients, setPatients] = useState<any[]>([])

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

  async function loadPatients() {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })

    setPatients(data || [])
  }

  function onChange(e: any) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function registerPatient() {
    try {
      // ✅ ONLY CREATE PATIENT (NO VISIT HERE)
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

      alert("Patient registered successfully. Send to triage.")

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

      loadPatients()
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Patient Registration</h2>

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

        <button onClick={registerPatient} className="col-span-2 bg-blue-600 text-white p-3 rounded mt-4">
          Register Patient
        </button>
      </div>
    </div>
  )
}