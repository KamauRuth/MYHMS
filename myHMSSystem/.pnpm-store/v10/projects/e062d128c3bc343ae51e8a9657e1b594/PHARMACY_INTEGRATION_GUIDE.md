# PHARMACY MODULE - INTEGRATION GUIDE
## Connecting Pharmacy with OPD, IPD, Theatre, Lab, Maternity, and CWC

---

## 1️⃣ OPD (Outpatient Department) Integration

### Current Flow:
```
1. Doctor writes prescription in OPD
2. Patient goes to pharmacy
3. Pharmacist manually looks for prescription
4. Stock is dispensed manually
5. Billing is posted manually
```

### Desired Flow:
```
1. Doctor writes prescription in OPD
2. System auto-sends to pharmacy queue
3. Pharmacist views in prescriptions page
4. Clicks "Dispense" 
5. Stock auto-deducted
6. Revenue auto-posted to patient bill
```

### Implementation Steps:

#### Step 1: Modify OPD Prescription Creation
**File:** `src/app/(dashboard)/(opd)/opd-visit/page.tsx`

**Current Code:**
```typescript
// When doctor creates prescription
const savePrescription = async () => {
  // Save to local state...
}
```

**Update to:**
```typescript
const savePrescription = async (prescriptionData: any) => {
  // 1. Create prescription in pharmacy schema
  const { data: prescData, error: prescError } = await supabase
    .from("prescriptions")
    .insert({
      prescription_number: `RX-${Date.now()}`,
      patient_id: patientId,
      visit_id: visitId,
      prescribed_by: userId,
      department: "opd",
      source_type: "opd_visit",
      source_id: visitId,
      status: "pending",
    })
    .select()

  // 2. For each drug in prescription
  for (const drug of prescriptionData.drugs) {
    await supabase
      .from("prescription_items")
      .insert({
        prescription_id: prescData[0].id,
        drug_id: drug.id,
        quantity_prescribed: drug.quantity,
        frequency: drug.frequency,
        route: drug.route,
        special_instructions: drug.instructions,
        status: "pending",
      })
  }
  
  alert("Prescription sent to pharmacy!")
}
```

#### Step 2: Create Pharmacy Prescription Table Link

**Query OPD Visits to Prescriptions:**
```typescript
// In pharmacy/prescriptions/page.tsx
const { data } = await supabase
  .from("prescriptions")
  .select(`
    *,
    prescription_items (
      *,
      drugs (*)
    ),
    patients (*)
  `)
  .eq("department", "opd")
  .eq("status", "pending")
```

#### Step 3: Auto-Deduct Stock on Dispensing

**When Pharmacist Clicks "Dispense":**
```typescript
const dispenseMedication = async (prescriptionItemId: string) => {
  // 1. Find drug batch with stock (FIFO - oldest first)
  const { data: batch } = await supabase
    .from("drug_batches")
    .select("*")
    .eq("drug_id", itemData.drug_id)
    .gt("quantity_in_stock", 0)
    .lt("expiry_date", tomorrow) // Not expired
    .order("received_date", { ascending: true }) // Oldest first
    .limit(1)

  // 2. Deduct stock
  await supabase
    .from("drug_batches")
    .update({
      quantity_in_stock: batch[0].quantity_in_stock - quantity_dispensed
    })
    .eq("id", batch[0].id)

  // 3. Record dispensing
  await supabase
    .from("pharmacy_dispensing")
    .insert({
      prescription_item_id: prescriptionItemId,
      batch_id: batch[0].id,
      quantity_dispensed: quantity_dispensed,
      cost_price_total: batch[0].unit_cost * quantity_dispensed,
      selling_price_total: batch[0].selling_price * quantity_dispensed,
    })

  // 4. Record stock movement (audit trail)
  await supabase
    .from("stock_movements")
    .insert({
      batch_id: batch[0].id,
      movement_type: "dispense_opd",
      quantity: quantity_dispensed,
      moved_by: pharmacistId,
      department: "opd",
      reference_id: prescriptionItemId,
      related_patient_id: patientId,
    })

  // 5. Update prescription item status
  await supabase
    .from("prescription_items")
    .update({ status: "dispensed", quantity_dispensed: quantity_dispensed })
    .eq("id", prescriptionItemId)
}
```

