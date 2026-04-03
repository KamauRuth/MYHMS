const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.error('Make sure .env.local has:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test users to create
const testUsers = [
  { email: 'admin@hospital.com', password: 'Admin@123456', role: 'ADMIN', name: 'System Administrator' },
  { email: 'doctor1@hospital.com', password: 'Doctor@123456', role: 'DOCTOR', name: 'James Smith' },
  { email: 'doctor2@hospital.com', password: 'Doctor@123456', role: 'DOCTOR', name: 'Sarah Johnson' },
  { email: 'nurse1@hospital.com', password: 'Nurse@123456', role: 'NURSE', name: 'Emily Brown' },
  { email: 'nurse2@hospital.com', password: 'Nurse@123456', role: 'NURSE', name: 'Michael Davis' },
  { email: 'lab@hospital.com', password: 'Lab@123456', role: 'LAB', name: 'Lab Technician' },
  { email: 'pharmacy@hospital.com', password: 'Pharmacy@123456', role: 'PHARMACY', name: 'Henry Kiplagat' },
  { email: 'reception@hospital.com', password: 'Reception@123456', role: 'RECEPTION', name: 'Grace Kariuki' },
  { email: 'finance@hospital.com', password: 'Finance@123456', role: 'FINANCE', name: 'David Mwangi' },
];

async function createTestUsers() {
  console.log('\n🏥 Starting Test User Setup\n');
  console.log(`📊 Users to create: ${testUsers.length}`);
  console.log('━'.repeat(60));

  let successCount = 0;
  let failureCount = 0;
  const createdUsers = [];

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const stepNum = i + 1;

    console.log(`\n[Step ${stepNum}/${testUsers.length}] Creating ${user.role}: ${user.email}`);

    try {
      // Step 1: Create auth user
      console.log(`  ✓ Creating auth user...`);
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) throw new Error(`Auth creation failed: ${authError.message}`);

      const userId = authUser.user.id;
      console.log(`  ✓ Auth user created (ID: ${userId.substring(0, 8)}...)`);

      // Step 2: Create profile record
      console.log(`  ✓ Creating profile record...`);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            role: user.role,
            facility_id: null,
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        // Rollback: Delete the auth user
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log(`  ✓ Profile created with role: ${user.role}`);

      // Step 3: Create staff record
      console.log(`  ✓ Creating staff record...`);
      const { error: staffError } = await supabase
        .from('staff')
        .insert([
          {
            id: crypto.randomUUID?.() || require('crypto').randomUUID(),
            staff_id: `${user.role.substring(0, 3).toUpperCase()}${String(successCount + 1).padStart(3, '0')}`,
            first_name: user.name.split(' ')[0],
            last_name: user.name.split(' ').slice(1).join(' '),
            email: user.email,
            phone: `+254700000${String(stepNum).padStart(3, '0')}`,
            role: user.role,
            specialty: null,
            department: getDepartment(user.role),
            is_active: true,
            user_id: userId,
            created_at: new Date().toISOString(),
          },
        ]);

      if (staffError) {
        console.warn(`  ⚠ Staff record creation skipped: ${staffError.message}`);
      } else {
        console.log(`  ✓ Staff record created`);
      }

      createdUsers.push({
        email: user.email,
        password: user.password,
        role: user.role,
      });

      successCount++;
      console.log(`  ✅ ${user.email} setup complete`);
    } catch (error) {
      failureCount++;
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('\n📋 Setup Summary:\n');
  console.log(`  ✅ Successful: ${successCount}/${testUsers.length}`);
  console.log(`  ❌ Failed: ${failureCount}/${testUsers.length}`);

  if (successCount > 0) {
    console.log('\n🔑 Login Credentials:\n');
    console.log('┌─────────────────────────┬──────────────────┬────────────┐');
    console.log('│ Email                   │ Password         │ Role       │');
    console.log('├─────────────────────────┼──────────────────┼────────────┤');

    createdUsers.forEach((user) => {
      const emailPad = user.email.padEnd(23);
      const passPad = user.password.padEnd(16);
      const rolePad = user.role.padEnd(10);
      console.log(`│ ${emailPad} │ ${passPad} │ ${rolePad} │`);
    });

    console.log('└─────────────────────────┴──────────────────┴────────────┘');
  }

  // Verification
  console.log('\n🔍 Verifying in Database...\n');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, role')
    .in('role', ['ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE']);

  if (!profilesError) {
    console.log(`  ✓ Profiles found in database: ${profiles?.length || 0}`);
  }

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, email, role')
    .in('role', ['ADMIN', 'DOCTOR', 'NURSE', 'LAB', 'PHARMACY', 'RECEPTION', 'FINANCE']);

  if (!staffError) {
    console.log(`  ✓ Staff records found in database: ${staff?.length || 0}`);
  }

  console.log('\n✨ Test user setup complete!\n');

  if (successCount === testUsers.length) {
    console.log('👉 Next Steps:');
    console.log('  1. Login at http://localhost:3000/sign-in with any test user');
    console.log('  2. Verify profile dropdown shows correct role');
    console.log('  3. Test role-based access (admins can visit /dashboard/users)');
    console.log('  4. Verify auto-department selection in OPD visit form\n');
  } else {
    console.log('⚠️  Some users failed to create. Check errors above.\n');
  }
}

function getDepartment(role) {
  const deptMap = {
    DOCTOR: 'OPD',
    NURSE: 'OPD',
    LAB: 'Laboratory',
    PHARMACY: 'Pharmacy',
    RECEPTION: 'Reception',
    FINANCE: 'Finance',
    ADMIN: 'Administration',
  };
  return deptMap[role] || 'Other';
}

// Run the setup
createTestUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
