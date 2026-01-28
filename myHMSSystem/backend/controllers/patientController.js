const supabase = require("../config/supabase");

// CREATE PATIENT
exports.createPatient = async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET ALL PATIENTS
exports.getPatients = async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};
