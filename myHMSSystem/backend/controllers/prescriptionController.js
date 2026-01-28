const supabase = require("../config/supabase");

// CREATE PRESCRIPTION
exports.createPrescription = async (req, res) => {
  const { data, error } = await supabase
    .from("prescriptions")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// ADD PRESCRIPTION ITEM
exports.addPrescriptionItem = async (req, res) => {
  const { data, error } = await supabase
    .from("prescription_items")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET PRESCRIPTIONS (WITH ITEMS)
exports.getPrescriptions = async (req, res) => {
  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
      *,
      items:prescription_items(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};
