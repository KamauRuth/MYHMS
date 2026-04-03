# Role-Based Access Control & User Management Setup

## Overview

The system now implements role-based access control (RBAC) with admin-only user registration. Only administrators can register new staff users in the system.

## Roles Available

- **ADMIN** - Full system access, can register staff
- **DOCTOR** - OPD consultations, prescriptions
- **NURSE** - Nursing duties (OPD support)
- **LAB** - Laboratory operations
- **PHARMACY** - Pharmacy operations
- **RECEPTION** - Patient reception
- **FINANCE** - Financial operations

## Step 1: Create the First Admin User (Bootstrap)

Since you need an admin to create other admins, use one of these methods:

### Method A: Direct Database Insert (Fastest)

```sql
-- Create an admin user directly in Supabase
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run these commands:

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  gen_random_uuid(),
  'admin@hospital.com',
  crypt('Admin@123456', gen_salt('bf')),
  now()
);

-- 2. Get the user ID from above and insert profile
INSERT INTO public.profiles (id, role, created_at)
VALUES ('USER_ID_FROM_ABOVE', 'ADMIN', now());
```

### Method B: Using API Route

```bash
# Call the test user creation endpoint as the first admin
curl -X POST http://localhost:3000/api/admin/create-test-users
```

### Method C: Manual Registration + Database Update

1. Sign up a user normally
2. Then manually update their profiles record in Supabase to have role = 'ADMIN'

## Step 2: Create Test Users

Once you have an admin account, use the Staff Management page:

### Via Admin Dashboard UI

1. **Login as Admin** (admin@hospital.com / Admin@123456)
2. **Navigate to**: Dashboard > Users > Staff Management
3. **Click**: "Register New Staff"
4. **Fill form**:
   - Email: staff@hospital.com
   - Password: Staff@123456
   - Role: Select appropriate role
   - Facility ID: (optional)
5. **Submit**

### Via API (Auto-Generate All Test Users)

If you want to quickly generate all test users at once:

```typescript
// In browser console or your admin page:
import { createAllTestUsers } from "@/lib/testUsers"
await createAllTestUsers()

// This creates:
// admin@hospital.com / Admin@123456 (ADMIN)
// doctor1@hospital.com / Doctor@123456 (DOCTOR)
// doctor2@hospital.com / Doctor@123456 (DOCTOR)
// nurse1@hospital.com / Nurse@123456 (NURSE)
// nurse2@hospital.com / Nurse@123456 (NURSE)
// lab@hospital.com / Lab@123456 (LAB)
// pharmacy@hospital.com / Pharmacy@123456 (PHARMACY)
// reception@hospital.com / Reception@123456 (RECEPTION)
// finance@hospital.com / Finance@123456 (FINANCE)
```

## Test User Credentials

```
┌─────────────────────────────────┬──────────────────┬─────────────────┐
│ Email                           │ Password         │ Role            │
├─────────────────────────────────┼──────────────────┼─────────────────┤
│ admin@hospital.com              │ Admin@123456     │ ADMIN           │
│ doctor1@hospital.com            │ Doctor@123456    │ DOCTOR          │
│ doctor2@hospital.com            │ Doctor@123456    │ DOCTOR          │
│ nurse1@hospital.com             │ Nurse@123456     │ NURSE           │
│ nurse2@hospital.com             │ Nurse@123456     │ NURSE           │
│ lab@hospital.com                │ Lab@123456       │ LAB             │
│ pharmacy@hospital.com           │ Pharmacy@123456  │ PHARMACY        │
│ reception@hospital.com          │ Reception@123456 │ RECEPTION       │
│ finance@hospital.com            │ Finance@123456   │ FINANCE         │
└─────────────────────────────────┴──────────────────┴─────────────────┘
```

## User Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Staff Management Page                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ✓ Admin-only access (checked via AdminRoute)               │
│ ✓ Register new staff form                                  │
│ ✓ Email validation                                         │
│ ✓ Password validation (min 6 chars)                        │
│                                                             │
│ On Submit:                                                  │
│ 1. Create user in auth.users (Supabase Auth)              │
│ 2. Create profile in profiles table                        │
│ 3. Auto-assign role and facility_id                       │
│ 4. Show confirmation                                       │
│                                                             │
│ Display all registered staff with:                         │
│ - Email address                                            │
│ - Role (with color badges)                                │
│ - Facility ID                                              │
│ - Registration date                                        │
│ - Delete action (admin only)                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## How Role-Based Access Works

### AdminRoute Component

```typescript
// src/components/AdminRoute.tsx
// Wraps protected admin-only pages

export function AdminRoute({ children }: AdminRouteProps) {
  useEffect(() => {
    const checkAdminAccess = async () => {
      // 1. Get logged-in user
      const { data: userData } = await supabase.auth.getUser()
      
      // 2. Check their role in profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
      
      // 3. Allow only if role === "ADMIN"
      if (profile.role !== "ADMIN") {
        router.push("/") // Redirect
      }
    }
  }, [])
}
```

### Usage

```typescript
// src/app/(dashboard)/users/admin-page.tsx
export default function UsersPage() {
  return (
    <AdminRoute>
      <StaffRegistration />
    </AdminRoute>
  )
}
```

## Staff Registration Implementation

### Backend: API Route

- **Path**: `/api/admin/create-test-users`
- **Method**: POST
- **Access**: Admin-only (checked server-side)
- **Creates**: Auth user + Profile record together
- **Safety**: Rolls back auth user if profile creation fails

### Frontend: Admin Page

- **Path**: `/dashboard/users`
- **Protected by**: AdminRoute component
- **Features**:
  - Registration form (email, password, role)
  - Staff listing table
  - Delete functionality
  - Success/error alerts

## Database Schema

### profiles table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE')),
  facility_id UUID NULL,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

## Auto-Department Selection (OPD)

When a user accesses the OPD visit page, their department is automatically selected based on their role:

```typescript
// src/app/(dashboard)/(opd)/opd-visit/page.tsx

const roleToDepartment = {
  "DOCTOR": "opd",
  "NURSE": "opd",
  "LAB": "lab",
  "PHARMACY": "pharmacy",
  "RECEPTION": "reception",
  "FINANCE": "finance",
  "ADMIN": "opd"
}

// Auto-selects department on page load based on user's role
```

## Troubleshooting

### Issue: "Access Denied: Only administrators can access this page"

**Solution**: Login as admin first. Create admin account in Supabase:
1. Go to Supabase Dashboard
2. Auth > Users section
3. Set the user's role to ADMIN in profiles table

### Issue: "Email already exists"

**Solution**: The email is already registered. Use a different email or delete the existing user first.

### Issue: "Could not find the table 'public.profiles'"

**Solution**: Run the CREATE TABLE script in Supabase SQL editor to create the profiles table.

## Next Steps

1. ✅ Create admin user
2. ✅ Register test staff using admin page
3. ✅ Test login with different roles
4. ✅ Verify department auto-selection in OPD
5. ⏳ Integrate RBAC in other modules (lab, pharmacy, etc.)
6. ⏳ Add permission checks for specific actions
7. ⏳ Implement audit logging for admin actions

## Files Referenced

- `src/components/AdminRoute.tsx` - Admin authorization wrapper
- `src/app/(dashboard)/users/admin-page.tsx` - Staff management UI
- `src/app/(dashboard)/users/page.tsx` - Users page entry point
- `src/app/api/admin/create-test-users/route.ts` - Test user API
- `src/lib/testUsers.ts` - Test user definitions
- `src/app/(dashboard)/(opd)/opd-visit/page.tsx` - OPD with auto-dept selection