#### Step 4: Auto-Post to Billing

**When Dispensing Completes:**
```typescript
const autoPostToBilling = async (dispensingId: string) => {
  const { data: dispensing } = await supabase
    .from("pharmacy_dispensing")
    .select("*, prescription_items(patient_id, prescription_id)")
    .eq("id", dispensingId)
    .single()

  // Create billing entry
  await supabase
    .from("patient_bills") // Your billing table
    .insert({
      patient_id: dispensing.prescription_items.patient_id,
      description: `Pharmacy: ${drugName}`,
      amount: dispensing.selling_price_total,
      department: "pharmacy",
      reference_type: "pharmacy_dispensing",
      reference_id: dispensingId,
      date: new Date().toISOString(),
    })
}
```

---

## 2️⃣ IPD (Inpatient Department) Integration

### Desired Flow:
```
1. Doctor prescribes for admission
2. Medications prescribed per admission
3. Pharmacy tracks daily usage per patient
4. Auto-deduct per administration (not all at once)
5. Charge per dose/day to admission bill
```

### Implementation:

#### Step 1: Modify IPD Prescription to Include Admission Link

**File:** Would need to modify IPD prescription creation

```typescript
// When admitting patient and prescribing
const prescribeForAdmission = async (admissionId: string, drugs: any[]) => {
  const { data: prescription } = await supabase
    .from("prescriptions")
    .insert({
      prescription_number: `RX-IPD-${admissionId}-${Date.now()}`,
      patient_id: patientId,
      visit_id: admissionId, // Using admission as visit reference
      prescribed_by: doctorId,
      department: "ipd",
      source_type: "ipd_admission",
      source_id: admissionId,
      status: "pending",
    })
    .select()

  // Create items with special handling for per-dose
  for (const drug of drugs) {
    await supabase
      .from("prescription_items")
      .insert({
        prescription_id: prescription[0].id,
        drug_id: drug.id,
        quantity_prescribed: drug.quantity_per_dose,
        frequency: drug.frequency, // "BD", "TDS", "QID", etc.
        duration_days: drug.duration,
        route: drug.route,
      })
  }
}
```

#### Step 2: Track Per-Dose Usage

**Pharmacy tracks each administration:**
```typescript
const recordIPDAdministration = async (
  prescriptionItemId: string,
  admissionId: string,
  dateGiven: string
) => {
  // Deduct for this dose only
  const { data: item } = await supabase
    .from("prescription_items")
    .select("*")
    .eq("id", prescriptionItemId)
    .single()

  // Get correct batch
  const { data: batch } = await supabase
    .from("drug_batches")
    .select("*")
    .eq("drug_id", item.drug_id)
    .gt("quantity_in_stock", 0)
    .order("received_date", { ascending: true })
    .limit(1)

  // Deduct 1 dose
  await supabase
    .from("pharmacy_dispensing")
    .insert({
      prescription_item_id: prescriptionItemId,
      batch_id: batch[0].id,
      quantity_dispensed: 1, // One dose
      cost_price_total: batch[0].unit_cost,
      selling_price_total: batch[0].selling_price,
      notes: `IPD Administration - Admission: ${admissionId} - Date: ${dateGiven}`,
    })

  // Record movement
  await supabase
    .from("stock_movements")
    .insert({
      batch_id: batch[0].id,
      movement_type: "dispense_ipd",
      quantity: 1,
      moved_by: nurseId,
      department: "ipd",
      reference_id: admissionId,
      related_patient_id: patientId,
    })

  // Auto-post to admission bill
  await supabase
    .from("patient_bills")
    .insert({
      admission_id: admissionId,
      description: `IPD Medication: ${drugName}`,
      amount: batch[0].selling_price,
      department: "pharmacy",
      date: dateGiven,
    })
}
```

---

