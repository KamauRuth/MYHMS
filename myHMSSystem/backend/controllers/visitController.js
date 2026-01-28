const supabase = require("../config/supabase");

// CREATE VISIT
exports.createVisit = async (req, res) => {
  const { data, error } = await supabase
    .from("visits")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET VISITS WITH PATIENT
exports.getVisits = async (req, res) => {
  const { data, error } = await supabase
    .from("visits")
    .select(`
      *,
      patient:patients(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};
