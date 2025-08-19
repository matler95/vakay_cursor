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

    // Get surveys with options and vote counts
    const { data: surveys, error: surveysError } = await supabase
      .from('accommodation_surveys')
      .select(`
        *,
        survey_options (
          *,
          survey_votes (count)
        )
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (surveysError) {
      console.error('Error fetching surveys:', surveysError);
      return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
    }

    // Transform data to include vote counts and user's votes
    const transformedSurveys = await Promise.all(
      surveys.map(async (survey) => {
        const options = survey.survey_options || [];
        
        // Get vote counts for each option
        const optionsWithVotes = await Promise.all(
          options.map(async (option) => {
            const { count: voteCount } = await supabase
              .from('survey_votes')
              .select('*', { count: 'exact', head: true })
              .eq('option_id', option.id);

            // Check if current user has voted for this option
            const { data: userVote } = await supabase
              .from('survey_votes')
              .select('*')
              .eq('option_id', option.id)
              .eq('user_id', user.id)
              .single();

            return {
              ...option,
              vote_count: voteCount || 0,
              user_has_voted: !!userVote
            };
          })
        );

        return {
          ...survey,
          options: optionsWithVotes
        };
      })
    );

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

    if (!tripId || !name || !options || !Array.isArray(options) || options.length === 0) {
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

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

    // Create survey options
    const surveyOptions = options.map((option: any) => ({
      survey_id: survey.id,
      accommodation_name: option.accommodation_name,
      location: option.location || null,
      url: option.url || null
    }));

    const { error: optionsError } = await supabase
      .from('survey_options')
      .insert(surveyOptions);

    if (optionsError) {
      console.error('Error creating survey options:', optionsError);
      // Clean up the survey if options creation fails
      await supabase.from('accommodation_surveys').delete().eq('id', survey.id);
      return NextResponse.json({ error: 'Failed to create survey options' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Survey created successfully',
      survey: {
        ...survey,
        options: surveyOptions
      }
    });
  } catch (error) {
    console.error('Error in POST /api/accommodation-surveys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
