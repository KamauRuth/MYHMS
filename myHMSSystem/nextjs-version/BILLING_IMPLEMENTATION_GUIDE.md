# Billing Integration Implementation Guide

## What Was Done ✅

### 1. OPD Consultation Billing
**Status:** ✅ COMPLETE AND WORKING

**Changes made to** `src/app/(dashboard)/(opd)/opd-visit/page.tsx`:
- Removed: Inline `<InvoiceDisplay />` and `<PaymentForm />` components
- Removed: Billing state variables (`invoice`, `billingError`)
- Kept: `consultationFee` state for configurable pricing
- Updated: `closeConsultation()` function to silently create invoice
- Updated: Button text from "Close Consultation & Generate Invoice" to simple "Close Consultation"
- Removed: Billing UI section that showed invoice details

**Flow:**
```
User closes consultation → Invoice created silently → Message shown → Redirected to OPD
→ Invoice appears in unpaid-patients dashboard
```

### 2. Lab Tests Billing
**Status:** ✅ ALREADY WORKING

**Already in** `sendLab()` function:
- Creates invoice for visit (if not exists)
- Adds each lab test as invoice item with price
- Updates invoice totals automatically
- Shows success message

**Flow:**
```
User sends lab tests → For each test: Item added to invoice → Success message
→ Lab charges appear in unpaid-patients dashboard
```

### 3. Theatre Booking Billing
**Status:** ✅ COMPLETE AND WORKING

**Changes made to** `bookForSurgery()` function:
- Creates theatre booking as before
- Silently gets/creates invoice for visit
- Adds theatre procedure charge (default 5000 KES or from database)
- Updates invoice total
- Shows success message (non-blocking billing errors)

**Flow:**
```
User books surgery → Booking created → Theatre charge added to invoice → Success message
→ Theatre charges appear in unpaid-patients dashboard
```

---

## What Needs Implementation 📋

### 1. Pharmacy Dispensing Billing
**Status:** ⏳ NOT STARTED

**Where to add:**
- Pharmacy dispensing module (locate: `src/app/(dashboard)/(pharmacy)/` or similar)
- Specifically: When pharmacist dispenses prescription

**What to add:**
```typescript
// After dispensing drugs from stock
try {
  // Get or create invoice for visit
  let { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("visit_id", prescription.visit_id)
    .maybeSingle()

  if (!invoice) {
    const { data: newInvoice } = await supabase
      .from("invoices")
      .insert({
        visit_id: prescription.visit_id,
        patient_id: prescription.patient_id,
        invoice_number: `INV-${Date.now()}`,
        status: "unpaid",
        total_amount: 0,
        paid_amount: 0,
        balance: 0
      })
      .select()
      .single()
    invoice = newInvoice
  }

  // For each dispensed drug, add to invoice
  const dispensedDrugs = [...]; // Array of dispensed drugs with quantities
  
  for (const drug of dispensedDrugs) {
    const totalCost = drug.price * drug.quantity_dispensed
    
    await supabase.from("invoice_items").insert({
      invoice_id: invoice.id,
      item_type: "pharmacy_drug",
      item_id: drug.drug_id,
      description: `${drug.drug_name} × ${drug.quantity_dispensed}`,
      quantity: drug.quantity_dispensed,
      unit_price: drug.price,
      total_price: totalCost
    })
  }

  // Update invoice total
  const { data: items } = await supabase
    .from("invoice_items")
    .select("total_price")
    .eq("invoice_id", invoice.id)

  const total = (items || []).reduce((sum, item) => sum + item.total_price, 0)
  
  await supabase
    .from("invoices")
    .update({ total_amount: total, balance: total })
    .eq("id", invoice.id)

} catch (err) {
  console.error("Pharmacy billing error (non-blocking):", err)
  // Don't fail dispensing if billing fails
}
```

### 2. IPD (Inpatient) Admission Billing
**Status:** ⏳ NOT STARTED

**Where to add:**
- IPD admission module (locate: `src/app/(dashboard)/inpatient/` or `ipd/`)
- Specifically: When patient is admitted

**What to add:**
```typescript
// When admitting to IPD
const { data: bedType, error } = await supabase
  .from("bed_types")
  .select("daily_charge")
  .eq("id", selectedBedTypeId)
  .single()

const dailyCharge = bedType?.daily_charge || 5000

// Create initial invoice for IPD stay
const { data: invoice } = await supabase
  .from("invoices")
  .insert({
    visit_id: visit.id,
    patient_id: patient.id,
    invoice_number: `INV-IPD-${Date.now()}`,
    status: "unpaid",
    total_amount: dailyCharge,
    paid_amount: 0,
    balance: dailyCharge
  })
  .select()
  .single()

// Add bed charge as first item
await supabase.from("invoice_items").insert({
  invoice_id: invoice.id,
  item_type: "ipd_bed",
  item_id: admission.id,
  description: `IPD Bed (${selectedWardName}) - Day 1`,
  quantity: 1,
  unit_price: dailyCharge,
  total_price: dailyCharge
})

// Update visit with invoice reference
await supabase
  .from("visits")
  .update({ invoice_id: invoice.id, status: "ADMITTED" })
  .eq("id", visit.id)
```

