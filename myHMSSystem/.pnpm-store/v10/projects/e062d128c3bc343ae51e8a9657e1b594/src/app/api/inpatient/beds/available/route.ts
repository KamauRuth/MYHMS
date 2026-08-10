import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId');

    let query = supabase
      .from('beds')
      .select('*, wards(*)')
      .eq('status', 'AVAILABLE');

    if (wardId) {
      query = query.eq('ward_id', wardId);
    }

    const { data, error } = await query.order('bed_number');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching available beds:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch available beds' },
      { status: 500 }
    );
  }
}
