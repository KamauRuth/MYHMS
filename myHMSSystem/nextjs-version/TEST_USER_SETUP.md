# Test User Setup Guide

## Overview

You have three tables for user management:
- **`auth.users`** (Supabase Auth) - Authentication credentials
- **`profiles`** - Role-based access control (required for app RBAC)
- **`staff`** - Comprehensive staff information (recommended)

## ✅ Recommended: Use Admin Registration Page

The easiest way is to use the **Staff Management page** you already have:

1. **Create First Admin** (Bootstrap):
   ```sql
   -- In Supabase SQL Editor:
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
   VALUES (
     gen_random_uuid(),
     'admin@hospital.com',
     crypt('Admin@123456', gen_salt('bf')),
     now()
   );
   
   -- Get the UUID from above, then insert profile:
   INSERT INTO public.profiles (id, role, created_at)
   VALUES ('YOUR_UUID_HERE', 'ADMIN', now());
   ```

2. **Login as Admin**: `admin@hospital.com` / `Admin@123456`

3. **Go to**: Dashboard → Users → Staff Management

4. **Click**: "Register New Staff" and fill in:
   - Email: `doctor1@hospital.com`
   - Password: `Doctor@123456`
   - Role: `DOCTOR`
   - Facility ID: (optional)

5. **Repeat for all test users**

## Alternative: Direct SQL Insert

If you prefer SQL, here's the complete script:

### Step 1: Create Auth Users

Run in Supabase SQL Editor (or your database client):

```sql
-- Create auth users with emails and passwords
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES
  ('admin@hospital.com', crypt('Admin@123456', gen_salt('bf')), now(), '{"role":"ADMIN"}'),
  ('doctor1@hospital.com', crypt('Doctor@123456', gen_salt('bf')), now(), '{"role":"DOCTOR"}'),
  ('doctor2@hospital.com', crypt('Doctor@123456', gen_salt('bf')), now(), '{"role":"DOCTOR"}'),
  ('nurse1@hospital.com', crypt('Nurse@123456', gen_salt('bf')), now(), '{"role":"NURSE"}'),
  ('nurse2@hospital.com', crypt('Nurse@123456', gen_salt('bf')), now(), '{"role":"NURSE"}'),
  ('lab@hospital.com', crypt('Lab@123456', gen_salt('bf')), now(), '{"role":"LAB"}'),
  ('pharmacy@hospital.com', crypt('Pharmacy@123456', gen_salt('bf')), now(), '{"role":"PHARMACY"}'),
  ('reception@hospital.com', crypt('Reception@123456', gen_salt('bf')), now(), '{"role":"RECEPTION"}'),
  ('finance@hospital.com', crypt('Finance@123456', gen_salt('bf')), now(), '{"role":"FINANCE"}');

-- Verify they were created
SELECT id, email FROM auth.users WHERE email IN (
  'admin@hospital.com', 'doctor1@hospital.com', 'doctor2@hospital.com',
  'nurse1@hospital.com', 'nurse2@hospital.com', 'lab@hospital.com',
  'pharmacy@hospital.com', 'reception@hospital.com', 'finance@hospital.com'
);
```

This will output the UUIDs. Copy them and save them.

### Step 2: Create Profiles

```sql
-- Copy the UUIDs from Step 1 and use them here
WITH user_ids AS (
  SELECT id, email FROM auth.users WHERE email IN (
    'admin@hospital.com', 'doctor1@hospital.com', 'doctor2@hospital.com',
    'nurse1@hospital.com', 'nurse2@hospital.com', 'lab@hospital.com',
    'pharmacy@hospital.com', 'reception@hospital.com', 'finance@hospital.com'
  )
)
INSERT INTO public.profiles (id, role, facility_id, created_at)
SELECT
  u.id,
  CASE 
    WHEN u.email = 'admin@hospital.com' THEN 'ADMIN'
    WHEN u.email LIKE 'doctor%' THEN 'DOCTOR'
    WHEN u.email LIKE 'nurse%' THEN 'NURSE'
    WHEN u.email = 'lab@hospital.com' THEN 'LAB'
    WHEN u.email = 'pharmacy@hospital.com' THEN 'PHARMACY'
    WHEN u.email = 'reception@hospital.com' THEN 'RECEPTION'
    WHEN u.email = 'finance@hospital.com' THEN 'FINANCE'
  END,
  NULL,
  now()
FROM user_ids u;
```

### Step 3: Create Staff Records

