# LIFEPOINT HMS - BILLING INTEGRATION GUIDE

## 📋 Overview

Your billing system is now ready for complete department integration. All departments (OPD, Lab, IPD, Maternity, Pharmacy, Theatre) can seamlessly track charges and generate invoices automatically.

---

## 🏗️ Architecture

### Database Layer
**File:** `sql/billing_integration_schema.sql`
- ✅ Already created and ready to deploy

**Tables Created:**
- `invoices` - Main invoice records
- `invoice_items` - Line items per invoice
- `opd_services` - OPD consultation fees
- `lab_test_pricing` - Lab test charges
- `bed_charge_master` - IPD bed charges
- `maternity_services` - Maternity service fees
- `billing_config` - System configuration

### Service Layer
**File:** `src/lib/billing/billingService.ts`
- Client-side billing operations
- Functions for each department type
- Invoice management utilities

### Server Actions Layer
**File:** `src/app/actions/billingActions.ts`
- Secure server-side operations
- Database mutations with revalidation
- Payment recording

### UI Components
**File:** `src/components/billing/BillingComponents.tsx`
- `InvoiceDisplay` - Shows invoice details
- `PaymentForm` - Records payments
- `BillingSummary` - Quick financial overview

---

## 🔧 Integration Steps by Department

### 1️⃣ OPD (Outpatient Department)

#### Location
`src/app/(dashboard)/(opd)/opd-visit/page.tsx`

#### What Gets Billed
- Consultation fees
- Doctor's service charge

#### Integration Points

**A. At Visit Completion**

```typescript
import { generateBillingForOPDAction } from '@/app/actions/billingActions';

// In closeConsultation function
const handleCloseVisit = async () => {
  try {
    // Existing code...
    
    // Generate invoice
    const consultationFee = 500; // Get from config or service master
    const result = await generateBillingForOPDAction(visitId, consultationFee);
    
    if (result.success) {
      alert(`Invoice ${result.invoice.invoice_number} created`);
    }
    
    // Then redirect
    router.push("/opd");
  } catch (error) {
    console.error('Billing error:', error);
  }
};
```

**B. Display Invoice to Patient**

```typescript
import { InvoiceDisplay, PaymentForm } from '@/components/billing/BillingComponents';

// After consultation closed, show invoice
{invoice && (
  <div className="space-y-6">
    <InvoiceDisplay invoice={invoice} />
    {invoice.balance > 0 && (
      <PaymentForm invoiceId={invoice.id} balance={invoice.balance} />
    )}
  </div>
)}
```

#### Service Master Setup
```sql
-- Add OPD consultation types and fees
INSERT INTO public.opd_services (service_name, service_code, consultation_fee) VALUES
('General Consultation', 'OPD-001', 500),
('Specialist - Cardiology', 'OPD-CAR', 1500),
('Specialist - ENT', 'OPD-ENT', 1200);
```

---

### 2️⃣ LAB DEPARTMENT

#### Location
`src/app/(dashboard)/lab/` (create new page or integrate with existing)

#### What Gets Billed
- Individual lab test costs
- Sample collection fees (if applicable)

#### Integration Points

**A. When Requesting Lab Tests**

```typescript
import { generateBillingForLabAction } from '@/app/actions/billingActions';

const handleCompleteLab = async (labId: string, tests: Array<{testId: string; testName: string; price: number}>) => {
  const result = await generateBillingForLabAction(labId, tests);
  
  if (result.success) {
    alert(`Lab invoice created: ${result.invoice.invoice_number}`);
    // Update UI to show invoice
  }
};
```

**B. Existing Lab Integration**
Already partially implemented in `opd-visit/page.tsx` sendLab() function
- Verify the billing is working correctly
- Check that lab test prices are loaded from `lab_test_master`

#### Service Master Setup
```sql
-- Add lab test prices (or update existing)
INSERT INTO public.lab_test_pricing (test_name, test_code, category, selling_price, cost_price) VALUES
('Full Blood Count', 'FBC-001', 'Hematology', 800, 300),
('Malaria RDT', 'MAL-001', 'Parasitology', 500, 150),
('Widal Test', 'WID-001', 'Serology', 1000, 400),
('Blood Culture', 'BC-001', 'Microbiology', 2000, 800);
```

