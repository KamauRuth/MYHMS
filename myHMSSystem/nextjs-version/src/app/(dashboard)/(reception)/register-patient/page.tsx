"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { date, uuid } from "zod"
import { fi } from "date-fns/locale"
import { log } from "node:console"

export default function RegisterPatient() {
  const supabase = createClient()
  const router = useRouter()


  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [gender, setGender] = useState("Male")
  const [dob, setDob] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [phone, setPhone] = useState("")
  const [nextofKinName, setNextOfKinName] = useState("")
  const [nextOfKinPhone, setNextOfKinPhone] = useState("")
  const [address, setAddress] = useState("")
  const [modeofPayment, setModeOfPayment] = useState("")
  const [insuaranceProvider, setInsuranceProvider] = useState("")
  const [services, setServices] = useState<string[]>([])    





  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

async function handleRegister(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setErrorMsg("")

  // 1️⃣ Insert patient AND return inserted row
  const { data: patientData, error } = await supabase
    .from("patients")
    .insert([
      {
        first_name: firstName,
        last_name: lastName,
        gender,
        dob,
        phone,
        id_number: idNumber,
        address,
        next_of_kin_name: nextofKinName,
        next_of_kin_phone: nextOfKinPhone,
        mode_of_payment: modeofPayment,
        insurance_provider: insuaranceProvider,
        services: services,
        payment_status: "not_paid"
      }
    ])
    .select()
    .single()

  if (error) {
    setErrorMsg(error.message)
    setLoading(false)
    return
  }

  const patientId = patientData.id

  // 2️⃣ Calculate totalAmount (example: consultation 500 for now)
  const totalAmount = 500

  // 3️⃣ Generate invoice number
  const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number")

  // 4️⃣ Create invoice
  await supabase.from("invoices").insert({
    patient_id: patientId,
    invoice_number: invoiceNumber,
    total_amount: totalAmount,
    status: "unpaid"
  })

  setLoading(false)
  alert("Patient registered and invoice created!")
  router.push("/view-patients")
}

  return (
    
    <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto">

      <h2 className="text-2xl font-bold">Register Patient</h2>

      <input
        type="text"
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <input
        type="text"
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />

      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>

      <input
        type="date"
        placeholder="Date of Birth"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        className="w-full border p-2 rounded"
        required
      />    


      <input
        type="text"
        placeholder="ID Number"
        value={idNumber}
        onChange={(e) => setIdNumber(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="tel"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="text"
        placeholder="Next of Kin Name"
        value={nextofKinName}
        onChange={(e) => setNextOfKinName(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        type="tel"
        placeholder="Next of Kin Phone"
        value={nextOfKinPhone}
        onChange={(e) => setNextOfKinPhone(e.target.value)}
        className="w-full border p-2 rounded"
      />

    
    <select 
        value={modeofPayment}
        onChange={(e) => setModeOfPayment(e.target.value)}
        className="w-full border p-2 rounded"
        >
          <option value="">Select Mode of Payment</option>
            <option value="Cash">Cash</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Insurance">Insurance</option>
            <option value="Credit-card">Credit Card</option>
     </select>
    
      <input
        type="text"
        placeholder="Insurance Provider"
        value={insuaranceProvider}
        onChange={(e) => setInsuranceProvider(e.target.value)}
        className="w-full border p-2 rounded"
      />    

      {errorMsg && <p className="text-red-500">{errorMsg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        {loading ? "Registering..." : "Register Patient"}
      </button>
    </form>
  )
}