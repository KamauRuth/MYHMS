import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      visit_id,
      patient_id,
      bed_id,
      reason,
      ward,
      bed_no,
    } = body;

    // Validate required fields
    if (!visit_id || !patient_id || !bed_id) {
      return NextResponse.json(
        { error: 'Missing required fields: visit_id, patient_id, bed_id' },
        { status: 400 }
      );
    }

    // Validate UUIDs
    if (!isValidUUID(visit_id)) {
      return NextResponse.json(
        { error: `Invalid visit_id format. Expected UUID, got: "${visit_id}"` },
        { status: 400 }
      );
    }

    if (!isValidUUID(patient_id)) {
      return NextResponse.json(
        { error: `Invalid patient_id format. Expected UUID, got: "${patient_id}"` },
        { status: 400 }
      );
    }

    if (!isValidUUID(bed_id)) {
      return NextResponse.json(
        { error: `Invalid bed_id format. Expected UUID, got: "${bed_id}"` },
        { status: 400 }
      );
    }

    // Create admission
    const { data, error } = await supabase
      .from('admissions')
      .insert({
        visit_id,
        patient_id,
        bed_id,
        reason,
        ward,
        bed_no,
        status: 'ADMITTED',
        admitted_at: new Date().toISOString(),
      })
      .select('*, beds(*), wards(*)')
      .single();

    if (error) throw error;

    // Update bed status to OCCUPIED
    const { error: bedError } = await supabase
      .from('beds')
      .update({ status: 'OCCUPIED' })
      .eq('id', bed_id);

    if (bedError) throw bedError;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating admission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create admission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const wardId = searchParams.get('wardId');
    const patientId = searchParams.get('patientId');

    let query = supabase
      .from('admissions')
      .select('*, beds(*), wards(*)')
      .order('admitted_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (patientId) query = query.eq('patient_id', patientId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching admissions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch admissions' },
      { status: 500 }
    );
  }
}
