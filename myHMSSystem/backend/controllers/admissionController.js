const supabase = require("../config/supabase");

// ADMIT PATIENT
exports.createAdmission = async (req, res) => {
  const { data, error } = await supabase
    .from("admissions")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET ACTIVE ADMISSIONS
exports.getActiveAdmissions = async (req, res) => {
  const { data, error } = await supabase
    .from("admissions")
    .select(`
      *,
      patient:patients(*),
      visit:visits(*)
    `)
    .eq("status", "ADMITTED")
    .order("admitted_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};

// DISCHARGE PATIENT
exports.dischargePatient = async (req, res) => {
  const { admissionId } = req.params;
  const { discharge_summary } = req.body;

  const { data, error } = await supabase
    .from("admissions")
    .update({
      status: "DISCHARGED",
      discharged_at: new Date().toISOString(),
      discharge_summary
    })
    .eq("id", admissionId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.json(data);
};