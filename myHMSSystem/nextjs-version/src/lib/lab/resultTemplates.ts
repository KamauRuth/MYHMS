export type LabTemplateParameter = {
  parameter: string
  section?: string
  units?: string
  reference_range?: string
  input_type?: "number" | "text" | "select"
  options?: string[]
  min?: number
  max?: number
  decimals?: number
}

export type ClinicalLabTemplate = {
  name: string
  specimen: string
  parameters: LabTemplateParameter[]
}

const number = (parameter: string, units: string, reference_range: string, min?: number, max?: number, section?: string, decimals?: number): LabTemplateParameter => ({
  parameter, units, reference_range, min, max, section, decimals, input_type: "number",
})
const choice = (parameter: string, options: string[], reference_range = "Negative", section?: string): LabTemplateParameter => ({ parameter, options, reference_range, section, input_type: "select" })

const templates: Array<{ matches: RegExp; template: ClinicalLabTemplate }> = [
  {
    matches: /\b(inr|prothrombin|pt\/?inr)\b/i,
    template: { name: "Coagulation — PT/INR", specimen: "Citrated plasma", parameters: [
      number("Prothrombin Time (PT)", "seconds", "11.0–14.0", 11, 14, "Coagulation", 1),
      number("Control PT", "seconds", "Laboratory control", undefined, undefined, "Coagulation", 1),
      number("INR", "ratio", "0.8–1.2 (non-anticoagulated)", 0.8, 1.2, "Coagulation", 2),
    ] },
  },
  {
    matches: /\b(cbc|fbc|full blood count|complete blood count|hemogram)\b/i,
    template: { name: "Full Blood Count", specimen: "EDTA whole blood", parameters: [
      number("WBC", "×10⁹/L", "4.0–11.0", 4, 11, "White cell profile", 1),
      number("Neutrophils", "%", "40–75", 40, 75, "White cell profile", 1),
      number("Lymphocytes", "%", "20–45", 20, 45, "White cell profile", 1),
      number("Monocytes", "%", "2–10", 2, 10, "White cell profile", 1),
      number("Eosinophils", "%", "1–6", 1, 6, "White cell profile", 1),
      number("Basophils", "%", "0–2", 0, 2, "White cell profile", 1),
      number("RBC", "×10¹²/L", "3.8–5.8", 3.8, 5.8, "Red cell profile", 2),
      number("Haemoglobin", "g/dL", "12.0–17.0", 12, 17, "Red cell profile", 1),
      number("Haematocrit", "%", "36–50", 36, 50, "Red cell profile", 1),
      number("MCV", "fL", "80–100", 80, 100, "Red cell indices", 1),
      number("MCH", "pg", "27–33", 27, 33, "Red cell indices", 1),
      number("MCHC", "g/dL", "32–36", 32, 36, "Red cell indices", 1),
      number("Platelets", "×10⁹/L", "150–400", 150, 400, "Platelets", 0),
    ] },
  },
  {
    matches: /\b(lft|liver function|hepatic panel)\b/i,
    template: { name: "Liver Function Tests", specimen: "Serum", parameters: [
      number("Total Bilirubin", "µmol/L", "3–21", 3, 21, "Bilirubin", 1), number("Direct Bilirubin", "µmol/L", "0–7", 0, 7, "Bilirubin", 1),
      number("ALT", "U/L", "7–56", 7, 56, "Enzymes", 0), number("AST", "U/L", "10–40", 10, 40, "Enzymes", 0),
      number("ALP", "U/L", "44–147", 44, 147, "Enzymes", 0), number("GGT", "U/L", "9–48", 9, 48, "Enzymes", 0),
      number("Total Protein", "g/L", "60–80", 60, 80, "Proteins", 1), number("Albumin", "g/L", "35–50", 35, 50, "Proteins", 1),
    ] },
  },
  {
    matches: /\b(rft|renal function|kidney function|urea.*electrolyte|u\s*&\s*e)\b/i,
    template: { name: "Renal Function & Electrolytes", specimen: "Serum", parameters: [
      number("Urea", "mmol/L", "2.5–7.1", 2.5, 7.1, "Renal markers", 1), number("Creatinine", "µmol/L", "53–106", 53, 106, "Renal markers", 0),
      number("eGFR", "mL/min/1.73m²", "≥60", 60, undefined, "Renal markers", 0), number("Sodium", "mmol/L", "135–145", 135, 145, "Electrolytes", 0),
      number("Potassium", "mmol/L", "3.5–5.1", 3.5, 5.1, "Electrolytes", 1), number("Chloride", "mmol/L", "98–107", 98, 107, "Electrolytes", 0),
    ] },
  },
  {
    matches: /\b(lipid|cholesterol)\b/i,
    template: { name: "Lipid Profile", specimen: "Serum / plasma", parameters: [
      number("Total Cholesterol", "mmol/L", "<5.2", undefined, 5.2, "Lipid profile", 2), number("HDL Cholesterol", "mmol/L", ">1.0", 1, undefined, "Lipid profile", 2),
      number("LDL Cholesterol", "mmol/L", "<3.0", undefined, 3, "Lipid profile", 2), number("Triglycerides", "mmol/L", "<1.7", undefined, 1.7, "Lipid profile", 2),
    ] },
  },
  {
    matches: /\b(hba1c|glycated h(a)?emoglobin)\b/i,
    template: { name: "HbA1c", specimen: "EDTA whole blood", parameters: [number("HbA1c", "%", "4.0–5.6", 4, 5.6, "Glycaemic control", 1), number("Estimated Average Glucose", "mmol/L", "Calculated", undefined, undefined, "Glycaemic control", 1)] },
  },
  {
    matches: /\b(glucose|blood sugar|fbs|rbs)\b/i,
    template: { name: "Blood Glucose", specimen: "Fluoride plasma / serum", parameters: [number("Glucose", "mmol/L", "Fasting: 3.9–5.5", 3.9, 5.5, "Chemistry", 1)] },
  },
  {
    matches: /\b(urinalysis|urine routine|urine analysis)\b/i,
    template: { name: "Routine Urinalysis", specimen: "Fresh urine", parameters: [
      choice("Colour", ["Pale yellow", "Yellow", "Amber", "Red", "Brown", "Other"], "Yellow", "Macroscopy"), choice("Appearance", ["Clear", "Slightly cloudy", "Cloudy", "Turbid"], "Clear", "Macroscopy"),
      number("pH", "", "5.0–8.0", 5, 8, "Chemistry", 1), number("Specific Gravity", "", "1.005–1.030", 1.005, 1.03, "Chemistry", 3),
      choice("Protein", ["Negative", "Trace", "+", "++", "+++", "++++"], "Negative", "Chemistry"), choice("Glucose", ["Negative", "Trace", "+", "++", "+++", "++++"], "Negative", "Chemistry"),
      choice("Ketones", ["Negative", "Trace", "+", "++", "+++"], "Negative", "Chemistry"), choice("Blood", ["Negative", "Trace", "+", "++", "+++"], "Negative", "Chemistry"),
      number("WBC / Pus cells", "/HPF", "0–5", 0, 5, "Microscopy", 0), number("RBC", "/HPF", "0–2", 0, 2, "Microscopy", 0),
      choice("Bacteria", ["None", "Few", "Moderate", "Many"], "None", "Microscopy"),
    ] },
  },
  {
    matches: /\b(malaria|mps|blood film)\b/i,
    template: { name: "Malaria Parasite Examination", specimen: "EDTA blood", parameters: [choice("Malaria Parasites", ["Not seen", "Seen"], "Not seen", "Microscopy"), { parameter: "Species", section: "Microscopy", input_type: "select", options: ["Not applicable", "P. falciparum", "P. malariae", "P. ovale", "P. vivax", "Mixed infection"], reference_range: "Not applicable" }, number("Parasite Density", "parasites/µL", "Not detected", undefined, undefined, "Microscopy", 0)] },
  },
  {
    matches: /\b(hiv|hepatitis|hbsag|vdrl|rpr|pregnancy|hcg)\b/i,
    template: { name: "Serology / Rapid Test", specimen: "Serum / plasma", parameters: [choice("Result", ["Non-reactive", "Reactive", "Indeterminate"], "Non-reactive", "Serology")] },
  },
]

export function getClinicalTemplate(testName?: string | null): ClinicalLabTemplate | null {
  if (!testName) return null
  return templates.find((entry) => entry.matches.test(testName))?.template || null
}

export type LabResultStatus = "normal" | "low" | "high" | "abnormal"

export function calculateResultStatus(
  parameter: Pick<LabTemplateParameter, "input_type" | "min" | "max"> & { reference_range?: string | null },
  rawValue: string
): LabResultStatus {
  const value = rawValue.trim()
  if (!value) return "normal"
  if (parameter.input_type === "number") {
    const numeric = Number(value)
    if (Number.isNaN(numeric)) return "normal"
    if (parameter.min !== undefined && numeric < parameter.min) return "low"
    if (parameter.max !== undefined && numeric > parameter.max) return "high"
    return "normal"
  }
  if (parameter.input_type === "select") {
    const normal = (parameter.reference_range || "").toLowerCase()
    return normal !== "" && value.toLowerCase() !== normal ? "abnormal" : "normal"
  }
  return "normal"
}

export function calculateAbnormal(parameter: LabTemplateParameter, rawValue: string): boolean {
  return calculateResultStatus(parameter, rawValue) !== "normal"
}
