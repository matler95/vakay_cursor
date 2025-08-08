// src/app/trip/[tripId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Database } from '@/types/database.types';
import { ItineraryView } from './_components/ItineraryView';
import { LocationManager } from './_components/LocationManager';
import { ParticipantManager } from './_components/ParticipantManager';
import { EditTripInline } from './_components/EditTripInline';
import { type Participant } from './_components/ParticipantManager';

export const dynamic = 'force-dynamic';

interface TripPageProps {
  params: {
    tripId: string;
  };
}

export default async function TripPage({ params }: TripPageProps) {
  // We have removed the "const { tripId } = params;" line
  // and will use "params.tripId" directly in all queries.
  
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { notFound(); }

  const { count } = await supabase
    .from('trip_participants')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', params.tripId) // Using params.tripId directly
    .eq('user_id', user.id);
  if (count === 0) { notFound(); }

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', params.tripId) // Using params.tripId directly
    .single();
  if (!trip) { notFound(); }

  const { data: itineraryDays } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('trip_id', params.tripId); // Using params.tripId directly

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('trip_id', params.tripId) // Using params.tripId directly
    .order('name');

  const { data: participants } = await supabase
    .from('trip_participants')
    .select('role, profiles!user_id(id, full_name)')
    .eq('trip_id', params.tripId); // Using params.tripId directly
  
  const { data: participantRole } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', params.tripId) // Using params.tripId directly
    .eq('user_id', user.id)
    .single();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
          <p className="mt-1 text-lg text-gray-500">
            Your itinerary for {trip.destination || 'your upcoming trip'}.
          </p>
        </div>
        <EditTripInline trip={trip} userRole={participantRole?.role || null} />
      </div>

      <ParticipantManager tripId={trip.id} participants={participants as any || []} />
      <ItineraryView trip={trip} itineraryDays={itineraryDays || []} locations={locations || []} />
      <LocationManager tripId={trip.id} locations={locations || []} />
    </div>
  );
}