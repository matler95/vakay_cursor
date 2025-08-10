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
      type,
      provider,
      departure_location,
      arrival_location,
      departure_date,
      arrival_date,
      departure_time,
      arrival_time,
      flight_number,
      terminal,
      gate,
      seat,
      vehicle_number,
      carriage_coach,
      pickup_location,
      dropoff_location,
      booking_reference,
      notes,
      participants,
    } = body;

    // Validate required fields
    if (!type || !provider || !departure_location || !arrival_location || !departure_date || !arrival_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has access to this transportation record
    const { data: transportation } = await supabase
      .from('transportation')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!transportation) {
      return NextResponse.json({ error: 'Transportation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', transportation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update transportation record
    const { data: updatedTransportation, error } = await supabase
      .from('transportation')
      .update({
        type,
        provider,
        departure_location,
        arrival_location,
        departure_date,
        arrival_date,
        departure_time: departure_time || null,
        arrival_time: arrival_time || null,
        flight_number: flight_number || null,
        terminal: terminal || null,
        gate: gate || null,
        seat: seat || null,
        vehicle_number: vehicle_number || null,
        carriage_coach: carriage_coach || null,
        pickup_location: pickup_location || null,
        dropoff_location: dropoff_location || null,
        booking_reference: booking_reference || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transportation:', error);
      return NextResponse.json(
        { error: 'Failed to update transportation' },
        { status: 500 }
      );
    }

    // Replace participants associations if provided
    if (Array.isArray(participants)) {
      // Delete existing
      const { error: delErr } = await supabase
        .from('transportation_participants')
        .delete()
        .eq('transportation_id', params.id);
      if (delErr) {
        console.error('Failed to clear transportation participants:', delErr);
      }
      if (participants.length > 0) {
        const inserts = participants.map((pid: string) => ({
          transportation_id: Number(params.id),
          participant_user_id: pid,
        }));
        const { error: insErr } = await supabase
          .from('transportation_participants')
          .insert(inserts);
        if (insErr) {
          console.error('Failed to insert transportation participants:', insErr);
        }
      }
    }

    return NextResponse.json(updatedTransportation);
  } catch (error) {
    console.error('Error in transportation PUT:', error);
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

    // Check if user has access to this transportation record
    const { data: transportation } = await supabase
      .from('transportation')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!transportation) {
      return NextResponse.json({ error: 'Transportation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', transportation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete transportation record
    const { error } = await supabase
      .from('transportation')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting transportation:', error);
      return NextResponse.json(
        { error: 'Failed to delete transportation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Transportation deleted successfully' });
  } catch (error) {
    console.error('Error in transportation DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
