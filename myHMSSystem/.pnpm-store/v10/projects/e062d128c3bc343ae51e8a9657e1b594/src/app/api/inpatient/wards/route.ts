import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const wardId = searchParams.get('wardId');

    let query = supabase
      .from('wards')
      .select('*')
      .order('name');

    const { data, error } = await query;

    if (error) throw error;

    // Calculate stats for each ward
    const wardsWithStats = await Promise.all(
      data.map(async (ward) => {
        const { data: beds } = await supabase
          .from('beds')
          .select('status')
          .eq('ward_id', ward.id);

        const totalBeds = beds?.length || 0;
        const occupiedBeds = beds?.filter((b) => b.status === 'OCCUPIED').length || 0;
        const availableBeds = totalBeds - occupiedBeds;

        return {
          ...ward,
          totalBeds,
          occupiedBeds,
          availableBeds,
          occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: wardsWithStats,
    });
  } catch (error) {
    console.error('Error fetching wards:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch wards' },
      { status: 500 }
    );
  }
}
