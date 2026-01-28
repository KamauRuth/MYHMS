const supabase = require("../config/supabase");

// ADD VITALS (NURSE ACTION)
exports.createVital = async (req, res) => {
  const { data, error } = await supabase
    .from("vitals")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET VITALS FOR ADMISSION
exports.getVitalsByAdmission = async (req, res) => {
  const { admissionId } = req.params;

  const { data, error } = await supabase
    .from("vitals")
    .select("*")
    .eq("admission_id", admissionId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};
