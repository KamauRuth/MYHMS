import { createClient } from '@/lib/supabase/client';

export interface InvoiceItem {
  item_type: 'opd_consultation' | 'lab_test' | 'ipd_bed' | 'maternity_service' | 'pharmacy_drug' | 'theatre_procedure';
  item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface CreateInvoiceRequest {
  patient_id: string;
  visit_id?: string;
  items: InvoiceItem[];
  additional_notes?: string;
}

export interface PaymentRecord {
  invoice_id: string;
  amount_paid: number;
  payment_method: 'cash' | 'card' | 'mpesa' | 'insurance' | 'cheque';
  reference_number?: string;
  notes?: string;
}

// Generate invoice number with prefix
async function generateInvoiceNumber(): Promise<string> {
  const supabase = createClient();

  try {
    // Get config values
    const { data: prefixConfig } = await supabase
      .from('billing_config')
      .select('config_value')
      .eq('config_key', 'auto_inv_prefix')
      .single();

    const { data: counterConfig } = await supabase
      .from('billing_config')
      .select('config_value')
      .eq('config_key', 'auto_inv_start_number')
      .single();

    const prefix = prefixConfig?.config_value || 'LPH-INV';
    const baseNumber = parseInt(counterConfig?.config_value || '1000');

    // Get the count of existing invoices to auto-increment
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const invoiceNumber = `${prefix}-${String(baseNumber + (count || 0)).padStart(4, '0')}`;
    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return `LPH-INV-${Date.now()}`;
  }
}

// Create a new invoice
export async function createInvoice(request: CreateInvoiceRequest) {
  const supabase = createClient();

  try {
    const invoiceNumber = await generateInvoiceNumber();
    const totalAmount = request.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([
        {
          patient_id: request.patient_id,
          invoice_number: invoiceNumber,
          visit_id: request.visit_id || null,
          total_amount: totalAmount,
          balance: totalAmount,
          paid_amount: 0,
          status: 'unpaid'
        }
      ])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Add invoice items
    const invoiceItems = request.items.map(item => ({
      invoice_id: invoice.id,
      item_type: item.item_type,
      item_id: item.item_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) throw itemsError;

    return {
      success: true,
      invoice: invoice,
      message: 'Invoice created successfully'
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice'
    };
  }
}

// Generate OPD visit invoice
export async function generateOPDInvoice(visitId: string, consultationFee: number) {
  const supabase = createClient();

  try {
    // Get visit details
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('patient_id, visit_type')
      .eq('id', visitId)
      .single();

    if (visitError) throw visitError;

    const result = await createInvoice({
      patient_id: visit.patient_id,
      visit_id: visitId,
      items: [
        {
          item_type: 'opd_consultation',
          item_id: visitId,
          description: `OPD Consultation - ${visit.visit_type || 'General'}`,
          quantity: 1,
          unit_price: consultationFee
        }
      ]
    });

    if (result.success) {
      // Update visit with invoice reference
      await supabase
        .from('visits')
        .update({
          invoice_id: result.invoice?.id,
          consultation_fee: consultationFee,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', visitId);
    }

    return result;
  } catch (error) {
    console.error('Error generating OPD invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate OPD invoice'
    };
  }
}

// Generate lab test invoice
export async function generateLabInvoice(labId: string, tests: { testId: string; testName: string; price: number }[]) {
  const supabase = createClient();

  try {
    // Get lab details
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('patient_id')
      .eq('id', labId)
      .single();

    if (labError) throw labError;

    const items: InvoiceItem[] = tests.map(test => ({
      item_type: 'lab_test',
      item_id: test.testId,
      description: `Lab Test - ${test.testName}`,
      quantity: 1,
      unit_price: test.price
    }));

    const result = await createInvoice({
      patient_id: lab.patient_id,
      items: items
    });

    if (result.success) {
      const totalCost = items.reduce((sum, item) => sum + item.unit_price, 0);

      // Update lab with invoice reference
      await supabase
        .from('labs')
        .update({
          invoice_id: result.invoice?.id,
          total_cost: totalCost,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', labId);
    }

    return result;
  } catch (error) {
    console.error('Error generating lab invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate lab invoice'
    };
  }
}

// Generate admission (IPD) invoice
export async function generateAdmissionInvoice(
  admissionId: string,
  bedChargDaily: number,
  durationDays: number,
  additionalCharges: { description: string; amount: number }[] = []
) {
  const supabase = createClient();

  try {
    // Get admission details
    const { data: admission, error: admissionError } = await supabase
      .from('inpatient_admissions')
      .select('patient_id, admission_number')
      .eq('id', admissionId)
      .single();

    if (admissionError) throw admissionError;

    const items: InvoiceItem[] = [
      {
        item_type: 'ipd_bed',
        item_id: admissionId,
        description: `IPD Bed Charge - ${durationDays} days`,
        quantity: durationDays,
        unit_price: bedChargDaily
      }
    ];

    // Add additional charges if any
    additionalCharges.forEach((charge, index) => {
      items.push({
        item_type: 'ipd_bed',
        item_id: `${admissionId}-extra-${index}`,
        description: charge.description,
        quantity: 1,
        unit_price: charge.amount
      });
    });

    const result = await createInvoice({
      patient_id: admission.patient_id,
      items: items,
      additional_notes: `Admission: ${admission.admission_number}`
    });

    if (result.success) {
      const totalCost = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

      // Update admission with invoice reference
      await supabase
        .from('inpatient_admissions')
        .update({
          invoice_id: result.invoice?.id,
          total_admission_cost: totalCost,
          bed_charge_daily: bedChargDaily,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', admissionId);
    }

    return result;
  } catch (error) {
    console.error('Error generating admission invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate admission invoice'
    };
  }
}

// Generate maternity invoice
export async function generateMaternityInvoice(
  maternityId: string,
  services: { serviceId: string; serviceName: string; price: number }[]
) {
  const supabase = createClient();

  try {
    // Get maternity details
    const { data: maternity, error: maternityError } = await supabase
      .from('maternity')
      .select('patient_id')
      .eq('id', maternityId)
      .single();

    if (maternityError) throw maternityError;

    const items: InvoiceItem[] = services.map(service => ({
      item_type: 'maternity_service',
      item_id: service.serviceId,
      description: `Maternity - ${service.serviceName}`,
      quantity: 1,
      unit_price: service.price
    }));

    const result = await createInvoice({
      patient_id: maternity.patient_id,
      items: items
    });

    if (result.success) {
      const totalCost = items.reduce((sum, item) => sum + item.unit_price, 0);

      // Update maternity with invoice reference
      await supabase
        .from('maternity')
        .update({
          invoice_id: result.invoice?.id,
          total_maternity_cost: totalCost,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', maternityId);
    }

    return result;
  } catch (error) {
    console.error('Error generating maternity invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate maternity invoice'
    };
  }
}

// Record payment for an invoice
export async function recordPayment(payment: PaymentRecord) {
  const supabase = createClient();

  try {
    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', payment.invoice_id)
      .single();

    if (invoiceError) throw invoiceError;

    const newPaidAmount = (invoice.paid_amount || 0) + payment.amount_paid;
    const newBalance = invoice.total_amount - newPaidAmount;
    const newStatus = 
      newBalance <= 0 ? 'paid' : 
      newPaidAmount > 0 ? 'partially_paid' : 
      'unpaid';

    // Update invoice
    const { data: updated, error: updateError } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        balance: Math.max(0, newBalance),
        status: newStatus
      })
      .eq('id', payment.invoice_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      success: true,
      invoice: updated,
      message: 'Payment recorded successfully'
    };
  } catch (error) {
    console.error('Error recording payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record payment'
    };
  }
}

// Get invoice with all details
export async function getInvoiceDetails(invoiceId: string) {
  const supabase = createClient();

  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        patient:patients(id, first_name, last_name, phone, email, date_of_birth)
      `)
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    return {
      success: true,
      invoice: invoice
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoice'
    };
  }
}

// Get patient invoices
export async function getPatientInvoices(patientId: string, status?: string) {
  const supabase = createClient();

  try {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      invoices: data || []
    };
  } catch (error) {
    console.error('Error fetching patient invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invoices',
      invoices: []
    };
  }
}

// Get billing summary
export async function getBillingSummary(dateFrom?: string, dateTo?: string) {
  const supabase = createClient();

  try {
    let query = supabase.from('invoices').select('*');

    if (dateFrom && dateTo) {
      query = query
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const summary = {
      total_invoices: count || 0,
      total_revenue: data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
      total_paid: data?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0,
      total_outstanding: data?.reduce((sum, inv) => sum + (inv.balance || 0), 0) || 0,
      invoices_by_status: {
        unpaid: data?.filter(inv => inv.status === 'unpaid').length || 0,
        partially_paid: data?.filter(inv => inv.status === 'partially_paid').length || 0,
        paid: data?.filter(inv => inv.status === 'paid').length || 0
      }
    };

    return {
      success: true,
      summary: summary
    };
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch summary'
    };
  }
}

// Get revenue by department (for analytics)
export async function getRevenueByDepartment(dateFrom?: string, dateTo?: string) {
  const supabase = createClient();

  try {
    let query = supabase
      .from('invoice_items')
      .select('item_type, total_price');

    if (dateFrom && dateTo) {
      query = query
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by item type (department)
    const revenue: Record<string, number> = {};
    data?.forEach(item => {
      const type = item.item_type;
      revenue[type] = (revenue[type] || 0) + (item.total_price || 0);
    });

    return {
      success: true,
      revenue: revenue
    };
  } catch (error) {
    console.error('Error fetching revenue by department:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch revenue'
    };
  }
}
