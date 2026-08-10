# 📁 BILLING SYSTEM - FILES CREATED & REFERENCE

## 🗂️ Directory Structure

```
myHMSSystem/nextjs-version/
│
├── sql/
│   └── billing_integration_schema.sql      ⭐ DATABASE SCHEMA
│
├── src/
│   ├── lib/
│   │   ├── billing/
│   │   │   └── billingService.ts           ⭐ SERVICE LAYER
│   │   └── supabase/
│   │       └── client.ts                   (existing - used by billing)
│   │
│   ├── app/
│   │   ├── actions/
│   │   │   └── billingActions.ts           ⭐ SERVER ACTIONS
│   │   │
│   │   └── (dashboard)/
│   │       ├── (opd)/
│   │       │   ├── opd-visit/
│   │       │   │   └── page.tsx            (TO BE UPDATED)
│   │       │   └── opd-visit-billing-integration.example.tsx  ⭐ EXAMPLE
│   │       │
│   │       ├── (billing)/                  (existing - for reports)
│   │       └── ...
│   │
│   └── components/
│       └── billing/
│           └── BillingComponents.tsx       ⭐ UI COMPONENTS
│
├── BILLING_INTEGRATION_GUIDE.md            ⭐ INTEGRATION GUIDE
├── BILLING_SETUP_COMPLETE.md               ⭐ SETUP SUMMARY
└── README.md                               (main project)
```

---

## 📋 FILES REFERENCE

### 1. **sql/billing_integration_schema.sql** ⭐ DATABASE
**Purpose:** Database schema for all billing functionality

**What it does:**
- ✅ Creates `invoices` table
- ✅ Creates `invoice_items` table  
- ✅ Adds billing fields to: `visits`, `labs`, `admissions`, `inpatient_admissions`, `maternity`, `prescriptions`
- ✅ Creates service master tables
- ✅ Inserts default configuration
- ✅ Creates indexes for performance

**Status:** 🟢 Ready to deploy
**Action:** Run in Supabase SQL Editor

---

### 2. **src/lib/billing/billingService.ts** ⭐ SERVICE LAYER
**Purpose:** Core business logic for billing (client-side)

**Exports:**
```typescript
// Main functions
- createInvoice(request)
- generateOPDInvoice(visitId, fee)
- generateLabInvoice(labId, tests)
- generateAdmissionInvoice(admissionId, bedCharge, days, additionalCharges)
- generateMaternityInvoice(maternityId, services)
- recordPayment(payment)
- getInvoiceDetails(invoiceId)
- getPatientInvoices(patientId, status)
- getBillingSummary(dateFrom, dateTo)
- getRevenueByDepartment(dateFrom, dateTo)

// Types
- InvoiceItem
- CreateInvoiceRequest
- PaymentRecord
```

**Usage:**
```typescript
import { generateOPDInvoice } from '@/lib/billing/billingService'
const result = await generateOPDInvoice(visitId, 500)
```

**Status:** 🟢 Ready to use

---

### 3. **src/app/actions/billingActions.ts** ⭐ SERVER ACTIONS
**Purpose:** Secure server-side billing operations

**Exports:**
```typescript
'use server'

- createInvoiceAction(patientId, items, visitId)
- recordPaymentAction(invoiceId, amountPaid, method, reference)
- generateBillingForOPDAction(visitId, consultationFee)
- generateBillingForLabAction(labId, tests)
- generateBillingForAdmissionAction(admissionId, bedCharge, days)
- generateBillingForMaternityAction(maternityId, services)
- getPatientBillingAction(patientId)
```

**Usage:**
```typescript
import { generateBillingForOPDAction } from '@/app/actions/billingActions'
const result = await generateBillingForOPDAction(visitId, 500)
```

**Features:**
- ✅ Automatic path revalidation
- ✅ Error handling
- ✅ Type-safe
- ✅ Logging support

**Status:** 🟢 Ready to use

---

### 4. **src/components/billing/BillingComponents.tsx** ⭐ UI COMPONENTS
**Purpose:** Reusable React components for billing UI

**Components:**

#### `InvoiceDisplay`
Shows invoice with:
- Invoice number & date
- Status badge
- Itemized services
- Total/Paid/Balance

```typescript
<InvoiceDisplay invoice={invoice} />
```

#### `PaymentForm`
Collects payment with:
- Amount input
- Payment method selector
- Reference number
- Validation
- Success/error messages

```typescript
<PaymentForm invoiceId={id} balance={balance} />
```

#### `BillingSummary`
Shows financial metrics:
- Total amount
- Total paid
- Outstanding balance

```typescript
<BillingSummary invoices={invoices} />
```

**Status:** 🟢 Ready to use

---

### 5. **BILLING_INTEGRATION_GUIDE.md** ⭐ INTEGRATION GUIDE
**Purpose:** Comprehensive guide for integrating billing into each department

**Sections:**
1. Architecture overview
2. 6 Department-specific integrations (OPD, Lab, IPD, Maternity, Pharmacy, Theatre)
3. Payment methods
4. Reporting & analytics
5. Configuration
6. Security & permissions
7. Testing checklist
8. Deployment instructions

**How to use:**
1. Read the department section
2. Copy code examples
3. Adapt to your specific page
4. Test end-to-end

**Status:** 🟢 Ready to reference

---

### 6. **BILLING_SETUP_COMPLETE.md** ⭐ SETUP SUMMARY
**Purpose:** Overview of everything created and immediate next steps

