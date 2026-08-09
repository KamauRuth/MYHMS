import { redirect } from "next/navigation"

import { requireStaff } from "@/lib/auth/server"
import type { StaffRole } from "@/lib/auth/roles"

const roleHome: Record<StaffRole, string> = {
  ADMIN: "/dashboard",
  FINANCE: "/billing-dashboard",
  LAB: "/lab",
  PHARMACY: "/pharmacy-dashboard",
  RECEPTION: "/register-patient",
  DOCTOR: "/opd-queue",
  NURSE: "/triage-queue",
}

export default async function RoleHomePage() {
  const staff = await requireStaff()
  redirect(roleHome[staff.role])
}
