# PHARMACY MODULE - IMPLEMENTATION GUIDE
## LIFEPOINT HOSPITAL HMS

---

## 📋 MODULE OVERVIEW

The Pharmacy Module is a comprehensive drug and stock management system that:

✅ **Automates prescription workflows** from OPD, IPD, Theatre, Lab, Maternity, and CWC  
✅ **Tracks real-time stock movements** with complete audit trails  
✅ **Prevents drug theft & leakage** through department request system  
✅ **Manages supplier relationships** and outstanding payments  
✅ **Monitors expiry dates** with automated alerts  
✅ **Links to billing system** for automatic revenue posting  
✅ **Generates profit reports** for financial analysis  

---

## 🏗️ DATABASE STRUCTURE

### Core Tables Created

```
1. drugs                           - Drug master catalog
2. drug_batches                    - Batch tracking with expiry dates
3. suppliers                       - Supplier management
4. stock_movements                 - Audit trail for all stock changes
5. prescriptions                   - Prescriptions from all departments
6. prescription_items              - Individual drugs in prescriptions
7. pharmacy_dispensing             - Dispensing records with financials
8. department_stock_requests       - Internal department requests
9. purchase_orders                 - Supplier purchase orders
10. expiry_alerts                  - Automated expiry monitoring
11. stock_reconciliation           - Physical count reconciliation
12. pharmacy_users                 - Role-based access control
13. pharmacy_audit_log             - Compliance logging
```

### Key Relationships

```
prescriptions ──→ prescription_items ──→ drugs
                                    ↓
                            pharmacy_dispensing ──→ drug_batches
                                                      ↓
                                                   suppliers
```

---

## 🖥️ USER INTERFACE PAGES

### 1. Dashboard (`/pharmacy`)
**Purpose:** Overview of pharmacy operations

**Features:**
- Pending prescriptions count
- Low stock drugs alert
- Drugs expiring within 30 days
- Today's dispensed items
- Today's revenue (KES)
- Pending department requests
- Quick action buttons

**Access:** Pharmacy Admin, Pharmacist

---

### 2. Stock In (`/pharmacy/stock-in`)
**Purpose:** Add new stock to pharmacy inventory

**Process:**
1. Select drug from master list
2. Select supplier
3. Enter batch details (batch number, quantity, costs)
4. Auto-calculate markup percentage
5. Set expiry date
6. Submit → Auto-creates drug batch entry
7. Auto-records stock movement

**Fields:**
- Drug name & strength
- Supplier selection
- Batch number (unique per drug-supplier combo)
- Quantity received
- Unit cost (cost price)
- Selling price
- Markup % (default 30%)
- Received date
- Expiry date
- Storage location

**Database Impact:**
- Creates record in `drug_batches` table
- Creates entry in `stock_movements` (type: stock_in)
- Calculates cost_per_unit and profit

**Access:** Pharmacy Admin, Pharmacist

---

### 3. Prescriptions (`/pharmacy/prescriptions`)
**Purpose:** Queue of prescriptions from all departments

**Features:**
- Filters: All, Pending, Partial, Dispensed, Cancelled
- Expand/collapse prescription details
- Show patient details & prescription number
- List all prescribed drugs with dosages
- Quick action buttons:
  - **Dispense** - Fully dispense all items
  - **Partial Dispense** - For stock issues
  - **Cancel** - Reject prescription

**Prescription Info:** 
- From Department (OPD, IPD, Theatre, Lab, Maternity, CWC)
- Patient name & ID
- Prescribed date & medication details
- Frequency & route (oral, IV, IM, etc.)

**Action:** When "Dispense" is clicked:
1. Selects batch (FIFO - First In First Out)
2. Deducts stock from drug_batches.quantity_in_stock
3. Creates pharmacy_dispensing record with costs
4. Updates prescription_item status to "dispensed"
5. Auto-posts to billing system

**Access:** Pharmacy Assistant, Pharmacist

---

### 4. Stock Levels (`/pharmacy/stock-levels`)
**Purpose:** Real-time inventory monitoring

**Features:**
- Filters:
  - All drugs
  - Low stock (below reorder level)
  - Expiring soon (within 30 days)
  - Expired drugs
- Sort options:
  - Expiry date (urgent first)
  - Low stock first
  - Drug name (A-Z)

**Table Columns:**
- Drug name & strength  
- Batch number
- Current stock quantity
- Reorder level
- Expiry date
- Days until expiry
- Status badge (OK, LOW STOCK, EXPIRING, EXPIRED)
- Supplier name

