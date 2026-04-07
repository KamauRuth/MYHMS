# Silent Billing System Architecture

## Overview
The billing system is a **centralized, automated module** that silently creates invoices when clinical events occur across departments. All billing data flows to the **Billing Dashboard** (`/dashboard/billing/unpaid-patients`) where staff can view and collect payments.

## Key Principle
**No inline billing UI in clinical workflows** → All billing happens in the background → Bills appear in the centralized dashboard

---

## Department Integration

### 1. **OPD (Outpatient Department)** ✅
**When triggered:** Consultation is closed
**How it works:**
```typescript
- Doctor fills in consultation details
- Selects diagnosis (ICD-11)
- Closes consultation
  → Silently triggers: generateBillingForOPDAction()
  → Creates invoice with 500 KES consultation fee
  → Updates visit status to COMPLETED
  → User sees success message (no billing UI)
```

**File:** `src/app/(dashboard)/(opd)/opd-visit/page.tsx`
**Function:** `closeConsultation()`
**Trigger:** When consultation closed
**Amount:** 500 KES (configurable via consultationFee state)

---

### 2. **Laboratory** ✅
**When triggered:** Lab tests are sent to lab
**How it works:**
```typescript
- Doctor selects lab tests 
- Clicks "Send to Lab"
  → For each test:
    - Creates lab_request
    - Gets/creates invoice for visit
    - Adds test as invoice item with price
  → User sees success message
  → Test appears in unpaid-patients dashboard
```

**File:** `src/app/(dashboard)/(opd)/opd-visit/page.tsx`
**Function:** `sendLab()`
**Trigger:** When lab tests sent
**Amount:** Test-specific pricing from `lab_test_master.price`

---

### 3. **Theatre (Surgery)** ✅
**When triggered:** Theatre booking is confirmed
**How it works:**
```typescript
- Doctor books surgery with procedure name
- Clicks "Confirm Booking"
  → Creates theatre_booking
  → Silently creates/gets invoice for visit
  → Adds theatre charge as invoice item
  → Default: 5000 KES (or from theatre_procedures table)
  → User sees success message
```

**File:** `src/app/(dashboard)/(opd)/opd-visit/page.tsx`
**Function:** `bookForSurgery()`
**Trigger:** When theatre booking confirmed
**Amount:** Procedure-specific cost (default 5000 KES)

---

### 4. **Pharmacy/Prescription** 
**When triggered:** Prescription is DISPENSED (not when created)
**Implementation needed in:**
- Pharmacy dispensing module
- When pharmacist dispenses drugs from stock
- Calculate cost from drug prices × quantity
- Add to patient's invoice

**Recommended flow:**
```typescript
- Pharmacist selects prescription
- Scans drugs and quantities
- Clicks "Dispense"
  → For each drug:
    - Deduct from stock
    - Calculate cost
    - Add to invoice (item_type: "pharmacy_drug")
  → Creates payment collection request
  → Shows in unpaid-patients dashboard
```

---

### 5. **IPD (Inpatient Department)**
**When triggered:** Patient admitted AND patient discharged
**Implementation needed in:**
- Admission module: Creates invoice with bed charge
- Discharge module: Adds additional charges (lab, drugs, procedures)

**Recommended flow:**
```typescript
// On admission:
- Receptionist admits patient
  → Selects ward (bed type determines daily rate)
  → Creates invoice with first day charge
  → Status: unpaid

// On discharge:
- Doctor schedules discharge
  → System calculates length of stay
  → Adds additional charges (if any)
  → Updates invoice balance
  → Shows in unpaid-patients for payment
```

---

### 6. **Maternity**
**When triggered:** Service package selected OR delivery completed
**Implementation needed in:**
- Maternity registration
- ANC (Antenatal Care)
- Delivery procedure
- PNC (Postnatal Care)

**Recommended flow:**
```typescript
// On ANC registration:
- Midwife registers for maternity care
  → Selects service package (ANC, delivery type, PNC)
  → Creates invoice with package cost
  → Status: unpaid

// On delivery:
- Midwife confirms delivery type (normal, C-section, etc.)
  → May adjust invoice if needed
  → Shows in unpaid-patients

// On PNC:
- Adds postnatal charges
  → Updates invoice total
```

---

### 7. **Reception (Patient Registration)**
**When triggered:** Patient registers for a service
**Enhancement opportunity:**
```typescript
When receptionist registers patient and selects initial service:
- Service selected (e.g., "Outpatient Consultation")
  → Creates initial invoice with service charge
  → Sets visit status
  → Patient can pay at reception or later
```

---

## Database Schema - Key Tables

### `invoices`
```sql
id UUID PRIMARY KEY
patient_id UUID (FK → patients)
visit_id UUID (FK → visits) -- Links to specific visit
invoice_number VARCHAR (e.g., "LPH-INV-1001")
total_amount DECIMAL (sum of all items)
paid_amount DECIMAL (running total of payments)
balance DECIMAL (total_amount - paid_amount)
status ENUM ('unpaid', 'partially_paid', 'paid')
created_at TIMESTAMP
created_by UUID (user who created invoice)
```