---

### 3️⃣ IPD (INPATIENT DEPARTMENT)

#### Location
`src/app/(dashboard)/inpatient/`

#### What Gets Billed
- Bed charges (daily)
- Nursing care
- Medications
- Procedures/treatments
- Additional services

#### Integration Points

**A. On Admission**

```typescript
import { generateBillingForAdmissionAction } from '@/app/actions/billingActions';

const handleCreateAdmission = async (admissionData: any) => {
  // Create admission
  const { data: admission } = await supabase
    .from('inpatient_admissions')
    .insert([admissionData])
    .select()
    .single();

  // Generate initial invoice for bed charges
  const bedChargeDaily = 5000; // Get from bed_charge_master based on bed type
  const durationDays = 1; // Start with 1 day
  
  const result = await generateBillingForAdmissionAction(
    admission.id,
    bedChargeDaily,
    durationDays
  );

  if (result.success) {
    console.log('Admission invoice created');
  }
};
```

**B. On Discharge (Recalculate Total)**

```typescript
const handleDischarge = async (admissionId: string) => {
  // Calculate actual length of stay
  const { data: admission } = await supabase
    .from('inpatient_admissions')
    .select('admission_date, discharge_date')
    .eq('id', admissionId)
    .single();

  const admissionDate = new Date(admission.admission_date);
  const dischargeDate = new Date();
  const durationDays = Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));

  const bedChargeDaily = 5000;
  
  // Regenerate invoice with actual days
  await generateBillingForAdmissionAction(
    admissionId,
    bedChargeDaily,
    durationDays
  );
};
```

**C. Add Additional Charges During Stay**

```typescript
import { addInvoiceItemAction } from '@/app/actions/billingActions';

// Add lab test charge
await addInvoiceItemAction(invoiceId, {
  item_type: 'ipd_lab',
  item_id: labTestId,
  description: 'Lab Test - Blood Culture',
  quantity: 1,
  unit_price: 2000
});

// Add medication charge
await addInvoiceItemAction(invoiceId, {
  item_type: 'ipd_drug',
  item_id: drugId,
  description: 'Antibiotic - Ceftriaxone 1g (3 doses)',
  quantity: 3,
  unit_price: 800
});
```

#### Service Master Setup
```sql
-- Add bed charges
INSERT INTO public.bed_charge_master (bed_type, daily_charge) VALUES
('General Ward', 5000),
('Semi-Private', 10000),
('Private', 20000),
('ICU', 50000),
('Pediatric', 6000);
```

---

### 4️⃣ MATERNITY DEPARTMENT

#### Location
`src/app/(dashboard)/(maternity)/`

#### What Gets Billed
- Antenatal Care (ANC) visits
- Delivery charges
- Postnatal Care (PNC) visits
- Complications management
- Emergency/Caesarean section surcharges

#### Integration Points

**A. On Service Delivery**

```typescript
import { generateBillingForMaternityAction } from '@/app/actions/billingActions';

const handleMaternityServiceCompletion = async (
  maternityId: string,
  deliveryType: 'normal' | 'caesarean' | 'vacuum' | 'forceps'
) => {
  const services = [
    {
      serviceId: 'delivery-' + deliveryType,
      serviceName: `${deliveryType.toUpperCase()} Delivery`,
      price: getDeliveryPrice(deliveryType) // 15000 for normal, 35000 for C-section
    }
  ];

  // Add complications charges if any
  if (complications) {
    services.push({
      serviceId: 'complication-' + complications,
      serviceName: `Complication Management - ${complications}`,
      price: 5000
    });
  }

  const result = await generateBillingForMaternityAction(maternityId, services);
  
  if (result.success) {
    // Generate receipt
    await generateMaternityReceipt(result.invoice);
  }
};
```

**B. Bundle Packages (ANC + Delivery + PNC)**

```typescript
const handleMaternityPackage = async (patientId: string) => {
  // Create single invoice for package
  const packageServices = [
    { serviceId: 'pkg-anc', serviceName: 'Antenatal Care Package (4 visits)', price: 4000 },
    { serviceId: 'pkg-delivery', serviceName: 'Normal Delivery', price: 15000 },
    { serviceId: 'pkg-pnc', serviceName: 'Postnatal Care Package (2 visits)', price: 2000 }
  ];

  const result = await generateBillingForMaternityAction(maternityId, packageServices);
};
```

