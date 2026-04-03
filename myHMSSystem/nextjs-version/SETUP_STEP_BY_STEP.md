# 🚀 Step-by-Step Test User Setup Guide

## ⚠️ Important: If SQL Fails

If you get an error when running Step 1, **use the Admin UI instead**:

1. Go to: `http://localhost:3000/sign-in`
2. Try login with any existing admin account, OR
3. Use the server endpoint to create users automatically

### **ALTERNATIVE: Use the Automated Setup Page**

If SQL keeps failing, I've created a simpler method. Let me know and I'll set up an automated page where you just click "Create Test Users" button!

---

## Execute Each Step for Running Code

### **STEP 1: Create Auth Users**

📍 **Location**: Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → SQL Editor

1. **Copy this SQL code**:
```sql
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES
  (gen_random_uuid(), 'admin@hospital.com', crypt('Admin@123456', gen_salt('bf')), now(), '{"role":"ADMIN"}'),
  (gen_random_uuid(), 'doctor1@hospital.com', crypt('Doctor@123456', gen_salt('bf')), now(), '{"role":"DOCTOR"}'),
  (gen_random_uuid(), 'doctor2@hospital.com', crypt('Doctor@123456', gen_salt('bf')), now(), '{"role":"DOCTOR"}'),
  (gen_random_uuid(), 'nurse1@hospital.com', crypt('Nurse@123456', gen_salt('bf')), now(), '{"role":"NURSE"}'),
  (gen_random_uuid(), 'nurse2@hospital.com', crypt('Nurse@123456', gen_salt('bf')), now(), '{"role":"NURSE"}'),
  (gen_random_uuid(), 'lab@hospital.com', crypt('Lab@123456', gen_salt('bf')), now(), '{"role":"LAB"}'),
  (gen_random_uuid(), 'pharmacy@hospital.com', crypt('Pharmacy@123456', gen_salt('bf')), now(), '{"role":"PHARMACY"}'),
  (gen_random_uuid(), 'reception@hospital.com', crypt('Reception@123456', gen_salt('bf')), now(), '{"role":"RECEPTION"}'),
  (gen_random_uuid(), 'finance@hospital.com', crypt('Finance@123456', gen_salt('bf')), now(), '{"role":"FINANCE"}');
```

2. **Paste** into SQL Editor
3. **Click** "Run" button
4. ✅ You'll see: "9 rows inserted"

**Verification** - Run this to confirm:
```sql
SELECT email, role FROM auth.users WHERE email IN (
  'admin@hospital.com', 'doctor1@hospital.com', 'doctor2@hospital.com',
  'nurse1@hospital.com', 'nurse2@hospital.com', 'lab@hospital.com',
  'pharmacy@hospital.com', 'reception@hospital.com', 'finance@hospital.com'
) ORDER BY email;
```

**Expected Output**:
```
admin@hospital.com         | Administrator
doctor1@hospital.com       | DOCTOR
doctor2@hospital.com       | DOCTOR
finance@hospital.com       | FINANCE
lab@hospital.com           | LAB
nurse1@hospital.com        | NURSE
nurse2@hospital.com        | NURSE
pharmacy@hospital.com      | PHARMACY
reception@hospital.com     | RECEPTION
```

---

### **STEP 2: Create Profiles Records**

📍 **Same Supabase SQL Editor**

1. **Copy this SQL code**:
```sql
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
FROM user_ids u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = u.id);
```

2. **Click** "Run" button
3. ✅ You'll see: "9 rows inserted"

**Verification** - Run this:
```sql
SELECT role, COUNT(*) as count FROM public.profiles 
WHERE role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE')
GROUP BY role ORDER BY role;
```

**Expected Output**:
```
ADMIN      | 1
DOCTOR     | 2
FINANCE    | 1
LAB        | 1
NURSE      | 2
PHARMACY   | 1
RECEPTION  | 1
```

---

### **STEP 3: Create Staff Records**

📍 **Same Supabase SQL Editor**

1. **Copy this SQL code**:
```sql
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

2. **Click** "Run" button
3. ✅ You'll see: "9 rows inserted"

**Verification** - Run this:
```sql
SELECT COUNT(*) as total_staff FROM public.staff 
WHERE role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE');
```

**Expected Output**:
```
total_staff | 9
```

---

### **STEP 4: View All Created Users**

📍 **Same Supabase SQL Editor** - Run this to see everything together:

```sql
SELECT 
  CONCAT(s.first_name, ' ', s.last_name) as name,
  s.email,
  s.role,
  s.staff_id,
  s.department,
  COALESCE(p.role, 'MISSING') as profile_role,
  s.is_active
