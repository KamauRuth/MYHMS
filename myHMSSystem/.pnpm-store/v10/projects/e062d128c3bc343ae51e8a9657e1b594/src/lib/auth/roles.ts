export const staffRoles = [
  "ADMIN",
  "DOCTOR",
  "NURSE",
  "LAB",
  "PHARMACY",
  "RECEPTION",
  "FINANCE",
] as const

export type StaffRole = (typeof staffRoles)[number]

export type CurrentStaff = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: StaffRole
  department: string | null
}

export const roleLabels: Record<StaffRole, string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  LAB: "Laboratory",
  PHARMACY: "Pharmacy",
  RECEPTION: "Reception",
  FINANCE: "Finance",
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && staffRoles.includes(value as StaffRole)
}
