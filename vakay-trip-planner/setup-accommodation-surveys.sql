-- Setup Accommodation Surveys Feature
-- This migration creates the necessary tables and security policies for the accommodation survey functionality

-- Create accommodation_surveys table
CREATE TABLE IF NOT EXISTS public.accommodation_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey_options table
CREATE TABLE IF NOT EXISTS public.survey_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES public.accommodation_surveys(id) ON DELETE CASCADE,
    accommodation_name TEXT NOT NULL,
    location TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create survey_votes table
CREATE TABLE IF NOT EXISTS public.survey_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID NOT NULL REFERENCES public.survey_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(option_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accommodation_surveys_trip_id ON public.accommodation_surveys(trip_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_surveys_created_by ON public.accommodation_surveys(created_by);
CREATE INDEX IF NOT EXISTS idx_accommodation_surveys_status ON public.accommodation_surveys(status);
CREATE INDEX IF NOT EXISTS idx_survey_options_survey_id ON public.survey_options(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_option_id ON public.survey_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_survey_votes_user_id ON public.survey_votes(user_id);

-- Enable Row Level Security
ALTER TABLE public.accommodation_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accommodation_surveys
CREATE POLICY "Users can view surveys for trips they participate in" ON public.accommodation_surveys
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trip_participants tp
            WHERE tp.trip_id = accommodation_surveys.trip_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create surveys for trips they participate in" ON public.accommodation_surveys
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trip_participants tp
            WHERE tp.trip_id = accommodation_surveys.trip_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Survey creators can update their surveys" ON public.accommodation_surveys
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Survey creators can delete their surveys" ON public.accommodation_surveys
    FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for survey_options
CREATE POLICY "Users can view options for surveys they can access" ON public.survey_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.accommodation_surveys s
            JOIN public.trip_participants tp ON tp.trip_id = s.trip_id
            WHERE s.id = survey_options.survey_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Survey owners can manage options" ON public.survey_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.accommodation_surveys s
            WHERE s.id = survey_options.survey_id
            AND s.created_by = auth.uid()
        )
    );

-- RLS Policies for survey_votes
CREATE POLICY "Users can view votes for surveys they can access" ON public.survey_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.survey_options so
            JOIN public.accommodation_surveys s ON s.id = so.survey_id
            JOIN public.trip_participants tp ON tp.trip_id = s.trip_id
            WHERE so.id = survey_votes.option_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can vote on open surveys for trips they participate in" ON public.survey_votes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.survey_options so
            JOIN public.accommodation_surveys s ON s.id = so.survey_id
            JOIN public.trip_participants tp ON tp.trip_id = s.trip_id
            WHERE so.id = survey_votes.option_id
            AND tp.user_id = auth.uid()
            AND s.status = 'open'
        )
    );

CREATE POLICY "Users can remove their own votes" ON public.survey_votes
    FOR DELETE USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_accommodation_surveys_updated_at
    BEFORE UPDATE ON public.accommodation_surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.accommodation_surveys TO authenticated;
GRANT ALL ON public.survey_options TO authenticated;
GRANT ALL ON public.survey_votes TO authenticated;

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO public.accommodation_surveys (trip_id, created_by, name, status) VALUES 
-- ('your-trip-id-here', 'your-user-id-here', 'Sample Survey', 'open');