#### Service Master Setup
```sql
INSERT INTO public.maternity_services (service_name, service_code, service_fee, description) VALUES
('Normal Delivery', 'MAT-001', 15000, 'Uncomplicated vaginal delivery'),
('Caesarean Section', 'MAT-002', 35000, 'C-section delivery'),
('Antenatal Care', 'MAT-003', 1000, 'Single ANC visit'),
('Postnatal Care', 'MAT-004', 2000, 'PNC visit'),
('Delivery Package', 'MAT-005', 50000, 'Full maternity package'),
('Complication Handling', 'MAT-006', 5000, 'Additional charge for complications');
```

---

### 5️⃣ PHARMACY DEPARTMENT

#### Current Status
✅ Partially integrated in `opd-visit.tsx`

#### What Gets Billed
- Prescription drugs
- Over-the-counter medicines
- Compounding services

#### Verification Checklist
- [ ] Check `pharmacy_dispensing` table has pricing fields
- [ ] Verify drug prices in `drugs` table (selling_price column)
- [ ] Test that invoice items are created when prescriptions are dispensed
- [ ] Verify stock is deducted and revenue is recorded

#### Enhancement (Optional)
```typescript
// After dispensing drugs, auto-generate invoice if not created
const handlePharmacyDispensing = async (prescriptionId: string) => {
  // Get prescription details
  const { data: prescription } = await supabase
    .from('prescriptions')
    .select('patient_id, prescription_items(quantity_prescribed, drug:drugs(selling_price))')
    .eq('id', prescriptionId)
    .single();

  // Check if already billed
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('prescription_id', prescriptionId)
    .maybeSingle();

  if (!existing) {
    // Create invoice for prescription
    const items = prescription.prescription_items.map(item => ({
      item_type: 'pharmacy_drug',
      item_id: item.drug_id,
      description: item.drug.drug_name,
      quantity: item.quantity_prescribed,
      unit_price: item.drug.selling_price
    }));

    await createInvoiceAction(prescription.patient_id, items);
  }
};
```

---

### 6️⃣ THEATRE (SURGERY) DEPARTMENT

#### Location
`src/app/(dashboard)/theatre/`

#### What Gets Billed
- Surgery/procedure charges
- Theater time usage
- Equipment/supplies used
- Anesthesia charges
- Post-operative care

#### Integration Points

```typescript
const handleTheatreBookingCompletion = async (bookingId: string) => {
  // Get booking details
  const { data: booking } = await supabase
    .from('theatre_bookings')
    .select('patient_id, procedure_name, estimated_duration_minutes')
    .eq('id', bookingId)
    .single();

  // Create invoice
  const procedures = [
    {
      serviceId: 'theatre-' + booking.procedure_name.toLowerCase().replace(/\s/g, '-'),
      serviceName: booking.procedure_name,
      price: getTheatreCharge(booking.procedure_name) // Get from service master
    }
  ];

  const invoiceResult = await createInvoiceAction(booking.patient_id, 
    procedures.map(p => ({
      item_type: 'theatre_procedure',
      item_id: p.serviceId,
      description: p.serviceName,
      quantity: 1,
      unit_price: p.price
    }))
  );

  // Update booking with invoice reference
  await supabase
    .from('theatre_bookings')
    .update({ invoice_id: invoiceResult.invoice?.id })
    .eq('id', bookingId);
};
```

---

## 💳 PAYMENT METHODS INTEGRATION

### Supported Payment Methods
1. **Cash**
2. **Card** (Visa/Mastercard via PDQ)
3. **M-Pesa** (Daraja API)
4. **Insurance** (Pre-authorized)
5. **Cheque**

### Recording Payment

```typescript
import { recordPaymentAction } from '@/app/actions/billingActions';

const handlePayment = async (invoiceId: string, amount: number, method: string) => {
  const result = await recordPaymentAction(
    invoiceId,
    amount,
    method, // 'cash' | 'card' | 'mpesa' | 'insurance' | 'cheque'
    'REF-123456' // optional reference number
  );

  if (result.success) {
    console.log('Payment recorded:', result.invoice);
    // Update UI
  }
};
```

