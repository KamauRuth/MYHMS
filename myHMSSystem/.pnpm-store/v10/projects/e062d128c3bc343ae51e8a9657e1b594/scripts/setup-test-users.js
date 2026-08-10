const { createClient } = require("@supabase/supabase-js")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  { email: "admin@hospital.com", password: "Admin@123456", role: "ADMIN", firstName: "System", lastName: "Administrator", department: "Administration", staffId: "ADM001", phone: "+254700000001" },
  { email: "doctor1@hospital.com", password: "Doctor@123456", role: "DOCTOR", firstName: "James", lastName: "Smith", department: "OPD", staffId: "DOC001", phone: "+254700000002", specialty: "General Medicine" },
  { email: "doctor2@hospital.com", password: "Doctor@123456", role: "DOCTOR", firstName: "Sarah", lastName: "Johnson", department: "OPD", staffId: "DOC002", phone: "+254700000003", specialty: "Pediatrics" },
  { email: "nurse1@hospital.com", password: "Nurse@123456", role: "NURSE", firstName: "Emily", lastName: "Brown", department: "Nursing", staffId: "NUR001", phone: "+254700000004" },
  { email: "nurse2@hospital.com", password: "Nurse@123456", role: "NURSE", firstName: "Michael", lastName: "Davis", department: "Nursing", staffId: "NUR002", phone: "+254700000005" },
  { email: "lab@hospital.com", password: "Lab@123456", role: "LAB", firstName: "Mary", lastName: "Wanjiku", department: "Laboratory", staffId: "LAB001", phone: "+254700000006" },
  { email: "pharmacy@hospital.com", password: "Pharmacy@123456", role: "PHARMACY", firstName: "Henry", lastName: "Kiplagat", department: "Pharmacy", staffId: "PHM001", phone: "+254700000007" },
  { email: "reception@hospital.com", password: "Reception@123456", role: "RECEPTION", firstName: "Grace", lastName: "Kariuki", department: "Reception", staffId: "RCP001", phone: "+254700000008" },
  { email: "finance@hospital.com", password: "Finance@123456", role: "FINANCE", firstName: "David", lastName: "Mwangi", department: "Finance", staffId: "FIN001", phone: "+254700000009" },
]

async function findAuthUser(email) {
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (match) return match
    if (data.users.length < 1000) return null
    page += 1
  }
}

async function ensureUser(definition) {
  let authUser = await findAuthUser(definition.email)
  let action = "updated"

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: definition.email,
      password: definition.password,
      email_confirm: true,
      user_metadata: {
        role: definition.role,
        first_name: definition.firstName,
        last_name: definition.lastName,
        full_name: `${definition.firstName} ${definition.lastName}`,
        name: `${definition.firstName} ${definition.lastName}`,
      },
    })
    if (error || !data.user) throw error || new Error("Auth user was not created")
    authUser = data.user
    action = "created"
  } else {
    const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: definition.password,
      email_confirm: true,
      user_metadata: {
        ...authUser.user_metadata,
        role: definition.role,
        first_name: definition.firstName,
        last_name: definition.lastName,
        full_name: `${definition.firstName} ${definition.lastName}`,
        name: `${definition.firstName} ${definition.lastName}`,
      },
    })
    if (error) throw error
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    { id: authUser.id, role: definition.role, created_at: new Date().toISOString() },
    { onConflict: "id" }
  )
  if (profileError) throw new Error(`Profile: ${profileError.message}`)

  const staffRecord = {
    staff_id: definition.staffId,
    first_name: definition.firstName,
    last_name: definition.lastName,
    email: definition.email,
    phone: definition.phone,
    role: definition.role,
    specialty: definition.specialty || null,
    department: definition.department,
    is_active: true,
    user_id: authUser.id,
  }

  const { data: existingStaff, error: lookupError } = await supabase
    .from("staff")
    .select("id")
    .eq("email", definition.email)
    .maybeSingle()
  if (lookupError) throw new Error(`Staff lookup: ${lookupError.message}`)

  const staffQuery = existingStaff
    ? supabase.from("staff").update(staffRecord).eq("id", existingStaff.id)
    : supabase.from("staff").insert({ id: crypto.randomUUID(), ...staffRecord })
  const { error: staffError } = await staffQuery
  if (staffError) throw new Error(`Staff: ${staffError.message}`)

  return action
}

async function main() {
  console.log(`Provisioning ${users.length} LifePoint staff accounts...`)
  let failures = 0

  for (const user of users) {
    try {
      const action = await ensureUser(user)
      console.log(`OK ${user.email} | ${user.role} | ${action}`)
    } catch (error) {
      failures += 1
      console.error(`FAILED ${user.email} | ${error.message}`)
    }
  }

  const emails = users.map((user) => user.email)
  const { data: staff, error } = await supabase
    .from("staff")
    .select("email,role,staff_id,department,is_active")
    .in("email", emails)
    .order("staff_id")

  if (error) throw error
  console.log(`Verified ${staff.length}/${users.length} staff records`)
  for (const record of staff) {
    console.log(`VERIFIED ${record.staff_id} | ${record.email} | ${record.role} | active=${record.is_active}`)
  }

  if (failures > 0 || staff.length !== users.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
