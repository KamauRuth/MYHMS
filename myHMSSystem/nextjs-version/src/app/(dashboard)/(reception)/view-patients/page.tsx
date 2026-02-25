"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function ViewPatients() {
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [editingPatient, setEditingPatient] = useState<any>(null)

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
    const { data } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: true })

    if (data) setPatients(data)
  }

  async function sendToTriage(patientId: string) {
    await supabase
      .from("patients")
      .update({ triage_status: "sent_to_triage" })
      .eq("id", patientId)

    fetchPatients()
  }

  async function updatePatient() {
    await supabase
      .from("patients")
      .update({
        first_name: editingPatient.first_name,
        last_name: editingPatient.last_name,
        phone: editingPatient.phone,
        address: editingPatient.address,
      })
      .eq("id", editingPatient.id)

    setEditingPatient(null)
    fetchPatients()
  }

  const filteredPatients = patients.filter((patient) =>
    `${patient.first_name} ${patient.last_name} ${patient.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Patient List</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by name or phone..."
        className="border p-2 mb-4 w-full rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">#</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Payment</th>
            <th className="border p-2">Triage</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredPatients.map((patient, index) => (
            <tr key={patient.id}>
              <td className="border p-2 text-center">{index + 1}</td>

              <td className="border p-2">
                {patient.first_name} {patient.last_name}
              </td>

              <td className="border p-2">{patient.phone}</td>

              {/* PAYMENT BADGE */}
              <td className="border p-2 text-center">
                {patient.payment_status === "paid" ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                    Paid
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs">
                    Not Paid
                  </span>
                )}
              </td>

              {/* TRIAGE BADGE */}
              <td className="border p-2 text-center">
                {patient.triage_status === "sent_to_triage" ? (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                    Sent
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                    Pending
                  </span>
                )}
              </td>

              <td className="border p-2 flex gap-2 justify-center">
                {/* SEND TO TRIAGE */}
                <button
                  onClick={() => sendToTriage(patient.id)}
                  disabled={
                    patient.payment_status !== "paid" ||
                    patient.triage_status === "sent_to_triage"
                  }
                  className={`px-3 py-1 text-white text-xs rounded
                    ${
                      patient.payment_status === "paid" &&
                      patient.triage_status !== "sent_to_triage"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                  Send
                </button>

                {/* EDIT BUTTON */}
                <button
                  onClick={() => setEditingPatient(patient)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* EDIT MODAL */}
      {editingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="font-bold mb-4">Edit Patient</h2>

            <input
              className="border p-2 w-full mb-2"
              value={editingPatient.first_name}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  first_name: e.target.value,
                })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              value={editingPatient.last_name}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  last_name: e.target.value,
                })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              value={editingPatient.phone}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  phone: e.target.value,
                })
              }
            />

            <input
              className="border p-2 w-full mb-4"
              value={editingPatient.address}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  address: e.target.value,
                })
              }
            />

            <input
              className="border p-2 w-full mb-4"
              value={editingPatient.id_number}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  id_number: e.target.value,
                })
              }
            />

            <input
              className="border p-2 w-full mb-4"
              value={editingPatient.next_of_kin_name}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  next_of_kin_name: e.target.value,
                })
              }
            />

            <input
              className="border p-2 w-full mb-4"
              value={editingPatient.next_of_kin_phone}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  next_of_kin_phone: e.target.value,
                })
              }
            />

            <select
              className="border p-2 w-full mb-4"
              value={editingPatient.gender}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  gender: e.target.value,
                })
              }
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              className="border p-2 w-full mb-4"
              value={editingPatient.mode_of_payment}
              onChange={(e) =>
                setEditingPatient({
                  ...editingPatient,
                  mode_of_payment: e.target.value,
                })
              }
            >
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Insurance">Insurance</option>
              <option value="Mobile Money">Mobile Money</option>
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingPatient(null)}
                className="px-4 py-1 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={updatePatient}
                className="px-4 py-1 bg-green-600 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}