### `invoice_items`
```sql
id UUID PRIMARY KEY
invoice_id UUID (FK → invoices)
item_type ENUM:
  - 'opd_consultation'
  - 'lab_test'
  - 'theatre_procedure'
  - 'ipd_bed'
  - 'pharmacy_drug'
  - 'maternity_service'
item_id UUID (references specific table)
description VARCHAR
quantity INT
unit_price DECIMAL
total_price DECIMAL (quantity × unit_price)
```

### `payments`
```sql
id UUID PRIMARY KEY
invoice_id UUID (FK → invoices)
amount_paid DECIMAL
payment_method ENUM ('cash', 'card', 'mpesa', 'insurance', 'cheque')
reference_number VARCHAR (optional, for cheques/transfers)
collected_by UUID (cashier/staff)
created_at TIMESTAMP
```

---

## Billing Dashboard (`/dashboard/billing/unpaid-patients`)

### Current Features
- ✅ Shows all unpaid invoices
- ✅ Displays patient name, total amount, balance
- ✅ Payment buttons (Cash, M-Pesa)
- ✅ Shows today's revenue
- ✅ Shows total unpaid balance

### How it updates
- When new invoice created → Appears in dashboard
- When payment recorded → Invoice status changes to 'partially_paid' or 'paid'
- Auto-refreshes data on page load

### Future Enhancements
- Filter by department (OPD, Lab, etc.)
- Filter by date range
- Export to CSV for accounting
- Revenue breakdown by department
- Outstanding balance per patient
- Payment method breakdown

---

## Implementation Checklist

### ✅ Completed
- [x] OPD consultation billing
- [x] Lab tests billing
- [x] Theatre booking billing
- [x] Database schema design
- [x] Centralized unpaid-patients dashboard

### ⏳ In Progress / Pending
- [ ] Pharmacy dispensing billing
- [ ] IPD admission/discharge billing
- [ ] Maternity service billing
- [ ] Receptionist service selection billing
- [ ] Enhanced dashboard filters
- [ ] Revenue reporting module
- [ ] Payment reconciliation

---

## Server Actions Reference

### Create Invoice Silently
```typescript
// File: src/app/actions/billingActions.ts
export async function createInvoiceAction(
  patientId: string,
  items: Array<{
    item_type: string
    item_id: string
    description: string
    quantity: number
    unit_price: number
  }>,
  visitId?: string
)
// Returns: { success: true, invoice } or { success: false, error }
```

### Record Payment
```typescript
export async function recordPaymentAction(
  invoiceId: string,
  amountPaid: number,
  paymentMethod: string,
  referenceNumber?: string
)
// Updates invoice status, creates payment record
// Revalidates dashboard
```

### Generate Department-Specific Billing
```typescript
// OPD
export async function generateBillingForOPDAction(visitId, consultationFee)

// Lab (use createInvoiceAction with item_type: 'lab_test')

// Theatre (use createInvoiceAction with item_type: 'theatre_procedure')

// IPD (when created)
export async function generateBillingForAdmissionAction(admissionId, bedCharge, days)

// Maternity
export async function generateBillingForMaternityAction(maternityId, services)
```

---

## Configuration

### Service Pricing
Update pricing in these tables:
- `opd_services` - OPD consultation fees
- `lab_test_master.price` - Individual lab tests
- `theatre_procedures` - Surgery costs by procedure
- `bed_types` - IPD bed charges by ward type
- `maternity_services` - ANC, delivery, PNC charges

### Invoice Settings
Located in `billing_config` table:
- `auto_inv_prefix` - Invoice number prefix (e.g., "LPH-INV")
- `vat_percentage` - Tax rate
- `discount_limit` - Max discount allowed

---

## Testing & Deployment

### Test OPD Workflow
1. Open OPD visit page
2. Fill consultation details
3. Select diagnosis
4. Click "Close Consultation"
5. Check unpaid-patients dashboard
6. Verify invoice appears with 500 KES charge

### Test Lab Workflow
1. Open OPD visit page
2. Select lab tests
3. Click "Send to Lab"
4. Check unpaid-patients dashboard
5. Verify tests appear with correct pricing

### Test Theatre Workflow
1. Open OPD visit page
2. Click "Book for Surgery"
3. Fill procedure details
4. Click "Confirm Booking"
5. Check unpaid-patients dashboard
6. Verify theatre charge appears

### Test Payment Collection
1. Open unpaid-patients dashboard
2. Select unpaid invoice
3. Click "Pay" or "STK Push"
4. Verify invoice marked as paid
5. Check payment appears in payments table

---

## Troubleshooting

### Invoice doesn't appear in dashboard
- Check if `invoices` table has data
- Verify `visit_id` is correct
- Check if table has RLS policies blocking read access
- Check browser console for errors

### Payment not recorded
- Verify `payments` table insert works
- Check if `invoiceId` is valid
- Check if `amount_paid` is positive
- Verify user role has write access to payments table

### Billing creates but doesn't finish
- Check Supabase logs for constraint violations
- Verify all FK relationships exist
- Check if RLS policies block updates
- Look for missing data in dependent tables