## 3️⃣ THEATRE (Operating Theatre) Integration

### Desired Flow:
```
1. Surgeon confirms drugs needed for surgery
2. Anesthesia drugs,  IV fluids auto-listed
3. After surgery: Auto-deduct all used drugs
4. Charge to surgery case bill
```

### Implementation:

```typescript
// In theatre confirmed cases
const autoDeductTheatreDrugs = async (caseId: string, usedDrugs: any[]) => {
  for (const drug of usedDrugs) {
    // Get batch
    const { data: batch } = await supabase
      .from("drug_batches")
      .select("*")
      .eq("drug_id", drug.id)
      .gt("quantity_in_stock", 0)
      .order("received_date", { ascending: true })
      .limit(1)

    // Deduct
    await supabase
      .from("pharmacy_dispensing")
      .insert({
        batch_id: batch[0].id,
        quantity_dispensed: drug.quantity_used,
        cost_price_total: batch[0].unit_cost * drug.quantity_used,
        selling_price_total: batch[0].selling_price * drug.quantity_used,
        notes: `Theatre Case: ${caseId}`,
      })

    // Record movement
    await supabase
      .from("stock_movements")
      .insert({
        batch_id: batch[0].id,
        movement_type: "dispense_theatre",
        quantity: drug.quantity_used,
        moved_by: surgeonId,
        department: "theatre",
        reference_id: caseId,
        related_patient_id: patientId,
      })
  }

  // Auto-post to surgery bill
  const totalCost = usedDrugs.reduce((sum, d) => 
    sum + (d.unit_price * d.quantity_used), 0
  )
  
  await supabase
    .from("patient_bills")
    .insert({
      case_id: caseId,
      description: "Theatre Medications & Consumables",
      amount: totalCost,
      department: "theatre_pharmacy",
    })
}
```

---

## 4️⃣ LABORATORY Integration

### Desired Flow:
```
1. Lab requests reagents/consumables
2. Pharmacy deducts from inventory
3. Track as "Lab Internal Usage"
4. Charge to lab cost center
```

### Implementation:

```typescript
const deductLabReagents = async (labRequestId: string, reagents: any[]) => {
  for (const reagent of reagents) {
    const { data: batch } = await supabase
      .from("drug_batches")
      .select("*")
      .eq("drug_id", reagent.id)
      .gt("quantity_in_stock", 0)
      .order("received_date", { ascending: true })
      .limit(1)

    // Deduct
    await supabase
      .from("pharmacy_dispensing")
      .insert({
        batch_id: batch[0].id,
        quantity_dispensed: reagent.quantity_used,
        cost_price_total: batch[0].unit_cost * reagent.quantity_used,
        selling_price_total: batch[0].selling_price * reagent.quantity_used,
        notes: `Lab Request: ${labRequestId}`,
      })

    // Record as lab internal usage
    await supabase
      .from("stock_movements")
      .insert({
        batch_id: batch[0].id,
        movement_type: "dispense_lab",
        quantity: reagent.quantity_used,
        department: "lab",
        reference_id: labRequestId,
      })
  }
}
```

---

## 5️⃣ MATERNITY Integration

### Desired Flow:
```
1. Delivery/maternity procedures
2. Auto-deduct: Oxytocin, Magnesium sulphate, antibiotics, IV fluids
3. Emergency stock flagged separately
4. Charge to maternity bill
```

### Implementation:

```typescript
const deductMaternityDrugs = async (deliveryId: string, isEmergency: boolean) => {
  const maternityDrugs = [
    { name: "Oxytocin", drug_id: "...", quantity: 1 },
    { name: "Magnesium Sulphate", drug_id: "...", quantity: 1 },
  ]

  for (const drug of maternityDrugs) {
    const { data: batch } = await supabase
      .from("drug_batches")
      .select("*")
      .eq("drug_id", drug.drug_id)
      .gt("quantity_in_stock", 0)
      .order("received_date", { ascending: true })
      .limit(1)

    await supabase
      .from("pharmacy_dispensing")
      .insert({
        batch_id: batch[0].id,
        quantity_dispensed: drug.quantity,
        cost_price_total: batch[0].unit_cost * drug.quantity,
        selling_price_total: batch[0].selling_price * drug.quantity,
      })

    await supabase
      .from("stock_movements")
      .insert({
        batch_id: batch[0].id,
        movement_type: "dispense_maternity",
        quantity: drug.quantity,
        department: "maternity",
        reference_id: deliveryId,
        adjustment_reason: isEmergency ? "Emergency delivery" : "Normal delivery",
      })
  }
}
```

