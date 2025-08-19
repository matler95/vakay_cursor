import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { optionId, action } = body; // action: 'vote' or 'unvote'

    if (!optionId || !action) {
      return NextResponse.json({ error: 'Option ID and action are required' }, { status: 400 });
    }

    // Check if the survey is still open
    const { data: option, error: optionError } = await supabase
      .from('survey_options')
      .select(`
        *,
        accommodation_surveys!inner (
          id,
          status,
          trip_id
        )
      `)
      .eq('id', optionId)
      .single();

    if (optionError || !option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    // Check if survey is closed
    if (option.accommodation_surveys.status === 'closed') {
      return NextResponse.json({ error: 'Cannot vote on closed surveys' }, { status: 400 });
    }

    // Check if user is a participant in the trip
    const { data: participant, error: participantError } = await supabase
      .from('trip_participants')
      .select('*')
      .eq('trip_id', option.accommodation_surveys.trip_id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'vote') {
      // Check if user already voted for this option
      const { data: existingVote } = await supabase
        .from('survey_votes')
        .select('*')
        .eq('option_id', optionId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        return NextResponse.json({ error: 'Already voted for this option' }, { status: 400 });
      }

      // Add vote
      const { error: voteError } = await supabase
        .from('survey_votes')
        .insert({
          option_id: optionId,
          user_id: user.id
        });

      if (voteError) {
        console.error('Error adding vote:', voteError);
        return NextResponse.json({ error: 'Failed to add vote' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Vote added successfully' });
    } else if (action === 'unvote') {
      // Remove vote
      const { error: unvoteError } = await supabase
        .from('survey_votes')
        .delete()
        .eq('option_id', optionId)
        .eq('user_id', user.id);

      if (unvoteError) {
        console.error('Error removing vote:', unvoteError);
        return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Vote removed successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/accommodation-surveys/vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
