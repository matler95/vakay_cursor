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

    const surveyId = params.id;
    const body = await request.json();
    const { name, options, status } = body;

    // Check if user owns the survey
    const { data: survey, error: surveyError } = await supabase
      .from('accommodation_surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('created_by', user.id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found or access denied' }, { status: 404 });
    }

    // Update survey
    const { error: updateError } = await supabase
      .from('accommodation_surveys')
      .update({ 
        name: name || survey.name,
        status: status || survey.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', surveyId);

    if (updateError) {
      console.error('Error updating survey:', updateError);
      return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
    }

    // If options are provided, update them
    if (options && Array.isArray(options)) {
      // Delete existing options
      const { error: deleteOptionsError } = await supabase
        .from('survey_options')
        .delete()
        .eq('survey_id', surveyId);

      if (deleteOptionsError) {
        console.error('Error deleting old options:', deleteOptionsError);
        return NextResponse.json({ error: 'Failed to update survey options' }, { status: 500 });
      }

      // Insert new options
      const surveyOptions = options.map((option: any) => ({
        survey_id: surveyId,
        accommodation_name: option.accommodation_name,
        location: option.location || null,
        url: option.url || null
      }));

      const { error: insertOptionsError } = await supabase
        .from('survey_options')
        .insert(surveyOptions);

      if (insertOptionsError) {
        console.error('Error inserting new options:', insertOptionsError);
        return NextResponse.json({ error: 'Failed to update survey options' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'Survey updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/accommodation-surveys/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const surveyId = params.id;

    // Check if user owns the survey
    const { data: survey, error: surveyError } = await supabase
      .from('accommodation_surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('created_by', user.id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Survey not found or access denied' }, { status: 404 });
    }

    // Delete survey (cascade will handle options and votes)
    const { error: deleteError } = await supabase
      .from('accommodation_surveys')
      .delete()
      .eq('id', surveyId);

    if (deleteError) {
      console.error('Error deleting survey:', deleteError);
      return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/accommodation-surveys/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