**On Discharge:**
```typescript
// Calculate length of stay
const admissionDate = new Date(admission.admitted_at)
const dischargeDate = new Date()
const daysStayed = Math.ceil((dischargeDate - admissionDate) / (1000 * 60 * 60 * 24))

// Get invoice
const { data: invoice } = await supabase
  .from("invoices")
  .select("*")
  .eq("visit_id", visit.id)
  .single()

// If bed charges need updating (e.g., more than 1 day)
if (daysStayed > 1) {
  const additionalDays = daysStayed - 1
  const additionalCharge = additionalDays * dailyCharge
  
  await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    item_type: "ipd_bed",
    item_id: admission.id,
    description: `IPD Bed (${selectedWardName}) - Days 2-${daysStayed}`,
    quantity: additionalDays,
    unit_price: dailyCharge,
    total_price: additionalCharge
  })
  
  // Update invoice total
  const newTotal = invoice.total_amount + additionalCharge
  await supabase
    .from("invoices")
    .update({ total_amount: newTotal, balance: newTotal })
    .eq("id", invoice.id)
}

// Update admission status
await supabase
  .from("ipd_admissions")
  .update({ 
    discharged_at: new Date().toISOString(), 
    status: "DISCHARGED" 
  })
  .eq("id", admission.id)
```

### 3. Maternity Services Billing
**Status:** ⏳ NOT STARTED

**Where to add:**
- Maternity module (locate: `src/app/(dashboard)/(maternity)/`)
- Specifically: When selecting maternity package OR completing delivery

**What to add:**
```typescript
// When registering for maternity services
const maternityPackages = {
  "ANC_Only": 2000,
  "Normal_Delivery": 8000,
  "Cesarean": 15000,
  "Full_Package_ANC_Normal": 12000,
  "Full_Package_ANC_Cesarean": 20000,
  "PNC_Only": 1500
}

const selectedPackageCost = maternityPackages[selectedPackage]

// Create maternity invoice
const { data: invoice } = await supabase
  .from("invoices")
  .insert({
    visit_id: visit.id,
    patient_id: patient.id,
    invoice_number: `INV-MAT-${Date.now()}`,
    status: "unpaid",
    total_amount: selectedPackageCost,
    paid_amount: 0,
    balance: selectedPackageCost
  })
  .select()
  .single()

// Add maternity service item
await supabase.from("invoice_items").insert({
  invoice_id: invoice.id,
  item_type: "maternity_service",
  item_id: maternityId,
  description: `Maternity - ${selectedPackage.replace(/_/g, " ")}`,
  quantity: 1,
  unit_price: selectedPackageCost,
  total_price: selectedPackageCost
})

// Update maternity record
await supabase
  .from("maternity")
  .update({ invoice_id: invoice.id, billed: true })
  .eq("id", maternityId)
```

**On Delivery:**
```typescript
// If delivery type changes cost (e.g., planned normal but became C-section)
const actualDeliveryCost = isEmergencyCesarean ? 20000 : 8000
const originalCost = maternityRecord.package_cost
const difference = actualDeliveryCost - originalCost

if (difference > 0) {
  // Add additional charge
  await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    item_type: "maternity_service",
    item_id: maternityId,
    description: `Additional: Emergency Cesarean Section`,
    quantity: 1,
    unit_price: difference,
    total_price: difference
  })
  
  // Update invoice
  const newTotal = invoice.total_amount + difference
  await supabase
    .from("invoices")
    .update({ total_amount: newTotal, balance: newTotal })
    .eq("id", invoice.id)
}
```

### 4. Reception - Patient Registration Billing (Optional)
**Status:** ❓ OPTIONAL ENHANCEMENT

**Where to add:**
- Reception module (locate: `src/app/(dashboard)/(reception)/`)
- When patient registers and pays registration fee

**What to add:**
```typescript
// When patient registers with service selection
const serviceFees = {
  "OPD": 500,
  "ANC": 2000,
  "IPD": 'per-bed', // Calculate in IPD module
  "Dental": 1000,
  "Eye": 800
}

const registrationFee = serviceFees[selectedService] || 500

// Create registration invoice
const { data: invoice } = await supabase
  .from("invoices")
  .insert({
    visit_id: visit.id,
    patient_id: patient.id,
    invoice_number: `INV-REG-${Date.now()}`,
    status: "unpaid",
    total_amount: registrationFee,
    paid_amount: 0,
    balance: registrationFee
  })
  .select()
  .single()

// Add registration item
await supabase.from("invoice_items").insert({
  invoice_id: invoice.id,
  item_type: "registration",
  item_id: visit.id,
  description: `${selectedService} Registration`,
  quantity: 1,
  unit_price: registrationFee,
  total_price: registrationFee
})
```

