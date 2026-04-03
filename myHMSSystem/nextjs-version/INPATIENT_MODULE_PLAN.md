# 🏥 Inpatient Module (IPD) - Comprehensive Implementation Plan

## 📋 Overview
Complete inpatient management system with admission, bed management, medical records, medications, vital signs tracking, and discharge management.

---

## 📊 Database Schema

### Core Tables (13 tables)
1. **wards** - Hospital ward information
2. **beds** - Individual bed management
3. **inpatient_admissions** - Patient admission records
4. **inpatient_daily_notes** - SOAP notes per shift
5. **inpatient_vital_signs** - Vital signs tracking
6. **inpatient_medications** - Prescribed medications
7. **inpatient_mar** - Medication Administration Record
8. **inpatient_procedures** - Procedures performed
9. **discharge_summaries** - Discharge information
10. **inpatient_lab_requests** - Lab test requests
11. **inpatient_imaging_requests** - Imaging requests
12. **inpatient_transfers** - Ward/bed transfers
13. **visitor_logs** - Visitor tracking

---

## 🎯 UI Pages & Components

### Phase 1: Core Pages
1. **Ward Dashboard** - Overview of all wards and bed availability
2. **Admission Form** - New patient admission
3. **Patient Details** - View/edit patient info during stay
4. **Medical Records** - Daily notes, vitals, procedures
5. **Medications Management** - Prescribe and track medications

### Phase 2: Advanced Features
6. **Discharge Management** - Discharge summary and follow-up
7. **Lab/Imaging Requests** - Order and track tests
8. **Visitor Management** - Track visitors
9. **Transfer Management** - Inter-ward transfers
10. **Reports & Analytics** - Bed occupancy, admission trends

---

## 🛠️ File Structure

```
src/app/(dashboard)/(inpatient)/
├── page.tsx                          # IPD Dashboard
├── admission/
│   ├── page.tsx                      # Admission form
│   └── [id]/
│       └── page.tsx                  # Admission details
├── wards/
│   ├── page.tsx                      # Ward list & bed management
│   └── [wardId]/
│       └── page.tsx                  # Ward detail view
├── patients/
│   └── [admissionId]/
│       ├── page.tsx                  # Patient detail view
│       ├── medical-records/
│       │   └── page.tsx              # Daily notes & vitals
│       ├── medications/
│       │   └── page.tsx              # Medication management
│       ├── procedures/
│       │   └── page.tsx              # Procedure records
│       └── discharge/
│           └── page.tsx              # Discharge form
└── layout.tsx                        # IPD layout

src/components/inpatient/
├── ward-dashboard.tsx                # Ward overview
├── bed-status-card.tsx               # Individual bed display
├── admission-form.tsx                # Admission form component
├── daily-notes-form.tsx              # Medical notes entry
├── vital-signs-form.tsx              # Vitals entry
├── medications-list.tsx              # Medication display
├── discharge-form.tsx                # Discharge form
└── visitors-log.tsx                  # Visitor tracking

src/lib/inpatient/
├── api.ts                            # API calls
├── types.ts                          # TypeScript interfaces
└── utils.ts                          # Helper functions
```

---

## 🔄 Key Features

### 1. Admission Management
- [x] Create new admission
- [ ] Assign bed automatically
- [ ] Link to OPD visit
- [ ] Set attending doctor & nurse
- [ ] Auto-generate admission number

### 2. Bed Management
- [x] View ward layout
- [ ] Track bed status (available, occupied, maintenance)
- [ ] Manual bed assignment
- [ ] Transfer between beds/wards
- [ ] Maintenance scheduling

### 3. Medical Records
- [ ] Daily SOAP notes
- [ ] Vital signs tracking (Temperature, BP, HR, RR, O2 Sat)
- [ ] Procedures performed
- [ ] Medical observations

### 4. Medication Management
- [ ] Prescription entry
- [ ] MAR (Medication Administration Record)
- [ ] Track administration (given, missed, refused)
- [ ] Pharmacy integration

### 5. Lab & Imaging
- [ ] Request lab tests
- [ ] Request imaging (X-ray, CT, MRI, Ultrasound, ECG)
- [ ] View results
- [ ] Track status

### 6. Discharge Management
- [ ] Generate discharge summary
- [ ] Define follow-up instructions
- [ ] Prescribe discharge medications
- [ ] Set review date

### 7. Visitor Management
- [ ] Log visitor entry/exit
- [ ] Track relationship to patient
- [ ] Visiting hours compliance

---

## 📱 UI Pages to Build (Priority Order)