---

## 📊 REPORTING & ANALYTICS

### Get Billing Summary
```typescript
import { getBillingSummary } from '@/lib/billing/billingService';

const summary = await getBillingSummary('2025-01-01', '2025-01-31');
// Returns: {
//   total_invoices: 150,
//   total_revenue: 500000,
//   total_paid: 450000,
//   total_outstanding: 50000,
//   invoices_by_status: { unpaid: 10, partially_paid: 5, paid: 135 }
// }
```

### Get Revenue by Department
```typescript
import { getRevenueByDepartment } from '@/lib/billing/billingService';

const revenue = await getRevenueByDepartment('2025-01-01', '2025-01-31');
// Returns: {
//   opd_consultation: 45000,
//   lab_test: 55000,
//   ipd_bed: 180000,
//   maternity_service: 120000,
//   ...
// }
```

### Patient Billing History
```typescript
import { getPatientInvoices } from '@/lib/billing/billingService';

const invoices = await getPatientInvoices(patientId, 'unpaid');
```

---

## ⚙️ CONFIGURATION

### Modify Billing Settings

```sql
UPDATE public.billing_config 
SET config_value = 'LPH-2025' 
WHERE config_key = 'auto_inv_prefix';

UPDATE public.billing_config 
SET config_value = '5000' 
WHERE config_key = 'auto_inv_start_number';

UPDATE public.billing_config 
SET config_value = '16' 
WHERE config_key = 'vat_percentage';
```

### Billing Configuration Keys
- `auto_inv_prefix` - Invoice number prefix (default: LPH-INV)
- `auto_inv_start_number` - Starting invoice number (default: 1000)
- `vat_percentage` - VAT rate (default: 0)
- `discount_max_percentage` - Maximum discount (default: 10)
- `invoice_auto_generate` - Auto-generate on completion (default: true)

---

## 🔐 SECURITY & PERMISSIONS

### Role-Based Billing Access
```typescript
const BillingAccess = {
  ADMIN: ['view', 'create', 'edit', 'delete', 'approve_refunds'],
  FINANCE_MANAGER: ['view', 'create', 'edit'],
  CASHIER: ['view', 'record_payment'],
  Doctor: ['view'],
  PATIENT: ['view_own']
};
```

### Audit Trail
All billing operations are logged with:
- User ID
- Action type
- Timestamp
- Changes made
- Invoice ID

---

## 🧪 TESTING CHECKLIST

- [ ] Create OPD visit and generate invoice
- [ ] Create lab request and verify billing
- [ ] Admit patient to IPD and generate admission invoice
- [ ] Record payment and verify status changes
- [ ] Test partial payments
- [ ] Verify invoice numbering sequence
- [ ] Check that all departments appear in revenue report
- [ ] Test M-Pesa payment webhook (if integrated)
- [ ] Verify patient invoice history is accurate
- [ ] Test insurance billing workflow

---

## 🚀 DEPLOYMENT

### 1. Run Database Migration
```bash
# In supabase dashboard, run:
# sql/billing_integration_schema.sql
```

### 2. Deploy Code
```bash
cd nextjs-version
npm run build
npm run start
```

### 3. Verify Integration
- Check billing page loads without errors
- Create test invoice
- Record test payment
- View billing dashboard

---

## 📞 SUPPORT FUNCTIONS

All reusable across departments:
- `createInvoice()` - Create any invoice type
- `recordPayment()` - Record any payment
- `getInvoiceDetails()` - Fetch invoice
- `getPatientInvoices()` - Get patient history
- `getBillingSummary()` - Financial overview
- `getRevenueByDepartment()` - Department analytics

---

## 📋 NEXT: Advanced Features (Optional)

Once basic integration is done, considerations:
1. **Insurance Claims** - Auto-generate and track
2. **Doctor Commission** - Calculate per doctor
3. **Daily Expenses** - Track operational costs
4. **Refunds** - Approval workflow
5. **SMS/WhatsApp** - Automated receipts
6. **QR Codes** - Quick payment links
7. **Budget Tracking** - Department budgets vs actuals
8. **Recurring Billing** - For packages/memberships

---

**Ready to integrate? Start with OPD, then expand to other departments!**