---

## Testing Checklist

### ✅ Already Tested
- [x] OPD consultation closure creates invoice silently
- [x] Lab tests added to invoice on "Send to Lab"
- [x] Theatre booking adds charge silently

### ⏳ To Test
- [ ] Pharmacy dispensing adds drug costs
- [ ] IPD admission creates initial invoice
- [ ] IPD discharge updates bed charges
- [ ] Maternity registration creates service invoice
- [ ] Maternity delivery adjusts costs if needed
- [ ] All invoices appear in unpaid-patients dashboard
- [ ] Payment collection works for all invoice types
- [ ] Invoice totals calculate correctly with multiple items
- [ ] Missing data doesn't crash the system

---

## Common Patterns

### Pattern 1: Add Item to Existing Invoice
```typescript
// Use when adding test/drug/charge to existing patient invoice
let { data: invoice } = await supabase
  .from("invoices")
  .select("*")
  .eq("visit_id", visit.id)
  .maybeSingle()

// Create if doesn't exist
if (!invoice) {
  ({ data: invoice } = await supabase.from("invoices").insert({...}).select().single())
}

// Add item
await supabase.from("invoice_items").insert({
  invoice_id: invoice.id,
  item_type: "...",
  // ... rest of item
})

// Update total
const { data: items } = await supabase.from("invoice_items").select("total_price").eq("invoice_id", invoice.id)
const total = items.reduce((sum, i) => sum + i.total_price, 0)
await supabase.from("invoices").update({ total_amount: total, balance: total }).eq("id", invoice.id)
```

### Pattern 2: Non-Blocking Billing
```typescript
// Use when billing should not fail the main operation
try {
  // Billing operations
  await generateBillingForXAction(...)
} catch (err) {
  console.error("Billing error (non-blocking):", err)
  // App continues normally without showing error to user
}
```

### Pattern 3: Get Pricing from Database
```typescript
// Dynamic pricing instead of hardcoded
const { data: pricing, error } = await supabase
  .from("service_pricing_table")
  .select("cost")
  .eq("service_name", serviceName)
  .single()

const cost = pricing?.cost || fallback_amount
```

---

## Quick Links to Modules

- **OPD:** `src/app/(dashboard)/(opd)/opd-visit/page.tsx` ✅
- **Lab:** `src/app/(dashboard)/lab/` (locate lab results page)
- **Pharmacy:** `src/app/(dashboard)/(pharmacy)/` (locate dispensing page)
- **IPD:** `src/app/(dashboard)/inpatient/` or `ipd/`
- **Maternity:** `src/app/(dashboard)/(maternity)/`
- **Theatre:** `src/app/(dashboard)/theatre/` (already added to OPD)
- **Reception:** `src/app/(dashboard)/(reception)/` (patient registration)
- **Billing Dashboard:** `src/app/(dashboard)/(billing)/unpaid-patients/page.tsx` ✅

---

## Database Tables to Verify

Before implementing, ensure these tables exist with data:

```sql
-- Service pricing
SELECT * FROM lab_test_master WHERE is_active = true; -- Should have test_name, price
SELECT * FROM bed_types; -- Should have ward name, daily_charge
SELECT * FROM theatre_procedures; -- Should have procedure name, cost
SELECT * FROM drugs; -- Should have drug_name, price, reorder_level

-- Billing tables
SELECT * FROM invoices LIMIT 5; -- Check structure
SELECT * FROM invoice_items LIMIT 5; -- Check structure
SELECT * FROM payments LIMIT 5; -- Check structure
```

---

## Deployment Steps

1. **Deploy Database Schema** (if not already done)
   ```
   Location: sql/billing_integration_schema.sql
   Action: Copy and run in Supabase SQL Editor
   ```

2. **Test OPD Workflow** (Already done)
   - Should be working now

3. **Add Pharmacy Dispensing Billing**
   - Locate pharmacy module
   - Add code from "Pharmacy Dispensing Billing" section above
   - Test dispensing creates invoice items

4. **Add IPD Admission/Discharge Billing**
   - Locate IPD admission page
   - Add code from "IPD Admission Billing" section
   - Test admission creates invoice
   - Test discharge adds extra days

5. **Add Maternity Billing**
   - Locate maternity registration page
   - Add code from "Maternity Services Billing" section
   - Test registration creates invoice
   - Test delivery adjusts costs

6. **Verify All in Dashboard**
   - Open unpaid-patients dashboard
   - Should see all invoices from all departments
   - Test payment collection

---

