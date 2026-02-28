"use client"

import { useEffect,useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export default function Billing(){

 const [invoices,setInvoices] = useState<any[]>([])

 useEffect(()=>{
   load()
 },[])

 async function load(){

 const {data} = await supabase
 .from("invoices")
 .select("*,patients(first_name,last_name)")
 .eq("status","unpaid")

 setInvoices(data||[])
 }

 async function pay(invoice:any){

 await supabase.from("payments").insert({
   invoice_id:invoice.id,
   amount_paid:invoice.balance,
   payment_method:"Cash"
 })

 await supabase.from("invoices")
 .update({
   paid_amount:invoice.total_amount,
   balance:0,
   status:"paid"
 })
 .eq("id",invoice.id)

 await supabase.from("patients")
 .update({payment_status:"paid"})
 .eq("id",invoice.patient_id)

 load()

 }

 return(
 <div className="p-6">

 <h1 className="text-xl font-bold">Billing</h1>

 {invoices.map(inv=>(
 <div key={inv.id}
 className="border p-3 flex justify-between">

 <div>
 {inv.patients.first_name}
 </div>

 <button
 onClick={()=>pay(inv)}
 className="bg-green-600 text-white px-3 py-1"
 >
 Approve Payment
 </button>

 </div>
 ))}

 </div>
 )

}