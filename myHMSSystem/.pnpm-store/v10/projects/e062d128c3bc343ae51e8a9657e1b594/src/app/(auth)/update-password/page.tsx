"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert("Password updated successfully!")
    }
  }

  return (
    <form onSubmit={handleUpdate} className="p-10">
      <input
        type="password"
        placeholder="New password"
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      <button className="bg-green-600 text-white p-2 rounded">
        Update Password
      </button>
    </form>
  )
}