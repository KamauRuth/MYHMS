import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get total stats
    const [{ data: admissions }, { data: beds }, { data: wards }] = await Promise.all([
      supabase.from('admissions').select('status').eq('status', 'ADMITTED'),
      supabase.from('beds').select('status'),
      supabase.from('wards').select('id'),
    ]);

    const totalBeds = beds?.length || 0;
    const occupiedBeds = beds?.filter((b) => b.status === 'OCCUPIED').length || 0;
    const availableBeds = totalBeds - occupiedBeds;

    return NextResponse.json({
      success: true,
      data: {
        total_active_admissions: admissions?.length || 0,
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        available_beds: availableBeds,
        occupancy_rate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
        total_wards: wards?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching IPD stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
