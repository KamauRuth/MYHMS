"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function LabTestMaster() {
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadTests()
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("lab_test_master")
      .select("category")
      .not("category", "is", null)

    if (error) {
      console.error("Failed to load categories", error)
    } else {
      // Get unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))]
      setCategories(uniqueCategories.sort())
    }
  }

  const loadTests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("lab_test_master")
      .select("*")
      .order("category", { ascending: true })
      .order("test_name", { ascending: true })

    if (error) {
      console.error("Failed to load tests", error)
    } else {
      setTests(data || [])
    }
    setLoading(false)
  }

  const addTest = async (test: any) => {
    const { error } = await supabase
      .from("lab_test_master")
      .insert([test])

    if (error) {
      console.error("Failed to add test", error)
      alert("Could not add test")
    } else {
      loadTests()
    }
  }

  const deleteTest = async (id: string) => {
    const { error } = await supabase
      .from("lab_test_master")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Failed to delete test", error)
    } else {
      loadTests()
    }
  }

  if (loading) return <p className="p-6">Loading tests...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Lab Test Master</h1>
        <p className="text-gray-600 mb-4">Manage laboratory test catalog with WHO-aligned categories</p>

        <div className="space-y-4">
          {categories.map(category => (
            <div key={category} className="border rounded p-4">
              <h3 className="font-semibold text-lg mb-2">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {tests.filter(t => t.category === category).map(test => (
                  <div key={test.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span>{test.test_name}</span>
                    <button
                      onClick={() => deleteTest(test.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Add New Test</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              addTest({
                test_name: formData.get("test_name"),
                test_code: formData.get("test_code"),
                category: formData.get("category"),
                sample_type: formData.get("sample_type"),
                turnaround_time_minutes: formData.get("turnaround_time"),
                price: formData.get("price")
              })
              ;(e.target as HTMLFormElement).reset()
            }}
            className="grid grid-cols-2 gap-4"
          >
            <input name="test_name" placeholder="Test Name" required className="border rounded px-3 py-2" />
            <input name="test_code" placeholder="Test Code" required className="border rounded px-3 py-2" />
            <select name="category" required className="border rounded px-3 py-2">
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input name="sample_type" placeholder="Sample Type (Blood, Urine, etc.)" className="border rounded px-3 py-2" />
            <input name="turnaround_time" placeholder="Turnaround Time (Minutes)" type="number" className="border rounded px-3 py-2" />
            <input name="price" placeholder="Price" type="number" step="0.01" className="border rounded px-3 py-2" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Add Test
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}