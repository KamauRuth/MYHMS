-- ============================================
-- RESET PASSWORDS FOR USERS WITH NULL ROLES
-- ============================================
-- These users need passwords to login

-- Step 1: Reset Passwords (Run individually for each user)
-- Replace 'doctor@hospital.com' and 'NewPassword123' with actual values

UPDATE auth.users 
SET encrypted_password = crypt('Doctor@123456', gen_salt('bf'))
WHERE email = 'doctor@hospital.com';

UPDATE auth.users 
SET encrypted_password = crypt('Doctor@123456', gen_salt('bf'))
WHERE email = 'doctor3@hospital.com';

UPDATE auth.users 
SET encrypted_password = crypt('Finance@123456', gen_salt('bf'))
WHERE email = 'finance1@hospital.com';

UPDATE auth.users 
SET encrypted_password = crypt('Lab@123456', gen_salt('bf'))
WHERE email = 'lab1@hospital.com';

UPDATE auth.users 
SET encrypted_password = crypt('Nurse@123456', gen_salt('bf'))
WHERE email = 'nurse@hospital.com';

UPDATE auth.users 
SET encrypted_password = crypt('Nurse@123456', gen_salt('bf'))
WHERE email = 'nurse3@hospital.com';

UPDATE auth.users 
SET encrypted_password = crypt('Pharmacy@123456', gen_salt('bf'))
WHERE email = 'pharmacy1@hospital.com';

UPDATE auth.users 
SET encrypted_password = crypt('Reception@123456', gen_salt('bf'))
WHERE email = 'reception1@hospital.com';

-- Step 2: Verify passwords were set
SELECT email, encrypted_password IS NOT NULL as has_password
FROM auth.users
WHERE email IN (
  'doctor@hospital.com',
  'doctor3@hospital.com',
  'finance1@hospital.com',
  'lab1@hospital.com',
  'nurse@hospital.com',
  'nurse3@hospital.com',
  'pharmacy1@hospital.com',
  'reception1@hospital.com'
);
