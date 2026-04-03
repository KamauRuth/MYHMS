-- ============================================
-- FIX: Create Profiles for Existing Users
-- ============================================
-- These users exist but have null roles
-- This script will fix them

-- Step 1: Create/Update Profiles with Correct Roles
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

-- Step 2: Create Staff Records for These Users
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

-- Step 3: Verify All Fixed Users
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
