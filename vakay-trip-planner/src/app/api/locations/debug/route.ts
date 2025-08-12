import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ 
        error: 'Query parameter "q" is required' 
      }, { status: 400 });
    }

    const cleanQuery = query.trim().toLowerCase();

    // Debug: Show all results that contain the query anywhere in both name and name_normalized fields
    const debugResults = await supabase
      .from('popular_destinations')
      .select('place_id, name, name_normalized, display_name, category, type, country, region, city, lat, lon, importance, place_rank, boundingbox')
      .or(`name.ilike.%${cleanQuery}%,name_normalized.ilike.%${cleanQuery}%`)
      .order('importance', { ascending: false })
      .limit(20);

    if (debugResults.error) {
      return NextResponse.json({ 
        error: 'Failed to query database',
        details: debugResults.error
      }, { status: 500 });
    }

    // Show what's being matched
    const matchedResults = debugResults.data?.map(item => ({
      name: item.name,
      name_normalized: item.name_normalized,
      display_name: item.display_name,
      category: item.category,
      type: item.type,
      importance: item.importance,
      place_rank: item.place_rank,
      // Show where the match occurred in both fields
      nameMatch: item.name.toLowerCase().includes(cleanQuery),
      nameNormalizedMatch: item.name_normalized.toLowerCase().includes(cleanQuery),
      matchPosition: item.name.toLowerCase().indexOf(cleanQuery)
    })) || [];

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      totalResults: matchedResults.length,
      results: matchedResults,
      explanation: `Showing all destinations where the NAME or NAME_NORMALIZED contains "${cleanQuery}"`
    });

  } catch (error) {
    console.error('Debug search error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
