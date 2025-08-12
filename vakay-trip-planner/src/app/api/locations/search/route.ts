import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters long' 
      }, { status: 400 });
    }

    // Build the query with full-text search
    let supabaseQuery = supabase
      .from('popular_destinations')
      .select('*')
      .or(`name.ilike.%${query}%,display_name.ilike.%${query}%`)
      .order('importance', { ascending: false })
      .limit(limit);

    // Add category filter if provided
    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    // Add type filter if provided
    if (type) {
      supabaseQuery = supabaseQuery.eq('type', type);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: 'Failed to search destinations' 
      }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedData = data?.map(destination => ({
      place_id: destination.place_id,
      name: destination.name,
      display_name: destination.display_name,
      category: destination.category,
      type: destination.type,
      country: destination.country,
      region: destination.region,
      city: destination.city,
      lat: destination.lat,
      lon: destination.lon,
      importance: destination.importance,
      place_rank: destination.place_rank,
      boundingbox: destination.boundingbox
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });

  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST endpoint for bulk insert (for your external pipeline)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destinations } = body;

    if (!Array.isArray(destinations)) {
      return NextResponse.json({ 
        error: 'Destinations must be an array' 
      }, { status: 400 });
    }

    // Transform the data to match our schema
    const transformedDestinations = destinations.map((dest: any) => ({
      place_id: dest.place_id,
      name: dest.name,
      display_name: dest.display_name,
      category: dest.category,
      type: dest.type,
      country: dest.country || null,
      region: dest.region || null,
      city: dest.city || null,
      lat: parseFloat(dest.lat),
      lon: parseFloat(dest.lon),
      importance: parseFloat(dest.importance),
      place_rank: parseInt(dest.place_rank),
      boundingbox: dest.boundingbox || null
    }));

    const { data, error } = await supabase
      .from('popular_destinations')
      .upsert(transformedDestinations, { 
        onConflict: 'place_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ 
        error: 'Failed to upsert destinations' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${data?.length || 0} destinations`,
      data: data
    });

  } catch (error) {
    console.error('Bulk insert error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
