const supabase = require("../config/supabase");

// CREATE TRIAGE RECORD
exports.createTriage = async (req, res) => {
  const { data, error } = await supabase
    .from("triage")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET PENDING TRIAGE (TRIAGE DESK)
exports.getPendingTriage = async (req, res) => {
  const { data, error } = await supabase
    .from("triage")
    .select(`
      *,
      patient:patients(*)
    `)
    .eq("status", "PENDING")
    .order("created_at");

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};

// ROUTE TRIAGE (SEND TO OPD / MATERNITY / IPD)
exports.routeTriage = async (req, res) => {
  const { triageId } = req.params;
  const { visit_id } = req.body;

  const { data, error } = await supabase
    .from("triage")
    .update({
      visit_id,
      status: "ROUTED"
    })
    .eq("id", triageId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.json(data);
};