### PHASE 1: MVP (Essential)
**Week 1-2:**
1. **IPD Dashboard** - Ward overview, bed status summary
2. **Admission Form** - Create new admission
3. **Ward Management** - View and manage beds
4. **Patient Details** - View active admission
5. **Daily Notes** - Quick daily SOAP entry
6. **Vital Signs** - Quick vitals entry

### PHASE 2: Clinical (Important)
**Week 3-4:**
7. **Medications** - Prescribe and track
8. **MAR** - Medication administration record
9. **Procedures** - Record procedures
10. **Lab Requests** - Request and view results
11. **Imaging Requests** - Request and view images

### PHASE 3: Administrative (Nice to have)
**Week 5:**
12. **Discharge** - Generate discharge summary
13. **Transfer** - Transfer between wards
14. **Visitors** - Track visitor logs
15. **Reports** - Analytics and occupancy reports

---

## 🗄️ Database Integration

### Relationships
```
patients (existing)
├── inpatient_admissions
│   ├── wards
│   ├── beds
│   ├── inpatient_daily_notes
│   ├── inpatient_vital_signs
│   ├── inpatient_medications
│   │   └── drugs
│   ├── inpatient_procedures
│   ├── discharge_summaries
│   ├── inpatient_lab_requests
│   ├── inpatient_imaging_requests
│   ├── inpatient_transfers
│   └── visitor_logs
```

---

## 🔐 Security & Permissions

### Role-Based Access
- **DOCTOR**: 
  - View all admissions in assigned ward
  - Prescribe medications
  - Make medical notes
  - Order tests/imaging
  - Discharge patients

- **NURSE**: 
  - View assigned patients
  - Record vitals
  - Administer medications (MAR)
  - Make care notes
  - Log visitors

- **LAB**: 
  - View inpatient lab requests
  - Enter lab results

- **ADMIN**: 
  - Manage wards/beds
  - View all admissions
  - Generate reports

- **RECEPTION**: 
  - Create admissions
  - View patient locations
  - Transfer requests

---

## 📊 API Endpoints Required

```
POST   /api/inpatient/admissions              - Create admission
GET    /api/inpatient/admissions              - List admissions
GET    /api/inpatient/admissions/:id          - Get admission details
PUT    /api/inpatient/admissions/:id          - Update admission
DELETE /api/inpatient/admissions/:id          - Discharge patient

GET    /api/inpatient/wards                   - List wards
GET    /api/inpatient/wards/:id               - Ward details
GET    /api/inpatient/beds                    - List beds with status
PUT    /api/inpatient/beds/:id                - Update bed status

POST   /api/inpatient/daily-notes             - Create daily note
GET    /api/inpatient/daily-notes/:admissionId - Get notes

POST   /api/inpatient/vital-signs             - Record vitals
GET    /api/inpatient/vital-signs/:admissionId - Get vitals

POST   /api/inpatient/medications             - Prescribe medication
GET    /api/inpatient/medications/:admissionId - Get medications
POST   /api/inpatient/mar                     - Record administration

POST   /api/inpatient/discharge               - Create discharge summary
GET    /api/inpatient/discharge/:admissionId  - Get discharge summary

GET    /api/inpatient/reports/occupancy       - Bed occupancy report
GET    /api/inpatient/reports/admissions      - Admission trends
```

---

## 🎨 UI Components Checklist

### reusable Components
- [ ] WardCard - Display ward info & bed count
- [ ] BedStatus - Show individual bed status
- [ ] PatientAdmissionCard - Show patient admission info
- [ ] DailyNoteForm - SOAP note form
- [ ] VitalSignsForm - Vital signs entry
- [ ] MedicationList - List of prescribed medications
- [ ] DischargeSummary - Display discharge info
- [ ] LabResultsTable - Display lab results
- [ ] ImagingResultsDisplay - Display imaging results

---

## 📈 Development Timeline

| Week | Tasks | Status |
|------|-------|--------|
| Week 1 | DB schema + Dashboard + Admission form | 🔄 Starting |
| Week 2 | Ward mgmt + Patient view + Daily notes | Planned |
| Week 3 | Medications + MAR + Procedures | Planned |
| Week 4 | Discharge + Lab/Imaging requests | Planned |
| Week 5 | Reports + Visitors + Polish | Planned |

---

## 🚀 Next Steps

1. **Run SQL Schema** - Execute inpatient_schema.sql in Supabase
2. **Create Core Pages** - Start with IPD dashboard
3. **Build Components** - Reusable UI components
4. **API Integration** - Connect to database
5. **Testing** - Test with different roles
6. **Polish** - UI/UX improvements

---

## 📝 Notes

- All dates/times are timezone-aware
- Soft deletes not used (hard deletes with CASCADE)
- Admission number auto-generated on admission
- Bed status automatically updated on admission/discharge
- MAR records created automatically on medication prescription

