const supabase = require("../config/supabase");

// CREATE INVOICE
exports.createInvoice = async (req, res) => {
  const { data, error } = await supabase
    .from("invoices")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// ADD INVOICE ITEM
exports.addInvoiceItem = async (req, res) => {
  const { data, error } = await supabase
    .from("invoice_items")
    .insert([req.body])
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
};

// GET INVOICES WITH ITEMS
exports.getInvoices = async (req, res) => {
  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      items:invoice_items(*),
      patient:patients(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
};
