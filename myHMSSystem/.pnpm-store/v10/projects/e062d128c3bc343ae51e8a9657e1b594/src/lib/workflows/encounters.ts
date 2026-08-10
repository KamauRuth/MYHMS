export const VISIT_STATUS = {
  TRIAGE: "TRIAGE",
  WAITING_DOCTOR: "WAITING_DOCTOR",
  WAITING_DENTIST: "WAITING_DENTIST",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_LAB_RESULTS: "WAITING_LAB_RESULTS",
  COMPLETED: "COMPLETED",
} as const

export const PAYMENT_STATUS = {
  PAID: "paid",
  UNPAID: "unpaid",
} as const

export const TRIAGE_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
} as const
