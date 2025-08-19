import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/types/database.types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const optionId = searchParams.get('optionId');

    if (!optionId) {
      return NextResponse.json({ error: 'Option ID is required' }, { status: 400 });
    }

    console.log('Fetching voter details for option:', optionId, 'by user:', user.id);

    // First, get the survey option to find the survey_id
    const { data: option, error: optionError } = await supabase
      .from('survey_options')
      .select('id, survey_id')
      .eq('id', optionId)
      .single();

    if (optionError || !option) {
      console.error('Option not found:', optionError);
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }

    console.log('Found option:', option);

    // Get the survey to find the trip_id
    const { data: survey, error: surveyError } = await supabase
      .from('accommodation_surveys')
      .select('trip_id')
      .eq('id', option.survey_id)
      .single();

    if (surveyError || !survey) {
      console.error('Survey not found:', surveyError);
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    console.log('Found survey:', survey);

    // Check if user is a participant in the trip
    const { data: participant, error: participantError } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', survey.trip_id)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      console.error('Access denied:', participantError);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('User access verified');

    // Get voters for this option
    const { data: votes, error: votesError } = await supabase
      .from('survey_votes')
      .select('user_id')
      .eq('option_id', optionId);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    console.log('Found votes:', votes?.length || 0);

    if (!votes || votes.length === 0) {
      return NextResponse.json({ voters: [] });
    }

    // Get profile information for all voters
    const userIds = votes.map(vote => vote.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    console.log('Found profiles:', profiles?.length || 0);

    // Create a map for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

    // Transform the data safely
    const voters = votes.map(vote => ({
      user_id: vote.user_id,
      full_name: profileMap.get(vote.user_id) || null
    }));

    console.log('Returning voters:', voters.length);
    return NextResponse.json({ voters });
  } catch (error) {
    console.error('Error in GET /api/accommodation-surveys/vote-details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
