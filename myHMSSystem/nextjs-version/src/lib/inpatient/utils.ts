// Date formatting utilities
export function formatDate(date: string | Date): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Occupancy rate formatting
export function getOccupancyColor(rate: number): string {
  if (rate < 50) return 'text-green-600';
  if (rate < 80) return 'text-yellow-600';
  return 'text-red-600';
}

export function getOccupancyBgColor(rate: number): string {
  if (rate < 50) return 'bg-green-100';
  if (rate < 80) return 'bg-yellow-100';
  return 'bg-red-100';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ADMITTED':
      return 'bg-blue-100 text-blue-800';
    case 'DISCHARGED':
      return 'bg-green-100 text-green-800';
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800';
    case 'OCCUPIED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Generate admission number
export function generateAdmissionNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `ADM-${timestamp}`;
}

// Truncate text
export function truncateText(text: string, maxLength: number = 50): string {
  if (!text) return '-';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Days in admission
export function getDaysInAdmission(admittedAt: string): number {
  const admitted = new Date(admittedAt);
  const today = new Date();
  const timeDiff = today.getTime() - admitted.getTime();
  return Math.floor(timeDiff / (1000 * 3600 * 24));
}

// Hours in admission
export function getHoursInAdmission(admittedAt: string): number {
  const admitted = new Date(admittedAt);
  const today = new Date();
  const timeDiff = today.getTime() - admitted.getTime();
  return Math.floor(timeDiff / (1000 * 3600));
}
