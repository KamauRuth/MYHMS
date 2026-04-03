-- ============================================
-- MYHMS Test User Setup - SQL Commands
-- ============================================
-- Run each section in Supabase SQL Editor
-- Copy the entire section and paste into editor

-- ============================================
-- STEP 1: Create Auth Users
-- ============================================
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

-- ✅ After running above, verify with this query:
SELECT id, email FROM auth.users WHERE email IN (
  'admin@hospital.com', 'doctor1@hospital.com', 'doctor2@hospital.com',
  'nurse1@hospital.com', 'nurse2@hospital.com', 'lab@hospital.com',
  'pharmacy@hospital.com', 'reception@hospital.com', 'finance@hospital.com'
);

-- ============================================
-- STEP 2: Create Profiles Records
-- ============================================
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

-- ✅ Verify profiles created:
SELECT COUNT(*) as created_profiles FROM public.profiles WHERE role IN (
  'ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE'
);

-- ============================================
-- STEP 3: Create Staff Records
-- ============================================
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

-- ✅ Verify all staff created:
SELECT COUNT(*) as total_staff, 
       COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins,
       COUNT(CASE WHEN role = 'DOCTOR' THEN 1 END) as doctors,
       COUNT(CASE WHEN role = 'NURSE' THEN 1 END) as nurses,
       COUNT(CASE WHEN role = 'LAB' THEN 1 END) as lab_techs,
       COUNT(CASE WHEN role = 'PHARMACY' THEN 1 END) as pharm,
       COUNT(CASE WHEN role = 'RECEPTION' THEN 1 END) as receptionists,
       COUNT(CASE WHEN role = 'FINANCE' THEN 1 END) as finance
FROM public.staff 
WHERE role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE');

-- ============================================
-- STEP 4: View All Created Users
-- ============================================
SELECT 
  CONCAT(s.first_name, ' ', s.last_name) as name,
  s.email,
  s.role,
  s.staff_id,
  s.department,
  p.role as profile_role,
  s.is_active
FROM public.staff s
LEFT JOIN public.profiles p ON s.user_id = p.id
WHERE s.role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE')
ORDER BY 
  CASE WHEN s.role = 'ADMIN' THEN 0 ELSE 1 END,
  s.created_at;
