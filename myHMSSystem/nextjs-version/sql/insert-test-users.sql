/**
 * SQL SCRIPT TO INSERT TEST USERS
 * 
 * Steps:
 * 1. Create auth users in Supabase Auth (or use admin-page UI)
 * 2. Get the UUIDs of created users
 * 3. Run this script with the UUIDs in Supabase SQL Editor
 */

-- Replace these with actual UUIDs from auth.users after creating them
-- You can find UUIDs in: Supabase Dashboard > Authentication > Users

-- PROFILES INSERT
INSERT INTO public.profiles (id, role, facility_id, created_at) VALUES
-- Replace UUIDs below with actual user IDs from auth.users
('550e8400-e29b-41d4-a716-446655440000', 'ADMIN', NULL, now()),
('550e8400-e29b-41d4-a716-446655440001', 'DOCTOR', NULL, now()),
('550e8400-e29b-41d4-a716-446655440002', 'DOCTOR', NULL, now()),
('550e8400-e29b-41d4-a716-446655440003', 'NURSE', NULL, now()),
('550e8400-e29b-41d4-a716-446655440004', 'NURSE', NULL, now()),
('550e8400-e29b-41d4-a716-446655440005', 'LAB', NULL, now()),
('550e8400-e29b-41d4-a716-446655440006', 'PHARMACY', NULL, now()),
('550e8400-e29b-41d4-a716-446655440007', 'RECEPTION', NULL, now()),
('550e8400-e29b-41d4-a716-446655440008', 'FINANCE', NULL, now());

-- STAFF INSERT (Comprehensive staff information)
INSERT INTO public.staff (id, staff_id, first_name, last_name, email, phone, role, specialty, department, is_active, user_id, created_at) VALUES
(gen_random_uuid(), 'ADM001', 'System', 'Administrator', 'admin@hospital.com', '+254700000001', 'ADMIN', NULL, 'Administration', true, '550e8400-e29b-41d4-a716-446655440000', now()),
(gen_random_uuid(), 'DOC001', 'James', 'Smith', 'doctor1@hospital.com', '+254700000002', 'DOCTOR', 'General Medicine', 'OPD', true, '550e8400-e29b-41d4-a716-446655440001', now()),
(gen_random_uuid(), 'DOC002', 'Sarah', 'Johnson', 'doctor2@hospital.com', '+254700000003', 'DOCTOR', 'Pediatrics', 'OPD', true, '550e8400-e29b-41d4-a716-446655440002', now()),
(gen_random_uuid(), 'NUR001', 'Emily', 'Brown', 'nurse1@hospital.com', '+254700000004', 'NURSE', NULL, 'OPD', true, '550e8400-e29b-41d4-a716-446655440003', now()),
(gen_random_uuid(), 'NUR002', 'Michael', 'Davis', 'nurse2@hospital.com', '+254700000005', 'NURSE', NULL, 'OPD', true, '550e8400-e29b-41d4-a716-446655440004', now()),
(gen_random_uuid(), 'LAB001', 'Lab', 'Technician', 'lab@hospital.com', '+254700000006', 'LAB', NULL, 'Laboratory', true, '550e8400-e29b-41d4-a716-446655440005', now()),
(gen_random_uuid(), 'PHM001', 'Henry', 'Kiplagat', 'pharmacy@hospital.com', '+254700000007', 'PHARMACY', NULL, 'Pharmacy', true, '550e8400-e29b-41d4-a716-446655440006', now()),
(gen_random_uuid(), 'RCP001', 'Grace', 'Kariuki', 'reception@hospital.com', '+254700000008', 'RECEPTION', NULL, 'Reception', true, '550e8400-e29b-41d4-a716-446655440007', now()),
(gen_random_uuid(), 'FIN001', 'David', 'Mwangi', 'finance@hospital.com', '+254700000009', 'FINANCE', NULL, 'Finance', true, '550e8400-e29b-41d4-a716-446655440008', now());

-- Verify the inserts
SELECT 'PROFILES' as table_name, COUNT(*) as count FROM public.profiles WHERE role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE')
UNION ALL
SELECT 'STAFF', COUNT(*) FROM public.staff WHERE role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE');