**Status Colors:**
- 🟢 Green: Adequate stock
- 🟡 Yellow: Low stock warning
- 🟠 Orange: Expiring within 30 days
- 🔴 Red: Expired

**Alerts Triggered:**
- When quantity < reorder_level → "LOW STOCK" alert
- When 30 days to expiry → "EXPIRING SOON" alert
- When past expiry date → "EXPIRED" alert

**Access:** Pharmacy Admin, Pharmacist, Auditor

---

### 5. Expiry Alerts (`/pharmacy/expiry-alerts`)
**Purpose:** Monitor and manage expiring drugs

**Alert Types:**
1. **⏰ 90 Days Before Expiry** - Planning stage
2. **🔴 30 Days Before Expiry** - Action needed (use FIFO)
3. **❌ EXPIRED** - Immediate removal required
4. **⚠️ Near Minimum Stock** - Reorder needed

**Features:**
- Unacknowledged alerts only
- Summary statistics (by alert type)
- Acknowledge functionality (mark as reviewed)
- Action tracking (what was done)

**Recommendations Displayed:**
✓ Expired: Immediately remove & safely dispose  
✓ 30 days: Use FIFO principle (dispense oldest first)  
✓ 90 days: Plan stock rotation and procurement  
✓ Low stock: Create purchase order with supplier  

**Automatic Alert Creation:**
- Drug batch creation automatically triggers appropriate alerts
- Based on expiry_date - current_date calculation

**Access:** Pharmacy Admin, Pharmacist, Auditor

---

### 6. Dispensing Records (`/pharmacy/dispensing`)
**Purpose:** History of dispensed medications

**Features:**
- Today's dispensing records (with time filter expandable)
- Summary stats:
  - Items dispensed today
  - Today's revenue (selling price)
  - Total profit (margin)

**Table Columns:**
- Drug name & strength
- Batch number used
- Quantity dispensed
- Cost price (total)
- Selling price (total)
- Profit (auto-calculated)
- Dispensing time

**Financial Tracking:**
- Each dispensing record captures:
  - cost_price_total (cost to hospital)
  - selling_price_total (charged to patient)
  - profit (auto-calculated as selling - cost)

**Access:** Pharmacist, Finance, Auditor

---

### 7. Department Requests (`/pharmacy/department-requests`)
**Purpose:** Controlled inter-department stock distribution

**Workflow:**
```
Department Submits Request
    ↓
Pharmacy Reviews (Pending)
    ↓
Approve ──→ Request Status = Approved
    ↓       Issue Stock Button Enabled
Issue Stock → Request Status = Issued
    ↓
Auto-record in stock_movements (type: internal dept request)
```

**Requesting Department:** OPD, IPD, Theatre, Lab, Maternity, CWC, Nursing

**Prevents:**
- Manual/undocumented drug usage
- Stock disappearance
- Uncontrolled consumption

**Filters:** All, Pending, Approved, Issued, Rejected

**Features:**
- Show requested items & quantities
- Track issued quantities
- Rejection reason tracking
- Department name & request date

**Benefits:**
✓ Full audit trail of drug movement  
✓ Prevents unauthorized usage  
✓ Accurate cost center allocation  
✓ Real-time inventory deduction  

**Access:** Pharmacy Admin (approve/reject/issue), Department Heads (submit)

---

### 8. Suppliers (`/pharmacy/suppliers`)
**Purpose:** Supplier management and payment tracking

**Features:**
- Add new suppliers (form)
- View active suppliers
- Contact details (name, phone, email, city)
- Payment terms (Net 30, 45, 60, COD)
- Outstanding balance tracking
- Supplier rating

**Form Fields:**
- Supplier name (unique)
- Supplier code (unique identifier)
- Contact person
- Phone (required)
- Email
- City
- Payment terms dropdown

**Payment Tracking:**
- Outstanding balance (KES) per supplier
- "Record Payment" button → deduct from balance
- Payment status alerts

**Supplier Card Shows:**
- Contact information
- Outstanding payment
- Payment terms & schedule
- 5-star rating (if available)

**Use Case:**
1. New supplier → Add via form
2. Place purchase order → Select supplier
3. Receive stock → Create drug batch
4. Record payment → Reduce outstanding balance

**Access:** Pharmacy Admin, Finance

---

### 9. Reports (`/pharmacy/reports`)
**Purpose:** Financial analytics and inventory insights

