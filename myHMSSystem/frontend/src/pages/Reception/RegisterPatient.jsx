import { useState } from "react"
import { supabase } from "../../services/supabase"

function RegisterPatient() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Male",
    dob: "",
    phone: "",
    idNumber: "",
    address: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
  })

  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const [error, setError] = useState("")

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setCreated(null)

    const { data, error } = await supabase
      .from("patients")
      .insert({
        first_name: form.firstName,
        last_name: form.lastName,
        gender: form.gender,
        dob: form.dob || null,
        phone: form.phone || null,
        id_number: form.idNumber || null,
        address: form.address || null,
        next_of_kin_name: form.nextOfKinName || null,
        next_of_kin_phone: form.nextOfKinPhone || null,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setCreated(data)
      setForm({
        firstName: "",
        lastName: "",
        gender: "Male",
        dob: "",
        phone: "",
        idNumber: "",
        address: "",
        nextOfKinName: "",
        nextOfKinPhone: "",
      })
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h3>Register Patient</h3>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {created && (
        <p style={{ color: "green" }}>
          Patient created: <b>{created.patient_no}</b> —{" "}
          {created.first_name} {created.last_name}
        </p>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={onChange} required />
        <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={onChange} required />
        <select name="gender" value={form.gender} onChange={onChange}>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        <input type="date" name="dob" value={form.dob} onChange={onChange} />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={onChange} />
        <input name="idNumber" placeholder="ID Number" value={form.idNumber} onChange={onChange} />
        <input name="address" placeholder="Address" value={form.address} onChange={onChange} />
        <input name="nextOfKinName" placeholder="Next of Kin Name" value={form.nextOfKinName} onChange={onChange} />
        <input name="nextOfKinPhone" placeholder="Next of Kin Phone" value={form.nextOfKinPhone} onChange={onChange} />
        <button disabled={loading} type="submit">
          {loading ? "Saving..." : "Register Patient"}
        </button>
      </form>
    </div>
  )
}

export default RegisterPatient
