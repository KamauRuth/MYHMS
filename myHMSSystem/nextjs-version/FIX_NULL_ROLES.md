# 🔧 Fix Null Roles & Complete Setup Guide

## 📊 Current Status

You have **8 users with null roles** that need to be fixed:
- doctor@hospital.com
- doctor3@hospital.com
- finance1@hospital.com
- lab1@hospital.com
- nurse@hospital.com
- nurse3@hospital.com
- pharmacy1@hospital.com
- reception1@hospital.com

---

## ✅ Option 1: Use the Automated Setup Wizard (EASIEST)

### Step 1: Start the Development Server
```bash
cd C:\Users\Wakamau\Desktop\MYHMS\myHMSSystem\nextjs-version
npm run dev
```

### Step 2: Open the Setup Wizard
1. Go to: `http://localhost:3000/dashboard/setup`
2. You'll see a beautiful dashboard with:
   - ✅ Setup tab for creating users
   - 📋 Credentials tab showing all user logins

### Step 3: Click "Create All Test Users"
- The page will automatically create all 9 test users
- Shows progress in real-time
- Color-coded status for each user

### Step 4: View Login Credentials
- Switch to the **Credentials tab**
- See all 9 test users with email/password
- Copy any to test login

---

## ✅ Option 2: Manual SQL Fix (If Setup Wizard Fails)

### Step 1: Fix Null Roles in Supabase

