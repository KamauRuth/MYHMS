// IPD Module Utilities

export function formatDate(date: string | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: string | null): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getDaysInAdmission(admitted_at: string, discharged_at: string | null = null): number {
  const start = new Date(admitted_at)
  const end = discharged_at ? new Date(discharged_at) : new Date()
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getHoursInAdmission(admitted_at: string, discharged_at: string | null = null): number {
  const start = new Date(admitted_at)
  const end = discharged_at ? new Date(discharged_at) : new Date()
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
  return diffHours
}

// Priority/severity colors
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'bg-blue-100 text-blue-800'
    case 'NORMAL':
      return 'bg-green-100 text-green-800'
    case 'HIGH':
      return 'bg-yellow-100 text-yellow-800'
    case 'URGENT':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ADMITTED':
    case 'ACTIVE':
    case 'IN_PROGRESS':
    case 'COMPLETED':
    case 'GOOD':
    case 'IMPROVED':
      return 'bg-green-100 text-green-800'
    case 'DISCHARGED':
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    case 'SUSPENDED':
    case 'SCHEDULED':
    case 'FAIR':
      return 'bg-yellow-100 text-yellow-800'
    case 'DISCONTINUED':
    case 'CANCELLED':
    case 'POOR':
    case 'EXPIRED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'ELECTIVE':
      return 'bg-green-100 text-green-800'
    case 'URGENT':
      return 'bg-yellow-100 text-yellow-800'
    case 'EMERGENCY':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getDischargeTypeColor(type: string): string {
  switch (type) {
    case 'RECOVERED':
    case 'IMPROVED':
      return 'bg-green-100 text-green-800'
    case 'REFERRED':
      return 'bg-blue-100 text-blue-800'
    case 'ABSCONDED':
      return 'bg-orange-100 text-orange-800'
    case 'EXPIRED':
      return 'bg-red-100 text-red-800'
    case 'DISCHARGED_AGAINST_ADVICE':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getDischargeConditionColor(condition: string): string {
  switch (condition) {
    case 'GOOD':
      return 'bg-green-100 text-green-800'
    case 'FAIR':
      return 'bg-yellow-100 text-yellow-800'
    case 'POOR':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Note type colors
export function getNoteTypeColor(noteType: string): string {
  switch (noteType) {
    case 'NURSING':
      return 'bg-blue-100 text-blue-800'
    case 'CLINICAL':
      return 'bg-purple-100 text-purple-800'
    case 'DOCTOR':
      return 'bg-green-100 text-green-800'
    case 'OBSERVATION':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Procedure status
export function getProcedureStatusColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800'
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    case 'POSTPONED':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Medication route display
export function getMedicationRouteLabel(route: string): string {
  const routes: { [key: string]: string } = {
    ORAL: 'Oral (PO)',
    INTRAVENOUS: 'Intravenous (IV)',
    INTRAMUSCULAR: 'Intramuscular (IM)',
    SUBCUTANEOUS: 'Subcutaneous (SC)',
    TOPICAL: 'Topical',
    INHALED: 'Inhaled',
    RECTAL: 'Rectal (PR)',
    SUBLINGUAL: 'Sublingual (SL)',
  }
  return routes[route] || route
}

// Frequency display
export function getFrequencyLabel(frequency: string): string {
  const frequencies: { [key: string]: string } = {
    OD: 'Once daily',
    BD: 'Twice daily',
    TID: 'Three times daily',
    QID: 'Four times daily',
    Q4H: 'Every 4 hours',
    Q6H: 'Every 6 hours',
    Q8H: 'Every 8 hours',
    Q12H: 'Every 12 hours',
    PRN: 'As needed',
  }
  return frequencies[frequency] || frequency
}

// Vitals normal ranges
export const VITAL_RANGES = {
  temperature: { min: 36.1, max: 37.2, unit: '°C' },
  pulse: { min: 60, max: 100, unit: 'bpm' },
  systolic_bp: { min: 100, max: 140, unit: 'mmHg' },
  diastolic_bp: { min: 60, max: 90, unit: 'mmHg' },
  spo2: { min: 95, max: 100, unit: '%' },
  respiratory_rate: { min: 12, max: 20, unit: 'breaths/min' },
}

export function isVitalAbnormal(type: string, value: number): boolean {
  const range = VITAL_RANGES[type as keyof typeof VITAL_RANGES]
  if (!range) return false
  return value < range.min || value > range.max
}

export function getVitalStatusColor(type: string, value: number | null): string {
  if (value === null) return 'text-gray-500'
  if (isVitalAbnormal(type, value)) return 'text-red-600 font-semibold'
  return 'text-green-600'
}
