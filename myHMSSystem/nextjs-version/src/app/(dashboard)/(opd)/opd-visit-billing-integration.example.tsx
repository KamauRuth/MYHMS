// src/app/(dashboard)/(opd)/opd-visit-billing-integration.tsx
// EXAMPLE INTEGRATION - Copy relevant parts into your opd-visit/page.tsx

"use client"

import { useState } from 'react'
import { generateBillingForOPDAction } from '@/app/actions/billingActions'
import { InvoiceDisplay, PaymentForm } from '@/components/billing/BillingComponents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BillingState {
  invoice: any | null
  loading: boolean
  error: string | null
  consultationFee: number
}

/**
 * STEP 1: Add state to your OPD Visit component
 */
export function useBillingState() {
  const [billing, setBilling] = useState<BillingState>({
    invoice: null,
    loading: false,
    error: null,
    consultationFee: 500 // Default OPD consultation fee
  })

  return { billing, setBilling }
}

/**
 * STEP 2: Create handler function for closing consultation WITH billing
 */
export async function handleCloseVisitWithBilling(
  visitId: string,
  selectedICD: any,
  router: any,
  supabase: any,
  consultationFee: number,
  setBilling: any,
  setClosing: any
) {
  if (!selectedICD) {
    alert("Diagnosis required before closing consultation")
    return
  }

  setClosing(true)

  try {
    // GENERATE INVOICE
    console.log(`[BILLING] Generating invoice for visit ${visitId}...`)
    const billingResult = await generateBillingForOPDAction(visitId, consultationFee)

    if (!billingResult.success) {
      throw new Error(billingResult.error || "Failed to generate invoice")
    }

    console.log(`[BILLING] Invoice created: ${billingResult.invoice.invoice_number}`)

    // Update UI with invoice
    setBilling((prev: any) => ({
      ...prev,
      invoice: billingResult.invoice,
      error: null
    }))

    // CLOSE CONSULTATION IN DATABASE
    const { error: consultError } = await supabase
      .from("consultations")
      .update({ 
        status: "CLOSED", 
        closed_at: new Date().toISOString() 
      })
      .eq("visit_id", visitId)

    if (consultError) throw consultError

    // UPDATE VISIT STATUS
    const { error: visitError } = await supabase
      .from("visits")
      .update({ 
        status: "COMPLETED",
        invoice_id: billingResult.invoice.id,
        billed: true,
        billing_date: new Date().toISOString()
      })
      .eq("id", visitId)

    if (visitError) throw visitError

    alert(`✅ Consultation closed successfully!\nInvoice: ${billingResult.invoice.invoice_number}`)

    // Show invoice to patient before redirecting
    // Don't redirect immediately - let user see invoice and pay if needed

  } catch (error: any) {
    console.error("[BILLING ERROR]", error)
    setBilling((prev: any) => ({
      ...prev,
      error: error.message || "An error occurred"
    }))
    alert("Error: " + (error.message || "Failed to close consultation"))
  } finally {
    setClosing(false)
  }
}

/**
 * STEP 3: UI Component to display during checkout
 */
export function BillingCheckoutSection({ 
  invoice, 
  error, 
  loading,
  onRedirect 
}: { 
  invoice?: any
  error?: string | null
  loading?: boolean
  onRedirect?: () => void 
}) {
  if (!invoice && !error && !loading) {
    return null
  }

  return (
    <Card className="mt-8 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-xl">💳 Patient Billing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg">
            Generating invoice...
          </div>
        )}

        {/* Invoice Display */}
        {invoice && (
          <>
            <InvoiceDisplay invoice={invoice} />

            {/* Payment Form - Show only if balance remains */}
            {invoice.balance > 0 && (
              <div>
                <h3 className="font-semibold mb-4">👇 Collect Payment</h3>
                <PaymentForm 
                  invoiceId={invoice.id} 
                  balance={invoice.balance} 
                />
              </div>
            )}

            {/* Paid - Show receipt */}
            {invoice.balance <= 0 && (
              <div className="p-4 bg-green-100 text-green-700 rounded-lg text-center">
                ✅ <strong>PAID IN FULL</strong>
                <p className="text-sm mt-2">Invoice: {invoice.invoice_number}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <Button 
                onClick={onRedirect}
                className="flex-1"
              >
                Continue to OPD Queue
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
              >
                Print Invoice
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * STEP 4: Integration into your existing closeConsultation function
 */

// BEFORE:
/*
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
*/

// AFTER:
export const closeConsultation = async (
  visitId: string,
  selectedICD: any,
  consultationFee: number,
  setBilling: any,
  setClosing: any,
  router: any,
  supabase: any
) => {
  // Use new billing-aware handler
  await handleCloseVisitWithBilling(
    visitId,
    selectedICD,
    router,
    supabase,
    consultationFee,
    setBilling,
    setClosing
  )
}

/**
 * STEP 5: Full page integration example
 * 
 * In your OPD Visit component:
 */

/*
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  handleCloseVisitWithBilling, 
  BillingCheckoutSection,
  useBillingState 
} from '@/app/(dashboard)/(opd)/opd-visit-billing-integration'

const supabase = createClient()

export default function OPDVisit() {
  const searchParams = useSearchParams()
  const visitId = searchParams.get("visitId")
  const router = useRouter()
  
  // Existing states...
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [selectedICD, setSelectedICD] = useState<any>(null)

  // NEW: Add billing state
  const { billing, setBilling } = useBillingState()

  // Existing code...

  // UPDATE: Replace closeConsultation with this:
  const closeConsultation = async () => {
    await handleCloseVisitWithBilling(
      visitId!,
      selectedICD,
      router,
      supabase,
      500, // consultation fee - can make this configurable
      setBilling,
      setClosing
    )
  }

  // Your existing render code...
  
  return (
    <div>
      {/* Existing consultation form */}
      
      {/* NEW: Add billing section at bottom */}
      <BillingCheckoutSection 
        invoice={billing.invoice}
        error={billing.error}
        loading={closing}
        onRedirect={() => {
          if (billing.invoice.balance <= 0) {
            router.push("/opd")
          }
        }}
      />

      {/* Close button */}
      {!billing.invoice && (
        <button 
          onClick={closeConsultation}
          disabled={closing}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {closing ? "Closing..." : "Close Consultation"}
        </button>
      )}
    </div>
  )
}
*/

/**
 * STEP 6: Add these imports to your page
 */
export const REQUIRED_IMPORTS = `
import { generateBillingForOPDAction } from '@/app/actions/billingActions'
import { InvoiceDisplay, PaymentForm } from '@/components/billing/BillingComponents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
`

/**
 * STEP 7: Environment check
 */
export function checkBillingSetup() {
  const checks = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌',
    componentsExist: true, // If imports work
  }
  
  console.table(checks)
  return Object.values(checks).every(v => v === '✅')
}

/**
 * TESTING IN BROWSER CONSOLE
 */
export const TEST_COMMANDS = `
// Test invoice generation
const result = await generateBillingForOPDAction('visit-id-here', 500);
console.log(result);

// Test payment recording
const payment = await recordPaymentAction('invoice-id-here', 500, 'cash', 'REF-123');
console.log(payment);

// Get patient invoices
const invoices = await getPatientInvoices('patient-id-here');
console.log(invoices);
`

export default BillingCheckoutSection
