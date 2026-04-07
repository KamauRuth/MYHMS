'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Create invoice server action
export async function createInvoiceAction(
  patientId: string,
  items: Array<{
    item_type: string;
    item_id: string;
    description: string;
    quantity: number;
    unit_price: number;
  }>,
  visitId?: string
) {
  const supabase = await createClient();

  try {
    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const invoiceNumber = `LPH-INV-${String((count || 0) + 1000).padStart(4, '0')}`;
    const totalAmount = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([
        {
          patient_id: patientId,
          invoice_number: invoiceNumber,
          visit_id: visitId || null,
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
    const invoiceItems = items.map(item => ({
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

    revalidatePath('/billing');
    return { success: true, invoice };
  } catch (error) {
    console.error('Error creating invoice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create invoice' 
    };
  }
}

// Record payment server action
export async function recordPaymentAction(
  invoiceId: string,
  amountPaid: number,
  paymentMethod: string,
  referenceNumber?: string
) {
  const supabase = await createClient();

  try {
    // Get current invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const newPaidAmount = (invoice.paid_amount || 0) + amountPaid;
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
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log payment transaction
    const { error: logError } = await supabase
      .from('payment_transactions')
      .insert([
        {
          invoice_id: invoiceId,
          amount: amountPaid,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          payment_date: new Date().toISOString()
        }
      ]);

    // Log error but don't fail the payment
    if (logError) console.error('Error logging transaction:', logError);

    revalidatePath('/billing');
    return { success: true, invoice: updated };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to record payment' 
    };
  }
}

// Generate billing for OPD visit
export async function generateBillingForOPDAction(
  visitId: string,
  consultationFee: number
) {
  const supabase = await createClient();

  try {
    // Get visit details
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .select('patient_id, id')
      .eq('id', visitId)
      .single();

    if (visitError) throw visitError;

    // Create invoice
    const result = await createInvoiceAction(
      visit.patient_id,
      [
        {
          item_type: 'opd_consultation',
          item_id: visitId,
          description: 'OPD Consultation',
          quantity: 1,
          unit_price: consultationFee
        }
      ],
      visitId
    );

    if (result.success) {
      // Update visit with billing info
      await supabase
        .from('visits')
        .update({
          invoice_id: result.invoice?.id,
          consultation_fee: consultationFee,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', visitId);

      revalidatePath(`/dashboard/opd-visit/${visitId}`);
    }

    return result;
  } catch (error) {
    console.error('Error generating OPD billing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate billing' 
    };
  }
}

// Generate billing for lab tests
export async function generateBillingForLabAction(
  labId: string,
  tests: Array<{ testId: string; testName: string; price: number }>
) {
  const supabase = await createClient();

  try {
    // Get lab details
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .select('patient_id')
      .eq('id', labId)
      .single();

    if (labError) throw labError;

    const items = tests.map(test => ({
      item_type: 'lab_test',
      item_id: test.testId,
      description: `Lab Test - ${test.testName}`,
      quantity: 1,
      unit_price: test.price
    }));

    const result = await createInvoiceAction(lab.patient_id, items);

    if (result.success) {
      const totalCost = tests.reduce((sum, test) => sum + test.price, 0);

      // Update lab with billing info
      await supabase
        .from('labs')
        .update({
          invoice_id: result.invoice?.id,
          total_cost: totalCost,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', labId);

      revalidatePath('/dashboard/lab');
    }

    return result;
  } catch (error) {
    console.error('Error generating lab billing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate billing' 
    };
  }
}

// Generate billing for IPD admission
export async function generateBillingForAdmissionAction(
  admissionId: string,
  bedChargeDaily: number,
  durationDays: number
) {
  const supabase = await createClient();

  try {
    // Get admission details
    const { data: admission, error: admissionError } = await supabase
      .from('inpatient_admissions')
      .select('patient_id, admission_number')
      .eq('id', admissionId)
      .single();

    if (admissionError) throw admissionError;

    const result = await createInvoiceAction(
      admission.patient_id,
      [
        {
          item_type: 'ipd_bed',
          item_id: admissionId,
          description: `IPD Bed Charge - ${durationDays} days`,
          quantity: durationDays,
          unit_price: bedChargeDaily
        }
      ]
    );

    if (result.success) {
      const totalCost = bedChargeDaily * durationDays;

      // Update admission with billing info
      await supabase
        .from('inpatient_admissions')
        .update({
          invoice_id: result.invoice?.id,
          total_admission_cost: totalCost,
          bed_charge_daily: bedChargeDaily,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', admissionId);

      revalidatePath('/dashboard/inpatient');
    }

    return result;
  } catch (error) {
    console.error('Error generating admission billing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate billing' 
    };
  }
}

// Generate billing for maternity
export async function generateBillingForMaternityAction(
  maternityId: string,
  services: Array<{ serviceId: string; serviceName: string; price: number }>
) {
  const supabase = await createClient();

  try {
    // Get maternity details
    const { data: maternity, error: maternityError } = await supabase
      .from('maternity')
      .select('patient_id')
      .eq('id', maternityId)
      .single();

    if (maternityError) throw maternityError;

    const items = services.map(service => ({
      item_type: 'maternity_service',
      item_id: service.serviceId,
      description: `Maternity - ${service.serviceName}`,
      quantity: 1,
      unit_price: service.price
    }));

    const result = await createInvoiceAction(maternity.patient_id, items);

    if (result.success) {
      const totalCost = services.reduce((sum, service) => sum + service.price, 0);

      // Update maternity with billing info
      await supabase
        .from('maternity')
        .update({
          invoice_id: result.invoice?.id,
          total_maternity_cost: totalCost,
          billed: true,
          billing_date: new Date().toISOString()
        })
        .eq('id', maternityId);

      revalidatePath('/dashboard/maternity');
    }

    return result;
  } catch (error) {
    console.error('Error generating maternity billing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate billing' 
    };
  }
}

// Get patient billing summary
export async function getPatientBillingAction(patientId: string) {
  const supabase = await createClient();

  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const summary = {
      total_invoices: invoices?.length || 0,
      total_amount: invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
      total_paid: invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0,
      balance: invoices?.reduce((sum, inv) => sum + (inv.balance || 0), 0) || 0
    };

    return { 
      success: true, 
      invoices: invoices || [],
      summary 
    };
  } catch (error) {
    console.error('Error fetching patient billing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch billing',
      invoices: [],
      summary: { total_invoices: 0, total_amount: 0, total_paid: 0, balance: 0 }
    };
  }
}

// Generate billing for dental procedures
export async function generateBillingForDentalAction(
  dentalVisitId: string,
  procedurePrice: number,
  procedureName: string
) {
  const supabase = await createClient();

  try {
    // Get dental visit details with patient info
    const { data: dentalVisit, error: visitError } = await supabase
      .from('dental_visits')
      .select('patient_id, visit_id')
      .eq('id', dentalVisitId)
      .single();

    if (visitError) {
      console.warn('Could not fetch dental visit details:', visitError);
      // If dental visit doesn't have patient_id, try to get from regular visits
    }

    // If dental_visit doesn't have patient_id, get from regular visits
    let patientId = dentalVisit?.patient_id;
    let visitId = dentalVisit?.visit_id;

    if (!patientId && visitId) {
      const { data: regularVisit } = await supabase
        .from('visits')
        .select('patient_id')
        .eq('id', visitId)
        .single();
      
      patientId = regularVisit?.patient_id;
    }

    if (!patientId) {
      console.error('No patient ID found for dental visit');
      return { success: false, error: 'Patient not found' };
    }

    // Check if an invoice already exists for this visit
    let { data: existingInvoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('visit_id', visitId || dentalVisitId)
      .maybeSingle();

    let invoice;

    if (existingInvoice) {
      // Add item to existing invoice
      await supabase
        .from('invoice_items')
        .insert([
          {
            invoice_id: existingInvoice.id,
            item_type: 'dental_procedure',
            item_id: dentalVisitId,
            description: `Dental: ${procedureName}`,
            quantity: 1,
            unit_price: procedurePrice,
            total_price: procedurePrice
          }
        ]);

      // Update invoice total
      const { data: items } = await supabase
        .from('invoice_items')
        .select('total_price')
        .eq('invoice_id', existingInvoice.id);

      const newTotal = (items || []).reduce((sum, item) => sum + (item.total_price || 0), 0);

      const { data: updated } = await supabase
        .from('invoices')
        .update({
          total_amount: newTotal,
          balance: newTotal
        })
        .eq('id', existingInvoice.id)
        .select()
        .single();

      invoice = updated;
    } else {
      // Create new invoice
      const result = await createInvoiceAction(
        patientId,
        [
          {
            item_type: 'dental_procedure',
            item_id: dentalVisitId,
            description: `Dental: ${procedureName}`,
            quantity: 1,
            unit_price: procedurePrice
          }
        ],
        visitId || dentalVisitId
      );

      if (!result.success) return result;
      invoice = result.invoice;
    }

    revalidatePath('/dashboard/billing/unpaid-patients');
    revalidatePath(`/dashboard/dental`);

    return { success: true, invoice };
  } catch (error) {
    console.error('Error generating dental billing:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate billing' 
    };
  }
}