FROM public.staff s
LEFT JOIN public.profiles p ON s.user_id = p.id
WHERE s.role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE')
ORDER BY s.email;
```

**Expected Output** (9 rows):
```
System Administrator  | admin@hospital.com       | ADMIN      | ADM001 | Administration | ADMIN       | true
James Smith          | doctor1@hospital.com     | DOCTOR     | DOC001 | OPD            | DOCTOR      | true
Sarah Johnson        | doctor2@hospital.com     | DOCTOR     | DOC002 | OPD            | DOCTOR      | true
David Mwangi         | finance@hospital.com     | FINANCE    | FIN001 | Finance        | FINANCE     | true
Lab Technician       | lab@hospital.com         | LAB        | LAB001 | Laboratory     | LAB         | true
Emily Brown          | nurse1@hospital.com      | NURSE      | NUR001 | OPD            | NURSE       | true
Michael Davis        | nurse2@hospital.com      | NURSE      | NUR002 | OPD            | NURSE       | true
Henry Kiplagat       | pharmacy@hospital.com    | PHARMACY   | PHM001 | Pharmacy       | PHARMACY    | true
Grace Kariuki        | reception@hospital.com   | RECEPTION  | RCP001 | Reception      | RECEPTION   | true
```

---

## ✅ Testing the Setup

### **Test 1: Login as Admin**

1. Open: `http://localhost:3000/sign-in`
2. **Email**: `admin@hospital.com`
3. **Password**: `Admin@123456`
4. **Click** "Sign In"
5. ✅ Should redirect to dashboard
6. Look at **top-right** - verify profile dropdown shows:
   - Email: `admin`
   - Role badge: `Administrator` (red)

### **Test 2: Login as Doctor**

1. Open: `http://localhost:3000/sign-in`
2. **Email**: `doctor1@hospital.com`
3. **Password**: `Doctor@123456`
4. **Click** "Sign In"
5. ✅ Should redirect to dashboard
6. Look at **top-right** - verify profile dropdown shows:
   - Email: `doctor1`
   - Role badge: `Doctor` (blue)

### **Test 3: Test RBAC - Admin Access Only**

1. **Login as admin** (see Test 1)
2. Go to: `http://localhost:3000/dashboard/users`
3. ✅ Should see **Staff Management** page
4. **Logout** and login as `doctor1@hospital.com`
5. Go to: `http://localhost:3000/dashboard/users`
6. ⚠️ Should see **Access Denied** message

### **Test 4: Auto-Department Selection**

1. **Login as doctor** (see Test 2)
2. Go to: `http://localhost:3000/dashboard/opd`
3. Click "New Visit"
4. ✅ The **Department** field should auto-select: `OPD`
5. **Logout** and login as `lab@hospital.com` / `Lab@123456`
6. Go to: `http://localhost:3000/dashboard/lab`
7. ✅ Department should auto-select to: `Laboratory`

---

## 📋 Login Credentials Reference

| Role | Email | Password | Department |
|------|-------|----------|-----------|
| **Admin** | admin@hospital.com | Admin@123456 | Administration |
| **Doctor 1** | doctor1@hospital.com | Doctor@123456 | OPD |
| **Doctor 2** | doctor2@hospital.com | Doctor@123456 | OPD |
| **Nurse 1** | nurse1@hospital.com | Nurse@123456 | OPD |
| **Nurse 2** | nurse2@hospital.com | Nurse@123456 | OPD |
| **Lab Tech** | lab@hospital.com | Lab@123456 | Laboratory |
| **Pharmacist** | pharmacy@hospital.com | Pharmacy@123456 | Pharmacy |
| **Receptionist** | reception@hospital.com | Reception@123456 | Reception |
| **Finance Officer** | finance@hospital.com | Finance@123456 | Finance |

---

## 🐛 Troubleshooting

### Problem: "Email already exists"
- **Cause**: Users were partially inserted before
- **Solution**: 
  ```sql
  DELETE FROM public.staff WHERE email LIKE '%@hospital.com';
  DELETE FROM public.profiles WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@hospital.com'
  );
  DELETE FROM auth.users WHERE email LIKE '%@hospital.com';
  ```
- Then repeat Step 1-3

### Problem: "Profile role shows MISSING"
- **Cause**: Step 2 didn't run successfully
- **Solution**: Re-run Step 2 SQL again

### Problem: "Password incorrect" when logging in
- **Cause**: Password mismatch or case-sensitive
- **Solution**: Check passwords exactly (they're case-sensitive)

### Problem: "Department not auto-selecting"
- **Cause**: User's profile role not matching
- **Solution**: Check profile role matches user role in Step 2

---

## ✨ All Done!

Your test users are now ready. Start with **Test 1** and work through each test scenario.
