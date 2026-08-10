# Dental Procedures Management System

## Overview

This system allows you to manage dental procedures, their pricing, and automatically track billing when procedures are performed. The admin can add/edit procedures from a centralized management interface, and dentists can select procedures during patient visits with automatic invoice generation.

---

## 🚀 Quick Start

### Step 1: Deploy Database Schema

Copy and paste the SQL schema into your Supabase SQL Editor to create the necessary tables:

**File:** `sql/dental_procedures_schema.sql`

This creates:
- `procedure_master` - Master list of available procedures
- `dental_procedures` - Records of procedures performed on patients
- Necessary indexes for performance

### Step 2: Access Admin Panel

1. Navigate to `/admin` (requires admin role)
2. Click on "Master Data Management"
3. Select "Dental Procedures"

### Step 3: Add Procedures

From the Dental Procedures Admin page:
- Click **"+ Add New Procedure"**
- Fill in:
  - **Procedure Name** (e.g., "Root Canal Therapy")
  - **Category** (General, Endodontics, Oral Surgery, etc.)
  - **Price in KES** (e.g., 5000)
  - **Duration in minutes** (estimated time)
  - **Requires Anesthesia** (yes/no)
  - **Description** (optional details)
- Click **"Add Procedure"**

### Step 4: Use in Dental Visits

When treating a patient:
1. Open the dental visit page
2. Go to **"Procedures"** tab
3. Select a procedure from the dropdown
4. Enter tooth number (optional, e.g., "16")
5. Select tooth surface affected
6. Set procedure status (pending, in-progress, completed)
7. Click **"+ Add Procedure"**

✅ The procedure is recorded and **automatically billed**!

---

## 📋 Table Structures

### `procedure_master`
Master list of all available dental procedures.