**Timeframe Filters:** Today, This Week, This Month

**Key Metrics Displayed:**

| Metric | Formula | Use Case |
|--------|---------|----------|
| Total Revenue | Sum of selling_price_total | How much pharmacy earned |
| Total Profit | Sum of (selling - cost) | Pure profit generated |
| Items Dispensed | Count of pharmacy_dispensing | Volume of transactions |
| Profit Margin | (Profit / Revenue) × 100 | % profit on sales |
| Cost of Goods | Sum of cost_price_total | Hospital's expense |

**Insights Provided:**
- Average transaction value (revenue ÷ items)
- Profit per transaction (profit ÷ items)
- Current profit margin %
- Recommendations for improvement

**Available Downloads:**
- Daily Dispensing Report
- Profit Analysis Report
- Expiry Report
- Low Stock Alert Report
- Supplier Payable Report
- Department Usage Report

**Access:** Pharmacy Admin, Finance, Management

---

## 🔗 INTEGRATION POINTS

### With OPD Module
- Doctor writes prescription → Auto-syncs to pharmacy queue
- Pharmacist dispenses → Auto-deducts stock
- Auto-post to patient bill

### With IPD Module
- Doctor prescribes per admission
- Daily medications deducted per dose
- Track per-patient medication usage
- Auto-link to admission billing

### With Theatre Module
- Anesthesia drugs & IV fluids auto-tracked
- Post-operative antibiotics
- Surgical consumables deducted
- Auto-assign cost to surgery case

### With Lab Module
- Reagents & consumables deducted
- Internal lab usage tracked
- Cost center: Laboratory
- Stock movement type: "dispense_lab"

### With Maternity Module
- Oxytocin, Magnesium sulphate, antibiotics tracked
- Per-delivery usage recording
- Emergency stock monitoring
- Auto-link to delivery billing

### With CWC Module
- Pediatric drugs & vaccines tracked
- Batch number for vaccine lots (critical for recalls)
- Expiry alerts for vaccines
- Vaccination log integration

### With Billing System
- Dispensing → Auto-post revenue
- Patient charges immediately updated
- Insurance pricing variations supported
- No manual billing entry needed

---

## 👤 USER ROLES & PERMISSIONS

### 1. **Pharmacy Admin**
Permissions:
- ✅ All pharmacy operations
- ✅ Add/edit/delete drugs and batches
- ✅ Manage suppliers
- ✅ Review department requests (approve/reject)
- ✅ View reports and audit logs
- ✅ Access to analytics

### 2. **Pharmacist**
Permissions:
- ✅ View prescriptions
- ✅ Dispense medications
- ✅ View stock levels
- ✅ Acknowledge expiry alerts
- ✅ Record stock adjustments (with reason)
- ✅ Create department stock requests (partial)

### 3. **Pharmacy Assistant**
Permissions:
- ✅ Dispense medications (under supervision)
- ✅ View stock levels
- ✅ Record sample collection (for lab)
- ✅ View expiry alerts
- ✅ Cannot approve or edit stock

### 4. **Auditor**
Permissions:
- ✅ View all reports (read-only)
- ✅ View audit logs
- ✅ View stock levels
- ✅ Download reports
- ✅ Cannot modify any data

### 5. **Finance**
Permissions:
- ✅ View reports & profit analysis
- ✅ Track supplier payments
- ✅ Record payments
- ✅ Download financial reports
- ✅ View dispensing records

---

## 📊 STOCK MOVEMENT TYPES

```sql
INSERT INTO stock_movements (movement_type) VALUES:
'stock_in'           -- New stock received from supplier
'dispense_opd'       -- Dispensed to OPD patient
'dispense_ipd'       -- Used in IPD/admission
'dispense_theatre'   -- Used in theatre/surgery
'dispense_lab'       -- Used in laboratory
'dispense_maternity' -- Used in maternity ward
'dispense_cwc'       -- Used in child welfare clinic
'internal_wastage'   -- Expired/damaged stock
'expiry_loss'        -- Stock removed due to expiry
'adjustment'         -- Manual stock correction
'return'             -- Returned to supplier
```

---

## ⚠️ CONTROLS FOR PREVENTING LOSS

### 1. **Cannot Delete Transactions**
- All dispensing records are immutable
- Adjustments logged separately with reason
- Audit trail preserved forever

### 2. **Stock Adjustment Requires:**
- Approval from Pharmacy Admin
- Reason mandatory (wastage, expiry, damage, theft, etc.)
- Proof/evidence attachment field

