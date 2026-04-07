# Lab Requests Status Constraint Fix - Complete Guide

## Problem
Getting error: `new row for relation "lab_requests" violates check constraint "lab_requests_status_check"`
- Status being inserted: `PENDING` (uppercase)
- Allowed values: `'pending'`, `'in_progress'`, `'completed'`, `'cancelled'` (ALL lowercase)

## Root Cause
Multiple places in the codebase were using uppercase `"PENDING"` instead of lowercase `"pending"` when creating lab requests.

## Solution Steps

### Step 1: Run Database Cleanup Script
Execute this SQL in your Supabase database:

```sql
-- Copy the content from:
-- sql/comprehensive-fix-lab-requests.sql
```

This script will:
- ✅ Drop any malformed check constraints
- ✅ Convert ALL existing data to lowercase
- ✅ Recreate the constraint properly with ONLY lowercase values
- ✅ Verify the fix

### Step 2: Code Fixes Applied
The following files have been updated:

#### ✅ `/frontend/src/pages/OPD/OPDVisit.jsx`
- **Line 286**: Changed `status: "PENDING"` → `status: "pending"`

#### ✅ `/nextjs-version/src/app/(dashboard)/(opd)/opd-visit/page.tsx`
- **Line 515**: Added explicit `status: "pending"` to insert

#### ✅ `/nextjs-version/src/app/(dashboard)/lab/lab-requests/page.tsx`
- **Line 113**: Already has correct `status: "pending"`

### Step 3: Verify the Fix
After running the SQL script, test by:

1. **In NextJS lab-requests page:**
   ```
   Go to: /dashboard/lab/lab-requests
   Click "+ New Request"
   Create a new lab test request
   Should succeed with no constraint errors ✅
   ```

2. **In OPD visit page:**
   ```
   Create an OPD visit
   Add lab tests
   Click "Send to Lab"
   Should succeed with no constraint errors ✅
   ```

## Files Created/Updated

### New Files:
- `sql/comprehensive-fix-lab-requests.sql` - Complete database fix script

### Modified Files:
- `frontend/src/pages/OPD/OPDVisit.jsx` - Fixed uppercase PENDING
- `nextjs-version/src/app/(dashboard)/(opd)/opd-visit/page.tsx` - Added explicit status

### Existing Fix Files:
- `sql/fix-lab-requests-status.sql` - Run this if comprehensive fix doesn't work
- `sql/fix-lab-requests-uppercase-status.sql` - Alternative fix for data cleanup

## Database Constraint Details

**Current (Correct) Definition:**
```sql
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
```

**Before Fix (Likely):**
```sql
CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
-- OR custom constraint allowing both cases
```

## Quick Test

After applying all fixes, run this query in Supabase to verify:

```sql
-- Should show only these values
SELECT DISTINCT status FROM public.lab_requests;
-- Result should be: pending, in_progress, completed, cancelled
-- (All lowercase)

-- Check constraint definition
SELECT constraint_definition 
FROM information_schema.check_constraints 
WHERE table_name = 'lab_requests' AND constraint_name = 'lab_requests_status_check';
-- Should show: CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
```

## Prevention
- ✅ Always use lowercase for status values in TypeScript/JavaScript code
- ✅ Database defaults to lowercase `'pending'`
- ✅ Constraint enforces lowercase at database level

## Support
If you still get constraint errors:
1. Verify the SQL script was run completely (all 8 steps)
2. Check no other code is inserting with uppercase
3. Review `git log` to see if any migrations override this
4. Run the comprehensive fix script again
