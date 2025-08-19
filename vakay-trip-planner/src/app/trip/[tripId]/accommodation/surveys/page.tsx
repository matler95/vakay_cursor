'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Database } from '@/types/database.types';
import { SurveyListView } from '../_components/SurveyListView';

interface SurveysPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function SurveysPage({ params }: SurveysPageProps) {
  const { tripId } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });

  // Get user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  // Check if user is a participant in this trip
  const { data: participantData } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!participantData) {
    notFound();
  }

  // Get trip details
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (!trip) {
    notFound();
  }

  // Check if surveys are enabled for this trip
  if (!trip.surveys_enabled) {
    redirect(`/trip/${tripId}?tab=accommodation`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SurveyListView
          tripId={tripId}
          currentUserId={user.id}
          tripName={trip.name}
        />
      </div>
    </div>
  );
}
