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
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripId = params.id;
    const body = await request.json();
    const { surveys_enabled } = body;

    if (typeof surveys_enabled !== 'boolean') {
      return NextResponse.json({ error: 'surveys_enabled must be a boolean' }, { status: 400 });
    }

    // Check if user is a participant in the trip
    const { data: participant, error: participantError } = await supabase
      .from('trip_participants')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update the surveys_enabled field
    const { error: updateError } = await supabase
      .from('trips')
      .update({ surveys_enabled })
      .eq('id', tripId);

    if (updateError) {
      console.error('Error updating surveys_enabled:', updateError);
      return NextResponse.json({ error: 'Failed to update surveys status' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Surveys status updated successfully',
      surveys_enabled 
    });
  } catch (error) {
    console.error('Error in PUT /api/trips/[id]/surveys-toggle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