📍 Go to: [Supabase Dashboard](https://app.supabase.com) → Your Project → SQL Editor

**Copy this entire script**:

```sql
-- Create/Update Profiles with Correct Roles
INSERT INTO public.profiles (id, role, facility_id, created_at)
SELECT
  u.id,
  CASE 
    WHEN u.email LIKE 'doctor%' THEN 'DOCTOR'
    WHEN u.email LIKE 'nurse%' THEN 'NURSE'
    WHEN u.email LIKE 'lab%' THEN 'LAB'
    WHEN u.email LIKE 'pharmacy%' THEN 'PHARMACY'
    WHEN u.email LIKE 'reception%' THEN 'RECEPTION'
    WHEN u.email LIKE 'finance%' THEN 'FINANCE'
    ELSE 'OTHER'
  END as role,
  NULL,
  now()
FROM auth.users u
WHERE u.email IN (
  'doctor@hospital.com',
  'doctor3@hospital.com',
  'finance1@hospital.com',
  'lab1@hospital.com',
  'nurse@hospital.com',
  'nurse3@hospital.com',
  'pharmacy1@hospital.com',
  'reception1@hospital.com'
)
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Create Staff Records
WITH user_mapping AS (
  SELECT id, email FROM auth.users WHERE email IN (
    'doctor@hospital.com',
    'doctor3@hospital.com',
    'finance1@hospital.com',
    'lab1@hospital.com',
    'nurse@hospital.com',
    'nurse3@hospital.com',
    'pharmacy1@hospital.com',
    'reception1@hospital.com'
  )
)
INSERT INTO public.staff (id, staff_id, first_name, last_name, email, phone, role, specialty, department, is_active, user_id, created_at)
SELECT
  gen_random_uuid(),
  CASE 
    WHEN u.email = 'doctor@hospital.com' THEN 'DOC003'
    WHEN u.email = 'doctor3@hospital.com' THEN 'DOC004'
    WHEN u.email = 'finance1@hospital.com' THEN 'FIN002'
    WHEN u.email = 'lab1@hospital.com' THEN 'LAB002'
    WHEN u.email = 'nurse@hospital.com' THEN 'NUR003'
    WHEN u.email = 'nurse3@hospital.com' THEN 'NUR004'
    WHEN u.email = 'pharmacy1@hospital.com' THEN 'PHM002'
    WHEN u.email = 'reception1@hospital.com' THEN 'RCP002'
  END,
  CASE 
    WHEN u.email = 'doctor@hospital.com' THEN 'Dr'
    WHEN u.email = 'doctor3@hospital.com' THEN 'Dr'
    WHEN u.email = 'finance1@hospital.com' THEN 'Finance'
    WHEN u.email = 'lab1@hospital.com' THEN 'Lab'
    WHEN u.email = 'nurse@hospital.com' THEN 'Nurse'
    WHEN u.email = 'nurse3@hospital.com' THEN 'Nurse'
    WHEN u.email = 'pharmacy1@hospital.com' THEN 'Pharmacist'
    WHEN u.email = 'reception1@hospital.com' THEN 'Receptionist'
  END,
  CASE 
    WHEN u.email = 'doctor@hospital.com' THEN 'Smith Jr'
    WHEN u.email = 'doctor3@hospital.com' THEN 'Wilson'
    WHEN u.email = 'finance1@hospital.com' THEN 'Officer'
    WHEN u.email = 'lab1@hospital.com' THEN 'Assistant'
    WHEN u.email = 'nurse@hospital.com' THEN 'Nelson'
    WHEN u.email = 'nurse3@hospital.com' THEN 'Williams'
    WHEN u.email = 'pharmacy1@hospital.com' THEN 'Chemist'
    WHEN u.email = 'reception1@hospital.com' THEN 'Assistant'
  END,
  u.email,
  '+254700' || LPAD(CAST(FLOOR(RANDOM() * 9000000) AS TEXT), 7, '0'),
  CASE 
    WHEN u.email LIKE 'doctor%' THEN 'DOCTOR'
    WHEN u.email LIKE 'nurse%' THEN 'NURSE'
    WHEN u.email LIKE 'lab%' THEN 'LAB'
    WHEN u.email LIKE 'pharmacy%' THEN 'PHARMACY'
    WHEN u.email LIKE 'reception%' THEN 'RECEPTION'
    WHEN u.email LIKE 'finance%' THEN 'FINANCE'
    ELSE 'OTHER'
  END,
  NULL,
  CASE 
    WHEN u.email LIKE 'doctor%' THEN 'OPD'
    WHEN u.email LIKE 'nurse%' THEN 'OPD'
    WHEN u.email LIKE 'lab%' THEN 'Laboratory'
    WHEN u.email LIKE 'pharmacy%' THEN 'Pharmacy'
    WHEN u.email LIKE 'reception%' THEN 'Reception'
    WHEN u.email LIKE 'finance%' THEN 'Finance'
    ELSE 'Other'
  END,
  true,
  u.id,
  now()
FROM user_mapping u
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff s WHERE s.user_id = u.id
);
```

**Then click "Run"**

### Step 2: Verify All Users Fixed
```sql
SELECT 
  s.email,
  s.role,
  p.role as profile_role
FROM public.staff s
LEFT JOIN public.profiles p ON s.user_id = p.id
WHERE s.email IN (
  'doctor@hospital.com',
  'doctor3@hospital.com',
  'finance1@hospital.com',
  'lab1@hospital.com',
  'nurse@hospital.com',
  'nurse3@hospital.com',
  'pharmacy1@hospital.com',
  'reception1@hospital.com'
)
ORDER BY s.email;
```

**Expected Output** - All should have matching roles:
```
doctor@hospital.com       | DOCTOR    | DOCTOR
doctor3@hospital.com      | DOCTOR    | DOCTOR
finance1@hospital.com     | FINANCE   | FINANCE
lab1@hospital.com         | LAB       | LAB
nurse@hospital.com        | NURSE     | NURSE
nurse3@hospital.com       | NURSE     | NURSE
pharmacy1@hospital.com    | PHARMACY  | PHARMACY
reception1@hospital.com   | RECEPTION | RECEPTION
```

---

## 🧪 Testing Fixed Users

### Test Login
1. Go to: `http://localhost:3000/sign-in`
2. Try: `doctor@hospital.com` / `Doctor@123456`
3. ✅ Should login and show profile with "Doctor" badge

### Test Auto-Department
1. Login as doctor
2. Go to: `http://localhost:3000/dashboard/opd`
3. Click "New Visit"
4. ✅ Department should auto-select to "OPD"

---

## 📋 All Users Credentials

### Original 9 Test Users
| Email | Password | Role | Department |
|-------|----------|------|-----------|
| admin@hospital.com | Admin@123456 | ADMIN | Administration |
| doctor1@hospital.com | Doctor@123456 | DOCTOR | OPD |
| doctor2@hospital.com | Doctor@123456 | DOCTOR | OPD |
| nurse1@hospital.com | Nurse@123456 | NURSE | OPD |
| nurse2@hospital.com | Nurse@123456 | NURSE | OPD |
| lab@hospital.com | Lab@123456 | LAB | Laboratory |
| pharmacy@hospital.com | Pharmacy@123456 | PHARMACY | Pharmacy |
| reception@hospital.com | Reception@123456 | RECEPTION | Reception |
| finance@hospital.com | Finance@123456 | FINANCE | Finance |

### Additional Users (Need Password)
| Email | Role | Department |
|-------|------|-----------|
| doctor@hospital.com | DOCTOR | OPD |
| doctor3@hospital.com | DOCTOR | OPD |
| finance1@hospital.com | FINANCE | Finance |
| lab1@hospital.com | LAB | Laboratory |
| nurse@hospital.com | NURSE | OPD |
| nurse3@hospital.com | NURSE | OPD |
| pharmacy1@hospital.com | PHARMACY | Pharmacy |
| reception1@hospital.com | RECEPTION | Reception |

---

## 🎯 Recommended Next Steps

1. **Use Setup Wizard** (if app is running):
   - Go to `http://localhost:3000/dashboard/setup`
   - Click "Create All Test Users"
   - See all credentials in the Credentials tab

2. **Test All Roles**:
   - Login as different users
   - Verify profile dropdown shows correct role/department
   - Test RBAC (admin-only pages)
   - Test auto-department selection

3. **Create More Test Data**:
   - Login as admin
   - Go to `/dashboard/users`
   - Register additional staff members with the UI

---

## ⚠️ Common Issues

**Q: "Email already exists"?**
- The user was created but role wasn't set
- Run the SQL fix above to add the missing profile

**Q: Password not matching?**
- These users were created without passwords
- You'll need to reset password in Supabase Auth console or set a new password

**Q: Department not auto-selecting?**
- Make sure the user's profile.role matches
- Re-run the SQL fix to ensure profile exists

---

## ✨ You're All Set!

Choose Option 1 (Setup Wizard) or Option 2 (SQL Fix) to complete the setup. The Setup Wizard is easiest!
