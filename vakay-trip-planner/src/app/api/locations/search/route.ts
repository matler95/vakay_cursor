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

    const cleanQuery = query.trim().toLowerCase();

    // Build queries for the three priority levels with bidirectional search
    let exactMatchQuery = supabase
      .from('popular_destinations')
      .select('place_id, name, name_normalized, display_name, category, type, country, region, city, lat, lon, importance, place_rank, boundingbox')
      .or(`name.ilike.${cleanQuery},name_normalized.ilike.${cleanQuery}`) // Exact match in both fields
      .order('name', { ascending: true }) // Alphabetical within exact matches
      .limit(limit);

    let startsWithQuery = supabase
      .from('popular_destinations')
      .select('place_id, name, name_normalized, display_name, category, type, country, region, city, lat, lon, importance, place_rank, boundingbox')
      .or(`name.ilike.${cleanQuery}%,name_normalized.ilike.${cleanQuery}%`) // Starts with in both fields
      .order('name', { ascending: true }) // Alphabetical within starts-with matches
      .limit(limit);

    let containsQuery = supabase
      .from('popular_destinations')
      .select('place_id, name, name_normalized, display_name, category, type, country, region, city, lat, lon, importance, place_rank, boundingbox')
      .or(`name.ilike.%${cleanQuery}%,name_normalized.ilike.%${cleanQuery}%`) // Contains anywhere in both fields
      .order('name', { ascending: true }) // Alphabetical within contains matches
      .limit(limit);

    // Add category filter if provided
    if (category) {
      exactMatchQuery = exactMatchQuery.eq('category', category);
      startsWithQuery = startsWithQuery.eq('category', category);
      containsQuery = containsQuery.eq('category', category);
    }

    // Add type filter if provided
    if (type) {
      exactMatchQuery = exactMatchQuery.eq('type', type);
      startsWithQuery = startsWithQuery.eq('type', type);
      containsQuery = containsQuery.eq('type', type);
    }

    // Execute queries in order of priority
    const [exactMatchResults, startsWithResults, containsResults] = await Promise.all([
      exactMatchQuery,
      startsWithQuery,
      containsQuery
    ]);

    if (exactMatchResults.error || startsWithResults.error || containsResults.error) {
      console.error('Supabase error:', { exactMatch: exactMatchResults.error, startsWith: startsWithResults.error, contains: containsResults.error });
      return NextResponse.json({ 
        error: 'Failed to search destinations' 
      }, { status: 500 });
    }

    // Combine results in priority order
    const allResults: any[] = [];
    
    // 1. Exact matches first (highest priority)
    if (exactMatchResults.data) {
      allResults.push(...exactMatchResults.data.map((item: any) => ({ ...item, priority: 1 })));
    }

    // 2. Starts with matches second (medium priority)
    if (startsWithResults.data) {
      // Filter out items that are already in exact matches
      const exactMatchIds = new Set(exactMatchResults.data?.map((item: any) => item.place_id) || []);
      const uniqueStartsWithResults = startsWithResults.data.filter((item: any) => !exactMatchIds.has(item.place_id));
      allResults.push(...uniqueStartsWithResults.map((item: any) => ({ ...item, priority: 2 })));
    }

    // 3. Contains matches third (lowest priority)
    if (containsResults.data) {
      // Filter out items that are already in higher priority results
      const higherPriorityIds = new Set(allResults.map((item: any) => item.place_id));
      const uniqueContainsResults = containsResults.data.filter((item: any) => !higherPriorityIds.has(item.place_id));
      allResults.push(...uniqueContainsResults.map((item: any) => ({ ...item, priority: 3 })));
    }

    // Take only the requested limit
    const limitedResults = allResults.slice(0, limit);

    // Transform the data to match the expected format
    const transformedData = limitedResults.map(destination => ({
      place_id: destination.place_id,
      name: destination.name,
      name_normalized: destination.name_normalized,
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
    }));

    // Create response with caching headers for better performance
    const response = NextResponse.json({
      success: true,
      data: transformedData,
      count: transformedData.length
    });

        // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes      
    response.headers.set('ETag', `"${encodeURIComponent(cleanQuery)}-${limit}-${transformedData.length}"`);

    return response;

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
             name_normalized: dest.name_normalized || dest.name, // Use provided or fallback to name
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
