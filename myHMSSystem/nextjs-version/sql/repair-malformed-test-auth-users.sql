-- Repairs the nine legacy test accounts created by the old direct auth.users INSERT.
-- The old rows have no auth.identities entry, so GoTrue cannot manage or list them,
-- while auth.users.users_email_partial_key still prevents supported account creation.

BEGIN;

CREATE TEMP TABLE hms_test_account_emails (email text PRIMARY KEY) ON COMMIT DROP;

INSERT INTO hms_test_account_emails (email) VALUES
  ('admin@hospital.com'),
  ('doctor1@hospital.com'),
  ('doctor2@hospital.com'),
  ('nurse1@hospital.com'),
  ('nurse2@hospital.com'),
  ('lab@hospital.com'),
  ('pharmacy@hospital.com'),
  ('reception@hospital.com'),
  ('finance@hospital.com');

-- Safety stop: never delete an account that has a valid Supabase identity.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN hms_test_account_emails t ON lower(u.email) = t.email
    JOIN auth.identities i ON i.user_id = u.id
  ) THEN
    RAISE EXCEPTION
      'Repair stopped: at least one target email has a valid auth identity. Review the preview query instead of deleting it.';
  END IF;
END
$$;

-- Remove only application records tied to the malformed target accounts.
DELETE FROM public.staff s
USING hms_test_account_emails t
WHERE lower(s.email) = t.email;

DELETE FROM public.profiles p
USING auth.users u, hms_test_account_emails t
WHERE p.id = u.id
  AND lower(u.email) = t.email
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);

-- Remove only target auth rows that have no identity and cannot be managed by GoTrue.
DELETE FROM auth.users u
USING hms_test_account_emails t
WHERE lower(u.email) = t.email
  AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id);

COMMIT;

-- Expected result after COMMIT: zero rows.
SELECT u.id, u.email
FROM auth.users u
WHERE lower(u.email) IN (
  'admin@hospital.com',
  'doctor1@hospital.com',
  'doctor2@hospital.com',
  'nurse1@hospital.com',
  'nurse2@hospital.com',
  'lab@hospital.com',
  'pharmacy@hospital.com',
  'reception@hospital.com',
  'finance@hospital.com'
);
