const supabase = require("../config/supabase");

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate invoice number
const generateInvoiceNumber = async () => {
  const { data: config } = await supabase
    .from("billing_config")
    .select("config_value")
    .eq("config_key", "auto_inv_prefix")
    .single();

  const { data: counter } = await supabase
    .from("billing_config")
    .select("config_value")
    .eq("config_key", "auto_inv_start_number")
    .single();

  const prefix = config?.config_value || "LPH-INV";
  const nextNumber = counter?.config_value || "1000";
  
  return `${prefix}-${nextNumber}`;
};

// Update invoice total (auto-calculated by trigger)
const recalculateInvoiceTotal = async (invoiceId) => {
  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .select("total_price")
    .eq("invoice_id", invoiceId);

  if (itemsError) return null;

  const total = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  
  const { data: updated, error: updateError } = await supabase
    .from("invoices")
    .update({ total_amount: total, balance: total })
    .eq("id", invoiceId)
    .select()
    .single();

  return updated;
};

// ============================================
// INVOICE MANAGEMENT
// ============================================

// CREATE INVOICE
exports.createInvoice = async (req, res) => {
  try {
    const { patient_id, visit_id, department, notes } = req.body;
    
    const invoice_number = await generateInvoiceNumber();
    
    const { data, error } = await supabase
      .from("invoices")
      .insert([{
        patient_id,
        invoice_number,
        visit_id,
        total_amount: 0,
        status: "unpaid",
        balance: 0,
        paid_amount: 0
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      message: "Invoice created successfully"
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ADD INVOICE ITEM
exports.addInvoiceItem = async (req, res) => {
  try {
    const { 
      invoice_id, 
      item_type, 
      item_id, 
      description, 
      quantity = 1, 
      unit_price, 
      total_price 
    } = req.body;

    const { data, error } = await supabase
      .from("invoice_items")
      .insert([{
        invoice_id,
        item_type, // 'opd_consultation', 'lab_test', 'ipd_bed', etc.
        item_id,
        description,
        quantity,
        unit_price,
        total_price: total_price || (unit_price * quantity)
      }])
      .select()
      .single();

    if (error) throw error;

    // Recalculate invoice total
    await recalculateInvoiceTotal(invoice_id);

    res.status(201).json({
      success: true,
      data,
      message: "Invoice item added successfully"
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET INVOICES WITH ITEMS
exports.getInvoices = async (req, res) => {
  try {
    const { patient_id, status } = req.query;

    let query = supabase
      .from("invoices")
      .select(`
        *,
        items:invoice_items(*),
        patient:patients(id, first_name, last_name, phone, email)
      `)
      .order("created_at", { ascending: false });

    if (patient_id) {
      query = query.eq("patient_id", patient_id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET SINGLE INVOICE
exports.getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        items:invoice_items(*),
        patient:patients(*)
      `)
      .eq("id", invoiceId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ============================================
// DEPARTMENT-SPECIFIC BILLING
// ============================================

// GENERATE OPD INVOICE
exports.generateOPDInvoice = async (req, res) => {
  try {
    const { visit_id, consultation_fee } = req.body;

    // Get visit details
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .select("patient_id")
      .eq("id", visit_id)
      .single();

    if (visitError) throw visitError;

    // Create invoice
    const invoice_number = await generateInvoiceNumber();
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([{
        patient_id: visit.patient_id,
        invoice_number,
        visit_id,
        total_amount: consultation_fee,
        balance: consultation_fee,
        status: "unpaid"
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice item
    const { error: itemError } = await supabase
      .from("invoice_items")
      .insert([{
        invoice_id: invoice.id,
        item_type: "opd_consultation",
        item_id: visit_id,
        description: "OPD Consultation",
        quantity: 1,
        unit_price: consultation_fee,
        total_price: consultation_fee
      }]);

    if (itemError) throw itemError;

    // Update visit with invoice reference
    await supabase
      .from("visits")
      .update({ 
        invoice_id: invoice.id, 
        billed: true,
        billing_date: new Date().toISOString()
      })
      .eq("id", visit_id);

    res.status(201).json({
      success: true,
      data: invoice,
      message: "OPD invoice generated successfully"
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GENERATE LAB INVOICE
exports.generateLabInvoice = async (req, res) => {
  try {
    const { lab_id, tests } = req.body; // tests: { test_id: price, ... }

    // Get lab details
    const { data: lab, error: labError } = await supabase
      .from("labs")
      .select("patient_id")
      .eq("id", lab_id)
      .single();

    if (labError) throw labError;

    // Calculate total
    const totalCost = Object.values(tests).reduce((sum, price) => sum + price, 0);

    // Create invoice
    const invoice_number = await generateInvoiceNumber();
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([{
        patient_id: lab.patient_id,
        invoice_number,
        total_amount: totalCost,
        balance: totalCost,
        status: "unpaid"
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice items for each test
    Object.entries(tests).forEach(async ([testId, testPrice]) => {
      await supabase
        .from("invoice_items")
        .insert([{
          invoice_id: invoice.id,
          item_type: "lab_test",
          item_id: testId,
          description: `Lab Test`,
          quantity: 1,
          unit_price: testPrice,
          total_price: testPrice
        }]);
    });

    // Update lab with invoice reference
    await supabase
      .from("labs")
      .update({ 
        invoice_id: invoice.id, 
        total_cost: totalCost,
        billed: true,
        billing_date: new Date().toISOString()
      })
      .eq("id", lab_id);

    res.status(201).json({
      success: true,
      data: invoice,
      message: "Lab invoice generated successfully"
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GENERATE ADMISSION INVOICE
exports.generateAdmissionInvoice = async (req, res) => {
  try {
    const { admission_id, bed_charge_daily, duration_days } = req.body;

    // Get admission details
    const { data: admission, error: admissionError } = await supabase
      .from("admissions")
      .select("patient_id")
      .eq("id", admission_id)
      .single();

    if (admissionError) throw admissionError;

    const totalCost = bed_charge_daily * duration_days;

    // Create invoice
    const invoice_number = await generateInvoiceNumber();
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([{
        patient_id: admission.patient_id,
        invoice_number,
        total_amount: totalCost,
        balance: totalCost,
        status: "unpaid"
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice item
    await supabase
      .from("invoice_items")
      .insert([{
        invoice_id: invoice.id,
        item_type: "ipd_bed",
        item_id: admission_id,
        description: `IPD Bed Charge - ${duration_days} days`,
        quantity: duration_days,
        unit_price: bed_charge_daily,
        total_price: totalCost
      }]);

    // Update admission with invoice reference
    await supabase
      .from("admissions")
      .update({ 
        invoice_id: invoice.id, 
        total_admission_cost: totalCost,
        bed_charge_daily,
        billed: true,
        billing_date: new Date().toISOString()
      })
      .eq("id", admission_id);

    res.status(201).json({
      success: true,
      data: invoice,
      message: "Admission invoice generated successfully"
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GENERATE MATERNITY INVOICE
exports.generateMaternityInvoice = async (req, res) => {
  try {
    const { maternity_id, services, total_cost } = req.body; // services: { service_id: price, ... }

    // Get maternity details
    const { data: maternity, error: maternityError } = await supabase
      .from("maternity")
      .select("patient_id")
      .eq("id", maternity_id)
      .single();

    if (maternityError) throw maternityError;

    // Create invoice
    const invoice_number = await generateInvoiceNumber();
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([{
        patient_id: maternity.patient_id,
        invoice_number,
        total_amount: total_cost,
        balance: total_cost,
        status: "unpaid"
      }])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice items for each service
    Object.entries(services).forEach(async ([serviceId, servicePrice]) => {
      await supabase
        .from("invoice_items")
        .insert([{
          invoice_id: invoice.id,
          item_type: "maternity_service",
          item_id: serviceId,
          description: "Maternity Service",
          quantity: 1,
          unit_price: servicePrice,
          total_price: servicePrice
        }]);
    });

    // Update maternity with invoice reference
    await supabase
      .from("maternity")
      .update({ 
        invoice_id: invoice.id, 
        total_maternity_cost: total_cost,
        billed: true,
        billing_date: new Date().toISOString()
      })
      .eq("id", maternity_id);

    res.status(201).json({
      success: true,
      data: invoice,
      message: "Maternity invoice generated successfully"
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// RECORD PAYMENT
exports.recordPayment = async (req, res) => {
  try {
    const { invoice_id, amount_paid, payment_method } = req.body;

    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (invoiceError) throw invoiceError;

    const newPaidAmount = (invoice.paid_amount || 0) + amount_paid;
    const newBalance = invoice.total_amount - newPaidAmount;
    const newStatus = newBalance <= 0 ? "paid" : newPaidAmount > 0 ? "partially_paid" : "unpaid";

    const { data: updated, error: updateError } = await supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        balance: newBalance,
        status: newStatus
      })
      .eq("id", invoice_id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: updated,
      message: "Payment recorded successfully"
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET BILLING SUMMARY
exports.getBillingSummary = async (req, res) => {
  try {
    const { patient_id, date_from, date_to } = req.query;

    let query = supabase
      .from("invoices")
      .select("*", { count: "exact" });

    if (patient_id) {
      query = query.eq("patient_id", patient_id);
    }

    if (date_from && date_to) {
      query = query
        .gte("created_at", date_from)
        .lte("created_at", date_to);
    }

    const { data, count, error } = await query;

    if (error) throw error;

    const summary = {
      total_invoices: count,
      total_revenue: data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      total_paid: data.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0),
      total_outstanding: data.reduce((sum, inv) => sum + (inv.balance || 0), 0),
      invoices_by_status: {
        unpaid: data.filter(inv => inv.status === "unpaid").length,
        partially_paid: data.filter(inv => inv.status === "partially_paid").length,
        paid: data.filter(inv => inv.status === "paid").length
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
