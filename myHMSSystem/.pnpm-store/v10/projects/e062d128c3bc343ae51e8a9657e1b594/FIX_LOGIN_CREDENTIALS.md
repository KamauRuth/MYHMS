# 🔐 Fix Invalid Login Credentials

## 🔴 Problem
You're getting: `Invalid login credentials` error

This happens because:
- ❌ These users don't have passwords set: doctor@hospital.com, doctor3@hospital.com, nurse@hospital.com, nurse3@hospital.com, lab1@hospital.com, pharmacy1@hospital.com, finance1@hospital.com, reception1@hospital.com
- ✅ These users DO have valid passwords (original 9):
  - admin@hospital.com / Admin@123456
  - doctor1@hospital.com / Doctor@123456
  - doctor2@hospital.com / Doctor@123456
  - nurse1@hospital.com / Nurse@123456
  - nurse2@hospital.com / Nurse@123456
  - lab@hospital.com / Lab@123456
  - pharmacy@hospital.com / Pharmacy@123456
  - reception@hospital.com / Reception@123456
  - finance@hospital.com / Finance@123456

---

## ✅ Solution: Two Options

### **Option 1: Login with Working Credentials (QUICKEST)**

Use any of these **original 9 test users** to login:

| Email | Password |
|-------|----------|
| admin@hospital.com | Admin@123456 |
| doctor1@hospital.com | Doctor@123456 |
| doctor2@hospital.com | Doctor@123456 |
| nurse1@hospital.com | Nurse@123456 |
| nurse2@hospital.com | Nurse@123456 |
| lab@hospital.com | Lab@123456 |
| pharmacy@hospital.com | Pharmacy@123456 |
| reception@hospital.com | Reception@123456 |
| finance@hospital.com | Finance@123456 |

**Steps:**
1. Go to: `http://localhost:3000/sign-in`
2. Enter any email from above (e.g., `admin@hospital.com`)
3. Enter password (e.g., `Admin@123456`)
4. ✅ Should login successfully

---

### **Option 2: Fix Passwords for Problematic Users**

If you want to use the users without passwords, you need to **set passwords in Supabase**.

#### Step 1: Go to Supabase SQL Editor

📍 [Supabase Dashboard](https://app.supabase.com) → Your Project → SQL Editor

#### Step 2: Reset Passwords

Copy and run **this entire script**:

```sql
-- Reset passwords for all 8 users
UPDATE auth.users SET encrypted_password = crypt('Doctor@123456', gen_salt('bf')) WHERE email = 'doctor@hospital.com';
UPDATE auth.users SET encrypted_password = crypt('Doctor@123456', gen_salt('bf')) WHERE email = 'doctor3@hospital.com';
UPDATE auth.users SET encrypted_password = crypt('Finance@123456', gen_salt('bf')) WHERE email = 'finance1@hospital.com';
UPDATE auth.users SET encrypted_password = crypt('Lab@123456', gen_salt('bf')) WHERE email = 'lab1@hospital.com';
UPDATE auth.users SET encrypted_password = crypt('Nurse@123456', gen_salt('bf')) WHERE email = 'nurse@hospital.com';
UPDATE auth.users SET encrypted_password = crypt('Nurse@123456', gen_salt('bf')) WHERE email = 'nurse3@hospital.com';
UPDATE auth.users SET encrypted_password = crypt('Pharmacy@123456', gen_salt('bf')) WHERE email = 'pharmacy1@hospital.com';
UPDATE auth.users SET encrypted_password = crypt('Reception@123456', gen_salt('bf')) WHERE email = 'reception1@hospital.com';
```

#### Step 3: Test Login

Now try logging in with:
- Email: `doctor@hospital.com`
- Password: `Doctor@123456`

✅ Should work!

---

## 📋 Complete Credentials After Fix

| Email | Password | Role |
|-------|----------|------|
| **admin@hospital.com** | Admin@123456 | ADMIN |
| doctor@hospital.com | Doctor@123456 | DOCTOR |
| doctor1@hospital.com | Doctor@123456 | DOCTOR |
| doctor2@hospital.com | Doctor@123456 | DOCTOR |
| doctor3@hospital.com | Doctor@123456 | DOCTOR |
| nurse@hospital.com | Nurse@123456 | NURSE |
| nurse1@hospital.com | Nurse@123456 | NURSE |
| nurse2@hospital.com | Nurse@123456 | NURSE |
| nurse3@hospital.com | Nurse@123456 | NURSE |
| lab@hospital.com | Lab@123456 | LAB |
| lab1@hospital.com | Lab@123456 | LAB |
| pharmacy@hospital.com | Pharmacy@123456 | PHARMACY |
| pharmacy1@hospital.com | Pharmacy@123456 | PHARMACY |
| reception@hospital.com | Reception@123456 | RECEPTION |
| reception1@hospital.com | Reception@123456 | RECEPTION |
| finance@hospital.com | Finance@123456 | FINANCE |
| finance1@hospital.com | Finance@123456 | FINANCE |

---

## 🎯 Next Steps

### Step 1: Login Successfully
- Use **Option 1** (quickest) with admin@hospital.com
- OR run **Option 2** to fix passwords, then try any user

### Step 2: Complete the Setup
After logging in as admin:
1. Go to: `http://localhost:3000/dashboard/setup`
2. Click "Create All Test Users" button
3. All 9 users will be created automatically with profiles

### Step 3: Test Different Roles
1. Logout
2. Login as different users (doctor, nurse, lab, etc.)
3. Verify profile dropdown shows correct role/department
4. Test RBAC: Go to `/dashboard/users` (only admin can access)
5. Test auto-department selection in OPD visit form

---

## 🐛 Troubleshooting

**Q: Still getting "Invalid credentials"?**

A: The password wasn't reset properly. Try this simpler approach:
1. Use one of the **original 9 users** (admin@hospital.com works)
2. Once logged in as admin, go to `/dashboard/setup`
3. Register new users there through the UI - no password issues

**Q: Can't find the Setup page?**

A: Make sure you're:
1. Logged in as admin first
2. At the correct URL: `http://localhost:3000/dashboard/setup`
3. App is running: `npm run dev`

**Q: "Connection refused" or "Cannot reach"?**

A: Start the dev server:
```bash
cd C:\Users\Wakamau\Desktop\MYHMS\myHMSSystem\nextjs-version
npm run dev
```

Then try login at: `http://localhost:3000/sign-in`

---

## ✨ Recommended Quick Path

1. Login with: **admin@hospital.com** / **Admin@123456** ✅
2. Go to: `http://localhost:3000/dashboard/setup`
3. Click "Create All Test Users"
4. Done! All users created with proper setup.

This is the fastest and most reliable way!