```sql
CREATE TABLE procedure_master (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  category VARCHAR(100),        -- General, Oral Surgery, Ortho, etc.
  price DECIMAL(10, 2),         -- Procedure fee in KES
  duration_minutes INT,         -- How long the procedure takes
  requires_anesthesia BOOLEAN,  -- Whether anesthesia needed
  description TEXT,             -- Detailed description
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Example Records:**
```
| name                  | category         | price    | duration | anesthesia |
|:---------------------|:-----------------|:---------|:---------|:-----------|
| Prophylaxis          | General          | 1500     | 30       | false      |
| Basic Filling        | General          | 2500     | 45       | true       |
| Root Canal Therapy   | Endodontics      | 5000     | 120      | true       |
| Tooth Extraction     | Oral Surgery     | 2000     | 30       | true       |
| Scaling & Root Plan  | Perio            | 3000     | 60       | false      |
```

### `dental_procedures`
Records of actual procedures performed on patients.

```sql
CREATE TABLE dental_procedures (
  id UUID PRIMARY KEY,
  dental_visit_id UUID,          -- Reference to dental visit
  procedure_id UUID,             -- Links to procedure_master
  tooth_number VARCHAR(10),      -- Which tooth (e.g., 16, 32)
  tooth_surface VARCHAR(50),     -- occlusal, facial, lingual, etc.
  status VARCHAR(50),            -- pending, in-progress, completed, cancelled
  notes TEXT,
  cost DECIMAL(10, 2),           -- Price charged (from procedure_master)
  scheduled_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 💰 Automatic Billing Integration

### How It Works

```
Dentist records procedure
     ↓
Procedure details saved to dental_procedures table
     ↓
generateBillingForDentalAction() is called
     ↓
Checks if invoice exists for this visit
     ↓
If NO invoice → Creates new invoice
If INVOICE EXISTS → Adds line item to existing invoice
     ↓
Invoice appears in unpaid-patients dashboard
```

### Code Flow

**In ProceduresTab.tsx:**
```typescript
const handleAddProcedure = async () => {
  // 1. Save procedure record
  const { data: newRecord } = await supabase
    .from("dental_procedures")
    .insert({
      dental_visit_id: visit.id,
      procedure_id: selectedProcedure,
      tooth_number: toothNumber,
      status: status,
      cost: procedure.price
    })

  // 2. Silently trigger billing (non-blocking)
  await generateBillingForDentalAction(
    visit.id,
    procedure.price,
    procedure.name
  )
}
```

**In billingActions.ts:**
```typescript
export async function generateBillingForDentalAction(
  dentalVisitId: string,
  procedurePrice: number,
  procedureName: string
) {
  // Get patient and visit details
  const { data: dentalVisit } = await supabase
    .from('dental_visits')
    .select('patient_id, visit_id')
    .eq('id', dentalVisitId)
    .single()

  // Check if invoice exists
  let { data: existingInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('visit_id', visitId)
    .maybeSingle()

  if (existingInvoice) {
    // Add to existing invoice
  } else {
    // Create new invoice
  }

  // Revalidate billing pages
  revalidatePath('/dashboard/billing/unpaid-patients')
}
```

---

## 🛠️ Admin Features

### Filter & Search
- **Search:** Find procedures by name or description
- **Filter by Category:** View only specific types of procedures
- **Display:** Shows all details including price, duration, anesthesia requirement

### Edit Procedures
1. Find the procedure in the table
2. Click **"Edit"**
3. Modify any details
4. Click **"Update Procedure"**

### Delete Procedures
1. Find the procedure in the table
2. Click **"Delete"**
3. Confirm deletion
⚠️ Note: Deleting removes it from dropdown for new visits but doesn't affect historical records

### View Procedure Stats
- Bottom of admin page shows total procedures in current filter
- Organized by category for easy overview

---

## 📊 Procedure Categories

Pre-defined categories available:

| Category | Examples |
|:---------|:---------|
| General | Cleaning, Filling, Scaling |
| Endodontics | Root Canal Therapy |
| Oral Surgery | Extraction, Implant Surgery |
| Prostho | Crown, Bridge |
| Perio | Gum Disease Treatment |
| Ortho | Braces Adjustment |

---

## 🔗 Navigation

### Admin Access
- **URL:** `/admin`
- **Dental Procedures:** `/admin/dental-procedures`
- **Role Required:** Admin

### Dental Visit Access
- **Dental Visit:** `/dashboard/dental/dental-visit/[id]`
- **Procedures Tab:** Available in patient visit page
- **Role Required:** Dentist/Doctor

### Billing Access
- **Unpaid Invoices:** `/dashboard/billing/unpaid-patients`
- **All Invoices:** `/dashboard/billing/all-invoices`
- **Role Required:** Finance/Billing

---

## 🔐 Permission & Access Control

The system uses Supabase Row Level Security (RLS):

- **Read Procedures:** All authenticated users can view procedure_master
- **Add Procedures:** Dentists can record diagnostic procedures
- **Manage Procedures:** Admin-only for adds/edits/deletes
- **View Billing:** Finance staff and dentists can see generated invoices

---

## 📱 Mobile Responsive

All admin screens are fully responsive:
- ✅ Desktop: Full table view with all details
- ✅ Tablet: Optimized grid layout
- ✅ Mobile: Stacked cards with expandable details

---

## 🐛 Troubleshooting

### Issue: Procedure dropdown shows no items
- **Cause:** `procedure_master` table is empty
- **Solution:** Login as admin and add procedures from `/admin/dental-procedures`

### Issue: Procedures record but no invoice appears
- **Check:** Is the dental_visit record created first?
- **Check:** Does the visit have a patient_id?
- **Try:** Refresh `/dashboard/billing/unpaid-patients` page

### Issue: Can't access admin page
- **Check:** Are you logged in with admin role?
- **Check:** Verify role in Supabase users table
- **Try:** Use `AdminRoute` protected page component

### Issue: Procedure price not in invoice
- **Check:** Is the procedure being saved correctly?
- **Check:** Check browser console for JavaScript errors
- **Try:** Manually check invoice_items table

---

## 📚 Related Files

- **Schema:** `sql/dental_procedures_schema.sql`
- **Admin Page:** `src/app/(dashboard)/admin/dental-procedures/page.tsx`
- **Admin Home:** `src/app/(dashboard)/admin/page.tsx`
- **Procedures Tab:** `src/app/(dashboard)/(dental)/tabs/ProceduresTab.tsx`
- **Billing Actions:** `src/app/actions/billingActions.ts`
- **Dental Visit Page:** `src/app/(dashboard)/(dental)/dental-visit/[id]/page.tsx`

---

## 🎯 Next Steps

1. **Deploy Schema:** Run the SQL schema in Supabase
2. **Add Initial Procedures:** Use admin panel to add your most common procedures
3. **Test Recording:** Have a dentist record a procedure and verify it appears in billing
4. **Set Pricing:** Adjust procedure prices based on your hospital's rates
5. **Train Staff:** Teach dentists how to use the procedures dropdown

---

## 📝 Notes

- Procedures automatically generate invoices with the EXACT price from `procedure_master`
- Each procedure records tooth number and surface for detailed dental documentation
- Multiple procedures on same visit create separate line items in one invoice
- All procedures can be marked as pending, in-progress, completed, or cancelled
- Historical procedure data is preserved even if procedure is deleted from master list

---

## Support

For issues or questions about the dental procedures system:
1. Check this guide first
2. Review the related files listed above
3. Check browser console for errors
4. Review Supabase logs for database errors

