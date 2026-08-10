import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { discharge_summary } = body;

    // Get admission to free up bed
    const { data: admission, error: getError } = await supabase
      .from('admissions')
      .select('bed_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    // Update bed status
    if (admission?.bed_id) {
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'AVAILABLE' })
        .eq('id', admission.bed_id);

      if (bedError) throw bedError;
    }

    // Discharge admission
    const { data, error } = await supabase
      .from('admissions')
      .update({
        status: 'DISCHARGED',
        discharged_at: new Date().toISOString(),
        discharge_summary: discharge_summary || null,
      })
      .eq('id', id)
      .select('*, beds(*), wards(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Patient discharged successfully',
    });
  } catch (error) {
    console.error('Error discharging admission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to discharge admission' },
      { status: 500 }
    );
  }
}
