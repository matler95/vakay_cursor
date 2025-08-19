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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    console.log('Fetching surveys for trip:', tripId, 'by user:', user.id);

    // Check if user is a participant in the trip
    const { data: participant, error: participantError } = await supabase
      .from('trip_participants')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      console.error('Access denied:', participantError);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('User access verified, fetching surveys...');

    // First, let's check if surveys exist at all
    const { data: surveyCount, error: countError } = await supabase
      .from('accommodation_surveys')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    console.log('Survey count:', surveyCount);

    // Get surveys with options and vote counts in a single optimized query
    const { data: surveys, error: surveysError } = await supabase
      .from('accommodation_surveys')
      .select(`
        id, name, status, created_by, trip_id, created_at,
        survey_options (
          id, accommodation_name, location, url
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (surveysError) {
      console.error('Error fetching surveys:', surveysError);
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
    }

    console.log('Raw surveys data:', surveys);
    console.log('Surveys with options:', surveys?.map(s => ({
      id: s.id,
      name: s.name,
      optionsCount: s.survey_options?.length || 0,
      options: s.survey_options
    })));

    // Let's also check if survey_options exist directly
    if (surveys && surveys.length > 0) {
      const surveyIds = surveys.map(s => s.id);
      const { data: directOptions, error: optionsError } = await supabase
        .from('survey_options')
        .select('*')
        .in('survey_id', surveyIds);
      
      console.log('Direct survey options query:', directOptions);
      console.log('Direct options error:', optionsError);
    }

    // Get all vote counts in a single query for better performance
    const { data: allVoteCounts, error: voteCountsError } = await supabase
      .from('survey_votes')
      .select('option_id', { count: 'exact', head: true })
      .in('option_id', surveys.flatMap(s => s.survey_options?.map(o => o.id) || []));

    if (voteCountsError) {
      console.error('Error fetching vote counts:', voteCountsError);
      return NextResponse.json({ error: 'Failed to fetch vote counts' }, { status: 500 });
    }

    // Get all user votes in a single query
    const { data: allUserVotes, error: userVotesError } = await supabase
      .from('survey_votes')
      .select('option_id')
      .eq('user_id', user.id)
      .in('option_id', surveys.flatMap(s => s.survey_options?.map(o => o.id) || []));

    if (userVotesError) {
      console.error('Error fetching user votes:', userVotesError);
      return NextResponse.json({ error: 'Failed to fetch user votes' }, { status: 500 });
    }

    // Create lookup maps for O(1) access
    const voteCountsMap = new Map(
      allVoteCounts?.map(vc => [vc.option_id, (vc as any).count || 0]) || []
    );
    const userVotesSet = new Set(
      allUserVotes?.map(uv => uv.option_id) || []
    );

    // Transform data efficiently using the lookup maps
    const transformedSurveys = surveys.map((survey) => {
      const options = survey.survey_options || [];
      
      const optionsWithVotes = options.map((option) => ({
        ...option,
        vote_count: voteCountsMap.get(option.id) || 0,
        user_has_voted: userVotesSet.has(option.id)
      }));

      return {
        ...survey,
        options: optionsWithVotes
      };
    });

    console.log('Final transformed surveys:', transformedSurveys?.map(s => ({
      id: s.id,
      name: s.name,
      optionsCount: s.options?.length || 0,
      options: s.options
    })));

    return NextResponse.json({ surveys: transformedSurveys });
  } catch (error) {
    console.error('Error in GET /api/accommodation-surveys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tripId, name, options } = body;

    console.log('Creating survey with data:', { tripId, name, options });

    if (!tripId || !name || !options || !Array.isArray(options) || options.length === 0) {
      console.error('Invalid request data:', { tripId, name, options });
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Check if user is a participant in the trip
    const { data: participant, error: participantError } = await supabase
      .from('trip_participants')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (participantError || !participant) {
      console.error('Access denied:', participantError);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('User access verified, creating survey...');

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from('accommodation_surveys')
      .insert({
        trip_id: tripId,
        created_by: user.id,
        name,
        status: 'open'
      })
      .select()
      .single();

    if (surveyError) {
      console.error('Error creating survey:', surveyError);
      return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
    }

    console.log('Survey created successfully:', survey.id);

    // Create survey options
    const surveyOptions = options.map((option: any) => ({
      survey_id: survey.id,
      accommodation_name: option.accommodation_name,
      location: option.location || null,
      url: option.url || null
    }));

    console.log('Creating survey options:', surveyOptions);
    console.log('Survey ID for options:', survey.id);

    const { data: createdOptions, error: optionsError } = await supabase
      .from('survey_options')
      .insert(surveyOptions)
      .select('id, accommodation_name, location, url, survey_id');

    if (optionsError) {
      console.error('Error creating survey options:', optionsError);
      console.error('Options that failed to insert:', surveyOptions);
      // Clean up the survey if options creation fails
      await supabase.from('accommodation_surveys').delete().eq('id', survey.id);
      return NextResponse.json({ error: 'Failed to create survey options' }, { status: 500 });
    }

    console.log('Survey options created successfully:', createdOptions?.length);
    console.log('Created options data:', createdOptions);

    return NextResponse.json({ 
      message: 'Survey created successfully',
      survey: {
        ...survey,
        options: createdOptions
      }
    });
  } catch (error) {
    console.error('Error in POST /api/accommodation-surveys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
