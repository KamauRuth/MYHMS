const supabase = require("../config/supabase");

exports.createLab = async (req, res) => {
  const { data, error } = await supabase
    .from("labs")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

exports.getLabs = async (req, res) => {
  const { data, error } = await supabase
    .from("labs")
    .select(`
      *,
      results:lab_results(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};

exports.createLabResult = async (req, res) => {
  const { data, error } = await supabase
    .from("lab_results")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};