---

## 6️⃣ CWC (Child Welfare Clinic) Integration

### Desired Flow:
```
1. Vaccination & pediatric drugs dispensed
2. Batch tracking critical for vaccines (recall ability)
3. Expiry alerts essential
4. Charge to CWC cost center
```

### Implementation:

```typescript
const dispenseCWCVaccine = async (
  childId: string,
  vaccineId: string,
  visitId: string
) => {
  // Get appropriate batch (critical for vaccines)
  const { data: batch } = await supabase
    .from("drug_batches")
    .select("*")
    .eq("drug_id", vaccineId)
    .gt("quantity_in_stock", 0)
    .lt("expiry_date", tomorrow) // Never expired vaccines!
    .order("expiry_date", { ascending: true }) // Use closest to expiry first
    .limit(1)

  if (!batch) {
    alert("CRITICAL: No valid vaccine batches available!")
    return
  }

  // Deduct
  await supabase
    .from("pharmacy_dispensing")
    .insert({
      batch_id: batch[0].id,
      quantity_dispensed: 1,
      cost_price_total: batch[0].unit_cost,
      selling_price_total: batch[0].selling_price,
    })

  // Critical: Record batch number for vaccine tracking
  await supabase
    .from("vaccination_log") // Your vaccination table
    .insert({
      child_id: childId,
      vaccine_batch_number: batch[0].batch_number,
      expiry_date: batch[0].expiry_date,
      supplier: batch[0].suppliers.supplier_name,
      visit_id: visitId,
    })

  // Record movement
  await supabase
    .from("stock_movements")
    .insert({
      batch_id: batch[0].id,
      movement_type: "dispense_cwc",
      quantity: 1,
      department: "cwc",
      reference_id: visitId,
      related_patient_id: childId,
    })
}
```

---

## 🔄 General Integration Pattern

All department integrations follow this pattern:

```typescript
1. CHECK STOCK
   ├─ Drug in stock?
   ├─ Not expired?
   └─ Quantity sufficient?

2. DEDUCT STOCK
   ├─ Update drug_batches quantity
   └─ Record in pharmacy_dispensing

3. RECORD MOVEMENT
   └─ Log in stock_movements (audit trail)

4. AUTO-POST BILLING
   ├─ Create billing entry
   ├─ Amount = selling_price_total
   └─ Link to patient/admission/case

5. UPDATE DEPARTMENT
   ├─ Send confirmation back
   └─ Show patient receipt
```

---

## 🔐 Data Validation Rules

### Before All Deductions:
```javascript
VALIDATION RULES
├─ Drug exists in master catalog
├─ Batch exists and not expired
├─ Quantity in stock >= quantity requested
├─ User has pharmacy access permission
├─ Patient/admission/case is valid
├─ Department/cost center is mapped
└─ Billing integration is enabled
```

---

## ⚡ Implementation Priority

### Phase 1 (HIGHEST):
1. OPD → Pharmacy integration
2. Auto-post to billing

### Phase 2 (HIGH):
3. IPD per-dose deduction
4. Theatre drugs auto-deduction
5. Maternity emergency tracking

### Phase 3 (MEDIUM):
6. Lab reagent tracking
7. CWC vaccine batch tracking

---

## 📝 Dependencies

- All departments must have `visit_id`, `case_id`, or `admission_id` stored in source tables
- Billing system must accept pharmacy entries
- Departments must have cost center mappings
- User authentication must include department info

---

**Last Updated:** April 2, 2026

