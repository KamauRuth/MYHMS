const supabase = require("../config/supabase");

// CREATE CONSULTATION
exports.createConsultation = async (req, res) => {
  const { data, error } = await supabase
    .from("consultations")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET CONSULTATIONS FOR VISIT
exports.getConsultationsByVisit = async (req, res) => {
  const { visitId } = req.params;

  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("visit_id", visitId)
    .order("created_at");

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};
