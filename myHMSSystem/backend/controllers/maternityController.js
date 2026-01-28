const supabase = require("../config/supabase");

// CREATE MATERNITY CASE
exports.createMaternityCase = async (req, res) => {
  const { data, error } = await supabase
    .from("maternity_cases")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// ADD DELIVERY RECORD
exports.addDeliveryRecord = async (req, res) => {
  const { data, error } = await supabase
    .from("delivery_records")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET MATERNITY CASES
exports.getMaternityCases = async (req, res) => {
  const { data, error } = await supabase
    .from("maternity_cases")
    .select(`
      *,
      patient:patients(*),
      deliveries:delivery_records(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};
