import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      address,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      booking_confirmation,
      booking_url,
      contact_phone,
      notes,
      participants,
    } = body;

    // Validate required fields
    if (!name || !address || !check_in_date || !check_out_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has access to this accommodation record
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', accommodation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update accommodation record
    const { data: updatedAccommodation, error } = await supabase
      .from('accommodations')
      .update({
        name,
        address,
        check_in_date,
        check_out_date,
        check_in_time: check_in_time || null,
        check_out_time: check_out_time || null,
        booking_confirmation: booking_confirmation || null,
        booking_url: booking_url || null,
        contact_phone: contact_phone || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating accommodation:', error);
      return NextResponse.json(
        { error: 'Failed to update accommodation' },
        { status: 500 }
      );
    }

    // Replace participants associations if provided
    if (Array.isArray(participants)) {
      const { error: delErr } = await supabase
        .from('accommodation_participants')
        .delete()
        .eq('accommodation_id', params.id);
      if (delErr) {
        console.error('Failed to clear accommodation participants:', delErr);
      }
      if (participants.length > 0) {
        const inserts = participants.map((pid: string) => ({
          accommodation_id: Number(params.id),
          participant_user_id: pid,
        }));
        const { error: insErr } = await supabase
          .from('accommodation_participants')
          .insert(inserts);
        if (insErr) {
          console.error('Failed to insert accommodation participants:', insErr);
        }
      }
    }

    return NextResponse.json(updatedAccommodation);
  } catch (error) {
    console.error('Error in accommodation PUT:', error);
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
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this accommodation record
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', accommodation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete accommodation record
    const { error } = await supabase
      .from('accommodations')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting accommodation:', error);
      return NextResponse.json(
        { error: 'Failed to delete accommodation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Error in accommodation DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