```sql
-- Link staff records to auth users
WITH user_mapping AS (
  SELECT id, email FROM auth.users WHERE email IN (
    'admin@hospital.com', 'doctor1@hospital.com', 'doctor2@hospital.com',
    'nurse1@hospital.com', 'nurse2@hospital.com', 'lab@hospital.com',
    'pharmacy@hospital.com', 'reception@hospital.com', 'finance@hospital.com'
  )
)
INSERT INTO public.staff (id, staff_id, first_name, last_name, email, phone, role, specialty, department, is_active, user_id, created_at)
VALUES
  (gen_random_uuid(), 'ADM001', 'System', 'Administrator', 'admin@hospital.com', '+254700000001', 'ADMIN', NULL, 'Administration', true, (SELECT id FROM user_mapping WHERE email = 'admin@hospital.com'), now()),
  (gen_random_uuid(), 'DOC001', 'James', 'Smith', 'doctor1@hospital.com', '+254700000002', 'DOCTOR', 'General Medicine', 'OPD', true, (SELECT id FROM user_mapping WHERE email = 'doctor1@hospital.com'), now()),
  (gen_random_uuid(), 'DOC002', 'Sarah', 'Johnson', 'doctor2@hospital.com', '+254700000003', 'DOCTOR', 'Pediatrics', 'OPD', true, (SELECT id FROM user_mapping WHERE email = 'doctor2@hospital.com'), now()),
  (gen_random_uuid(), 'NUR001', 'Emily', 'Brown', 'nurse1@hospital.com', '+254700000004', 'NURSE', NULL, 'OPD', true, (SELECT id FROM user_mapping WHERE email = 'nurse1@hospital.com'), now()),
  (gen_random_uuid(), 'NUR002', 'Michael', 'Davis', 'nurse2@hospital.com', '+254700000005', 'NURSE', NULL, 'OPD', true, (SELECT id FROM user_mapping WHERE email = 'nurse2@hospital.com'), now()),
  (gen_random_uuid(), 'LAB001', 'Lab', 'Technician', 'lab@hospital.com', '+254700000006', 'LAB', NULL, 'Laboratory', true, (SELECT id FROM user_mapping WHERE email = 'lab@hospital.com'), now()),
  (gen_random_uuid(), 'PHM001', 'Henry', 'Kiplagat', 'pharmacy@hospital.com', '+254700000007', 'PHARMACY', NULL, 'Pharmacy', true, (SELECT id FROM user_mapping WHERE email = 'pharmacy@hospital.com'), now()),
  (gen_random_uuid(), 'RCP001', 'Grace', 'Kariuki', 'reception@hospital.com', '+254700000008', 'RECEPTION', NULL, 'Reception', true, (SELECT id FROM user_mapping WHERE email = 'reception@hospital.com'), now()),
  (gen_random_uuid(), 'FIN001', 'David', 'Mwangi', 'finance@hospital.com', '+254700000009', 'FINANCE', NULL, 'Finance', true, (SELECT id FROM user_mapping WHERE email = 'finance@hospital.com'), now());
```

### Step 4: Verify

```sql
-- Check profiles created
SELECT COUNT(*) as profile_count FROM public.profiles WHERE role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE');

-- Check staff created
SELECT COUNT(*) as staff_count FROM public.staff WHERE role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE');

-- View all test users
SELECT 
  CONCAT(s.first_name, ' ', s.last_name) as name,
  s.email,
  s.role,
  s.staff_id,
  s.department
FROM public.staff s
WHERE s.role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE')
ORDER BY s.created_at;
```

## Test Users Reference

| Email | Password | Role | First/Last Name | Department |
|-------|----------|------|-----------------|------------|
| admin@hospital.com | Admin@123456 | ADMIN | System Administrator | Administration |
| doctor1@hospital.com | Doctor@123456 | DOCTOR | James Smith | OPD |
| doctor2@hospital.com | Doctor@123456 | DOCTOR | Sarah Johnson | OPD |
| nurse1@hospital.com | Nurse@123456 | NURSE | Emily Brown | OPD |
| nurse2@hospital.com | Nurse@123456 | NURSE | Michael Davis | OPD |
| lab@hospital.com | Lab@123456 | LAB | Lab Technician | Laboratory |
| pharmacy@hospital.com | Pharmacy@123456 | PHARMACY | Henry Kiplagat | Pharmacy |
| reception@hospital.com | Reception@123456 | RECEPTION | Grace Kariuki | Reception |
| finance@hospital.com | Finance@123456 | FINANCE | David Mwangi | Finance |

## Table Relationships

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth - Email + Password)
└────────┬────────┘
         │ id (UUID)
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
    ┌────▼────┐        ┌────▼─────┐      ┌────▼──────┐
    │ profiles │        │  staff    │      │   users   │
    ├──────────┤        │           │      │           │
    │ id (PK)  │        │ user_id   │      │ id (PK)   │
    │ role     │        │ staff_id  │      │ name      │
    │ facility │        │ first_name│      │ email     │
    └──────────┘        │ last_name │      │ role      │
       (RBAC)           │ role      │      └───────────┘
                        │ department│    (Redundant)
                        │ specialty │
                        │ phone     │
                        └───────────┘
                        (Comprehensive)
```

## My Recommendation

✅ **USE**: `profiles` + `staff`
- ❌ **AVOID**: `users` table (it's redundant and shouldn't store password)

- **profiles**: Lightweight, used for RBAC checks
- **staff**: Comprehensive staff information (name, specialty, department, etc.)
- **auth.users**: Supabase Auth (never manually modify passwords here)

Start with the **Admin Registration Page** - it's easier and more reliable!
