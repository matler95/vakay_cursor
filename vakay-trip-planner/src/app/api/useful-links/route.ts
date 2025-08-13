import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      trip_id,
      title,
      url,
      description,
      category,
      address,
      phone,
      notes,
      is_favorite,
    } = body;

    // Validate required fields
    if (!trip_id || !title || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has access to this trip
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Insert the useful link
    const { data: usefulLink, error } = await supabase
      .from('useful_links')
      .insert({
        trip_id,
        title,
        url,
        description,
        category,
        address,
        phone,
        notes,
        is_favorite: is_favorite || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting useful link:', error);
      return NextResponse.json(
        { error: 'Failed to create useful link' },
        { status: 500 }
      );
    }

    return NextResponse.json(usefulLink, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/useful-links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
