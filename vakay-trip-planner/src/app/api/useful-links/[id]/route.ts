import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database.types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
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
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the useful link to check access
    const { data: existingLink, error: fetchError } = await supabase
      .from('useful_links')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingLink) {
      return NextResponse.json(
        { error: 'Useful link not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this trip
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', existingLink.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update the useful link
    const { data: usefulLink, error } = await supabase
      .from('useful_links')
      .update({
        title,
        url,
        description,
        category,
        address,
        phone,
        notes,
        is_favorite: is_favorite || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating useful link:', error);
      return NextResponse.json(
        { error: 'Failed to update useful link' },
        { status: 500 }
      );
    }

    return NextResponse.json(usefulLink);
  } catch (error) {
    console.error('Error in PUT /api/useful-links/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the useful link to check access
    const { data: existingLink, error: fetchError } = await supabase
      .from('useful_links')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingLink) {
      return NextResponse.json(
        { error: 'Useful link not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this trip
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', existingLink.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete the useful link
    const { error } = await supabase
      .from('useful_links')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting useful link:', error);
      return NextResponse.json(
        { error: 'Failed to delete useful link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/useful-links/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
