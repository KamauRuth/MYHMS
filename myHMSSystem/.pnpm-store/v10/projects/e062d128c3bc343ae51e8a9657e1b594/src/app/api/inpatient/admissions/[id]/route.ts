import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('admissions')
      .select('*, beds(*), wards(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { error: 'Admission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching admission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch admission' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('admissions')
      .update(body)
      .eq('id', id)
      .select('*, beds(*), wards(*)')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating admission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update admission' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get admission to get bed_id
    const { data: admission, error: getError } = await supabase
      .from('admissions')
      .select('bed_id')
      .eq('id', id)
      .single();

    if (getError) throw getError;

    // Free up the bed
    if (admission?.bed_id) {
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'AVAILABLE' })
        .eq('id', admission.bed_id);

      if (bedError) throw bedError;
    }

    // Delete admission
    const { error: deleteError } = await supabase
      .from('admissions')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Admission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admission:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete admission' },
      { status: 500 }
    );
  }
}