**Contains:**
- What's been created (with checkmarks)
- Immediate next steps
- Department integration priority
- Key features implemented
- Configuration options
- Available reports
- Troubleshooting

**How to use:**
1. Read for overview
2. Follow "Immediate Next Steps"
3. Refer to for quick reference

**Status:** 🟢 Ready

---

### 7. **opd-visit-billing-integration.example.tsx** ⭐ EXAMPLE
**Purpose:** Step-by-step example of integrating billing into OPD visit page

**Contains:**
- Reusable functions
- State management examples
- Handler functions
- UI components integration
- Full page example
- Browser console test commands
- Environment checks

**How to use:**
1. Reference the functions
2. Copy relevant parts into your page
3. Adapt to your specific UI
4. Test in console

**Status:** 🟢 Reference material

---

## 🔄 INTEGRATION WORKFLOW

### Phase 1: Database ✅
```bash
1. Open: sql/billing_integration_schema.sql
2. Copy all content
3. Paste into Supabase SQL Editor
4. Execute
5. Verify tables created
```

### Phase 2: OPD Integration 🔜
```bash
1. Open: src/app/(dashboard)/(opd)/opd-visit/page.tsx
2. Reference: opd-visit-billing-integration.example.tsx
3. Add imports for billing actions & components
4. Add billing state hook
5. Update closeConsultation function
6. Add BillingCheckoutSection to render
7. Test end-to-end
```

### Phase 3: Other Departments
Follow same pattern using:
- Service functions from `billingService.ts`
- Server actions from `billingActions.ts`
- UI components from `BillingComponents.tsx`

---

## 🎯 QUICK REFERENCE

### To Create an Invoice
```typescript
import { generateBillingForOPDAction } from '@/app/actions/billingActions'

const result = await generateBillingForOPDAction(visitId, 500)
if (result.success) {
  console.log('Invoice:', result.invoice)
}
```

### To Record Payment
```typescript
import { recordPaymentAction } from '@/app/actions/billingActions'

const result = await recordPaymentAction(invoiceId, 500, 'cash')
if (result.success) {
  console.log(result.invoice.status) // 'paid' or 'partially_paid'
}
```

### To Display Invoice
```typescript
import { InvoiceDisplay } from '@/components/billing/BillingComponents'

<InvoiceDisplay invoice={invoice} />
```

### To Get Patient History
```typescript
import { getPatientInvoices } from '@/lib/billing/billingService'

const invoices = await getPatientInvoices(patientId)
const unpaid = await getPatientInvoices(patientId, 'unpaid')
```

### To Get Revenue Report
```typescript
import { getRevenueByDepartment } from '@/lib/billing/billingService'

const revenue = await getRevenueByDepartment('2025-01-01', '2025-01-31')
```

---

## 🧪 TESTING COMMANDS

Run in browser console while on OPD visit page:

```typescript
// Check setup
import { checkBillingSetup } from '@/app/(dashboard)/(opd)/opd-visit-billing-integration.example'
checkBillingSetup()

// Test invoice creation
import { generateBillingForOPDAction } from '@/app/actions/billingActions'
const result = await generateBillingForOPDAction('<visit-id>', 500)
console.log(result)

// Test payment
import { recordPaymentAction } from '@/app/actions/billingActions'
const payment = await recordPaymentAction('<invoice-id>', 250, 'cash')
console.log(payment)
```

---

## 📊 DATABASE SCHEMA REFERENCE

### Invoices Table
```sql
id (uuid)
patient_id (uuid) → patients
invoice_number (text) - UNIQUE
total_amount (numeric)
paid_amount (numeric)
balance (numeric)
status (text) - unpaid|partially_paid|paid
visit_id (uuid) → visits (optional)
created_at (timestamp)
```

### Invoice Items Table
```sql
id (uuid)
invoice_id (uuid) → invoices
item_type (text) - opd_consultation|lab_test|ipd_bed|maternity_service|pharmacy_drug|theatre_procedure
item_id (uuid) - Reference to actual service
description (text)
quantity (integer)
unit_price (numeric)
total_price (numeric)
created_at (timestamp)
```

---

## ⚙️ SYSTEM CONFIGURATION

Edit in `billing_config` table:

| Key | Default | Type | Description |
|-----|---------|------|-------------|
| `auto_inv_prefix` | LPH-INV | text | Invoice prefix |
| `auto_inv_start_number` | 1000 | numeric | Starting number |
| `vat_percentage` | 0 | numeric | VAT rate |
| `discount_max_percentage` | 10 | numeric | Max discount allowed |
| `invoice_auto_generate` | true | boolean | Auto-generate on completion |

---

## 🚀 NEXT TASKS

- [ ] Deploy database schema
- [ ] Test OPD integration
- [ ] Test Lab integration
- [ ] Test IPD integration
- [ ] Test Maternity integration
- [ ] Create billing dashboard
- [ ] Train finance team
- [ ] Go live

---

## 📞 FILE RELATIONSHIPS

```
User Action
    ↓
Department Page (e.g., opd-visit/page.tsx)
    ↓
Server Action (billingActions.ts)
    ↓
Service Function (billingService.ts)
    ↓
Supabase (Database)
    ↓
UI Components (BillingComponents.tsx)
    ↓
Display to User
```

---

**All files follow Next.js 14+ best practices including:**
- ✅ Server components where possible
- ✅ Server actions for mutations
- ✅ Type safety with TypeScript
- ✅ Error handling
- ✅ Responsive UI components
- ✅ ISR with revalidatePath

**Ready to start integrating! 🚀**
