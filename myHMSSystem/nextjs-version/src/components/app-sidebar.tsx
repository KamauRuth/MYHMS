"use client"

import {
  Activity,
  Baby,
  BedDouble,
  CalendarDays,
  ClipboardPlus,
  CreditCard,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  Pill,
  Scissors,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserRoundPlus,
  Users,
} from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/logo"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { CurrentStaff, StaffRole } from "@/lib/auth/roles"

type NavigationItem = {
  title: string
  url: string
  icon?: typeof LayoutDashboard
  roles?: readonly StaffRole[]
  items?: { title: string; url: string; roles?: readonly StaffRole[] }[]
}

type NavigationGroup = { label: string; items: NavigationItem[] }

const navigation: NavigationGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Hospital dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
      { title: "Payments dashboard", url: "/billing-dashboard", icon: CreditCard, roles: ["FINANCE"] },
      { title: "Laboratory dashboard", url: "/lab", icon: FlaskConical, roles: ["LAB"] },
      { title: "Pharmacy dashboard", url: "/pharmacy-dashboard", icon: Pill, roles: ["PHARMACY"] },
      { title: "Registration", url: "/register-patient", icon: UserRoundPlus, roles: ["RECEPTION"] },
      { title: "OPD queue", url: "/opd-queue", icon: Stethoscope, roles: ["DOCTOR"] },
      { title: "Triage queue", url: "/triage-queue", icon: Activity, roles: ["NURSE"] },
      { title: "Calendar", url: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Patient care",
    items: [
      {
        title: "Reception",
        url: "#",
        icon: UserRoundPlus,
        items: [
          { title: "Registration", url: "/register-patient" },
          { title: "Patient register", url: "/view-patients" },
        ],
        roles: ["ADMIN", "RECEPTION"],
      },
      {
        title: "Triage",
        url: "#",
        icon: Activity,
        items: [
          { title: "Triage queue", url: "/triage-queue" },
          { title: "Record vitals", url: "/triage-form" },
        ],
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
      {
        title: "Outpatient (OPD)",
        url: "#",
        icon: Stethoscope,
        items: [
          { title: "OPD queue", url: "/opd-queue" },
          { title: "Consultation", url: "/opd-visit" },
          { title: "Admit patient", url: "/admit" },
        ],
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
      {
        title: "Inpatient (IPD)",
        url: "#",
        icon: BedDouble,
        items: [
          { title: "IPD overview", url: "/ipd" },
          { title: "Inpatient list", url: "/ipd/admissions" },
          { title: "Record vitals", url: "/ipd/vitals" },
          { title: "Medication & MAR", url: "/ipd/medications" },
          { title: "Clinical procedures", url: "/ipd/procedures" },
          { title: "Discharge patients", url: "/ipd/discharge" },
        ],
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
    ],
  },
  {
    label: "Clinical services",
    items: [
      {
        title: "Maternity",
        url: "#",
        icon: Baby,
        items: [
          { title: "Maternity queue", url: "/maternity-queue" },
          { title: "New maternity case", url: "/maternity-new" },
          { title: "Record delivery", url: "/delivery-record" },
        ],
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
      {
        title: "ANC & postnatal",
        url: "#",
        icon: HeartPulse,
        items: [
          { title: "ANC queue", url: "/anc-queue" },
          { title: "New ANC visit", url: "/anc-new" },
          { title: "Postnatal queue", url: "/postnatal-queue" },
          { title: "New postnatal visit", url: "/postnatal-new" },
        ],
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
      {
        title: "Laboratory",
        url: "#",
        icon: FlaskConical,
        items: [
          { title: "Lab overview", url: "/lab" },
          { title: "Paid requests", url: "/lab/lab-queue" },
          { title: "Validate results", url: "/lab/validation" },
          { title: "Release results", url: "/lab/delivery" },
          { title: "Critical alerts", url: "/lab/alerts" },
          { title: "Test catalogue", url: "/lab/lab-master" },
        ],
        roles: ["ADMIN", "LAB"],
      },
      {
        title: "Pharmacy",
        url: "#",
        icon: Pill,
        items: [
          { title: "Pharmacy dashboard", url: "/pharmacy-dashboard" },
          { title: "Prescriptions", url: "/prescriptions" },
          { title: "Dispensing", url: "/dispensing" },
          { title: "Stock management", url: "/stock-management" },
          { title: "Stock levels", url: "/stock-levels" },
          { title: "Stock received", url: "/stock-in" },
          { title: "Expiry alerts", url: "/expiry-alerts" },
          { title: "Suppliers", url: "/suppliers" },
        ],
        roles: ["ADMIN", "DOCTOR", "PHARMACY"],
      },
      {
        title: "Theatre",
        url: "#",
        icon: Scissors,
        items: [
          { title: "Theatre dashboard", url: "/theatre" },
          { title: "Surgery booking", url: "/theatre/surgery-booking" },
          { title: "Safety checklist", url: "/theatre/safety-checklist" },
          { title: "Recovery room", url: "/theatre/recovery" },
          { title: "Consumables", url: "/theatre/consumables" },
          { title: "Theatre billing", url: "/theatre/billing" },
        ],
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
      {
        title: "Dental",
        url: "#",
        icon: ClipboardPlus,
        items: [{ title: "Dental queue", url: "/dental-queue" }],
        roles: ["ADMIN", "DOCTOR", "NURSE"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Billing",
        url: "#",
        icon: CreditCard,
        items: [
          { title: "Payments dashboard", url: "/billing-dashboard" },
          { title: "Unpaid accounts", url: "/unpaid-patients" },
          { title: "Paid accounts", url: "/paid-patients" },
        ],
        roles: ["ADMIN", "FINANCE", "RECEPTION"],
      },
      {
        title: "Administration",
        url: "#",
        icon: ShieldCheck,
        items: [
          { title: "Admin dashboard", url: "/admin" },
          { title: "User management", url: "/admin/create-users" },
          { title: "Dental procedures", url: "/admin/dental-procedures" },
        ],
        roles: ["ADMIN"],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        items: [
          { title: "My account", url: "/settings/account" },
          { title: "Appearance", url: "/settings/appearance" },
          { title: "Notifications", url: "/settings/notifications" },
        ],
      },
    ],
  },
]

function visibleNavigation(role: StaffRole) {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.roles || item.roles.includes(role))
        .map((item) => ({
          ...item,
          items: item.items?.filter((subItem) => !subItem.roles || subItem.roles.includes(role)),
        }))
        .filter((item) => !item.items || item.items.length > 0),
    }))
    .filter((group) => group.items.length > 0)
}

export function AppSidebar({
  staff,
  ...props
}: React.ComponentProps<typeof Sidebar> & { staff: CurrentStaff }) {
  const groups = visibleNavigation(staff.role)

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/home">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LifePoint Hospital</span>
                  <span className="truncate text-xs text-muted-foreground">Care at every point</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser staff={staff} />
      </SidebarFooter>
    </Sidebar>
  )
}
