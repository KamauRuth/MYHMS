export function classifyTemperature(t) {
  if (t < 35) return "LOW"
  if (t > 37.5) return "HIGH"
  return "NORMAL"
}

export function classifyPulse(p) {
  if (p < 60) return "LOW"
  if (p > 100) return "HIGH"
  return "NORMAL"
}

export function classifyBP(sys, dia) {
  if (sys < 90 || dia < 60) return "LOW"
  if (sys > 120 || dia > 80) return "HIGH"
  return "NORMAL"
}

export function classifySpO2(o) {
  if (o < 90) return "HIGH"
  if (o < 95) return "LOW"
  return "NORMAL"
}

export function deriveSeverity(levels) {
  if (levels.includes("HIGH")) return "HIGH"
  if (levels.includes("NORMAL")) return "NORMAL"
  return "LOW"
}
