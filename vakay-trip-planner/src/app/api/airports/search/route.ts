import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ airports: [] });
    }

    const searchTerm = query.trim().toLowerCase();

    // Search across name, city, country_name, and iata_code columns
    const { data: airports, error } = await supabase
      .from('airports')
      .select('id, name, city, country_name, iata_code, latitude, longitude')
      .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,country_name.ilike.%${searchTerm}%,iata_code.ilike.%${searchTerm}%`)
      .order('name')
      .limit(10);

    if (error) {
      console.error('Error searching airports:', error);
      return NextResponse.json({ error: 'Failed to search airports' }, { status: 500 });
    }

    // Format the results for autocomplete
    const formattedAirports = (airports || []).map(airport => ({
      id: airport.id,
      name: airport.name,
      city: airport.city,
      country_name: airport.country_name,
      iata_code: airport.iata_code,
      latitude: airport.latitude,
      longitude: airport.longitude,
      // Create a display label for the autocomplete
      display: `${airport.name}${airport.iata_code ? ` (${airport.iata_code})` : ''}${airport.city ? `, ${airport.city}` : ''}${airport.country_name ? `, ${airport.country_name}` : ''}`,
      // Create a short display for the input field
      shortDisplay: `${airport.iata_code ? `${airport.iata_code} - ` : ''}${airport.name}${airport.city ? `, ${airport.city}` : ''}`
    }));

    return NextResponse.json({ airports: formattedAirports });
  } catch (error) {
    console.error('Error in airport search:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