### 3. **Department Requests**
- No direct manual consumption allowed
- All usage must go through request/approval cycle
- Real-time stock deduction (not cumulative)

### 4. **Batch Tracking**
- Every drug tied to specific batch & supplier
- Expiry dates prevent dispensing of bad stock
- System blocks expired drug dispensing

### 5. **Role-Based Access**
- Only authorized users can approve/modify
- Audit log shows who did what, when
- Suspension flags for unusual activity

---

## 🚀 IMPLEMENTATION CHECKLIST

### Phase 1: Database (COMPLETED ✅)
- [x] Create pharmacy_schema.sql
- [x] Run migration in Supabase
- [x] Insert sample drugs & suppliers
- [x] Create indexes for performance

### Phase 2: Core Pages (COMPLETED ✅)
- [x] Dashboard
- [x] Stock In
- [x] Prescriptions Queue
- [x] Stock Levels
- [x] Expiry Alerts
- [x] Dispensing Records
- [x] Department Requests
- [x] Suppliers
- [x] Reports

### Phase 3: Integrations (PENDING)
- [ ] Link OPD prescriptions to pharmacy queue
- [ ] Link IPD prescriptions to pharmacy queue
- [ ] Link Theatre drug usage to pharmacy queue
- [ ] Link Lab reagents to pharmacy queue
- [ ] Link Maternity drugs to pharmacy queue
- [ ] Link CWC vaccines to pharmacy queue
- [ ] Auto-post dispensing to billing system
- [ ] Create automatic expiry alerts on batch creation
- [ ] Create low stock alerts

### Phase 4: Advanced Features (PENDING)
- [ ] Dispensing workflow UI (batch selection, FIFO suggestion)
- [ ] Purchase order creation & tracking
- [ ] Physical stock reconciliation workflow
- [ ] Supplier payables report
- [ ] Drug turnover rate analytics
- [ ] PDF report generation
- [ ] Email alerts for expiry/low stock
- [ ] SMS notifications for critical stock levels

### Phase 5: Testing & Deployment
- [ ] Unit test all calculation formulas
- [ ] Integration test with other modules
- [ ] UAT with pharmacy team
- [ ] Security audit of audit logs
- [ ] Performance testing with large datasets
- [ ] Backup & recovery procedures

---

## 💡 STRATEGIC RECOMMENDATIONS

### For LIFEPOINT HOSPITAL:

1. **Pharmacy is Usually the Highest Leakage Area**
   - Implement department request system immediately
   - Weekly stock counts vs. system counts
   - Flag discrepancies instantly

2. **Revenue Opportunity**
   - Monitor profit margins daily
   - Stock fast-moving drugs (high margin)
   - Reduce slow-moving drug inventory

3. **Cost Control**
   - Negotiate better supplier terms on volume
   - FIFO principle reduces expiry losses
   - Prevent drug theft immediately

4. **Financial Impact Estimate:**
   - Reducing 5% stock loss = +5-10% net profit
   - Reducing expiry waste by half = +2-3% net profit
   - Better supplier negotiations = +3-5% cost savings
   - **Total potential net profit increase: 10-18%**

---

## 🔍 TROUBLESHOOTING

### Issue: "Drug not dispensing"
**Check:**
1. Is prescription in "pending" status?
2. Is drug batch in stock? (quantity_in_stock > 0)
3. Is batch expired? (expiry_date < today)
4. User permissions for pharmacist?

### Issue: "Stock count mismatch"
**Actions:**
1. Run physical reconciliation
2. Compare database quantity vs. physical count
3. Log variance with reason
4. Request stock adjustment approval
5. Audit historical movements

### Issue: "Low stock not alerting"
**Check:**
1. Is reorder_level set correctly on drug master?
2. Is alert creation trigger active?
3. Query: `SELECT * FROM expiry_alerts WHERE alert_type = 'near_minimum' AND acknowledged = false`

---

## 📞 SUPPORT CONTACTS

- **Pharmacy Admin:** [Add contact]
- **Database Admin:** [Add contact]
- **Finance Manager:** [Add contact]
- **IT Support:** [Add contact]

---

## 📝 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-02 | Initial pharmacy module release |
| | | - 13 core tables created |
| | | - 9 UI pages implemented |
| | | - Sample data inserted |
| | | - Documentation complete |

---

**Last Updated:** April 2, 2026  
**Created by:** HMS Development Team  
**Status:** Ready for Testing
