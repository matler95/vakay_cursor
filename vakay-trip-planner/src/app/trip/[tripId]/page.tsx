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
import { Calendar, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TripPageProps {
  params: {
    tripId: string;
  };
}

export default async function TripPage({ params }: TripPageProps) {
  // Await the params to get the tripId
  const { tripId } = await params;
  
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { notFound(); }

  const { count } = await supabase
    .from('trip_participants')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('user_id', user.id);
  if (count === 0) { notFound(); }

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();
  if (!trip) { notFound(); }

  const { data: itineraryDays } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('trip_id', tripId);

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('trip_id', tripId)
    .order('name');

  // FIX: Fetch participants and their profiles in two steps to avoid join issues
  const { data: participantRows } = await supabase
    .from('trip_participants')
    .select('user_id, role')
    .eq('trip_id', tripId);

  let participants: Participant[] = [];
  if (participantRows && participantRows.length > 0) {
    const userIds = participantRows.map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
    participants = participantRows.map((p) => ({
      role: p.role,
      profiles: {
        id: p.user_id,
        full_name: profileMap.get(p.user_id) ?? null,
      },
    }));
  }
  
  const { data: participantRole } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  // Calculate main location and total days
  const mainLocation = trip.destination || (locations && locations[0]?.name) || 'Unknown';
  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const endDate = trip.end_date ? new Date(trip.end_date) : null;
  const totalDays = startDate && endDate ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
  const dateRange = startDate && endDate ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Modern Trip Header */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
            {trip.name}
          </h1>
          <div className="flex items-center gap-4 text-gray-600 text-base flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-5 w-5 text-blue-500" />
              {dateRange}
            </span>
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-5 w-5 text-pink-500" />
                {trip.destination}
              </span>
            )}
            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full text-sm">
              {totalDays} days
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <EditTripInline trip={trip} userRole={participantRole?.role || null} />
        </div>
      </div>

      {/* Calendar Container */}
      <div className="mb-8 rounded-2xl bg-white shadow-lg p-6">
        <ItineraryView trip={trip} itineraryDays={itineraryDays || []} locations={locations || []} />
      </div>

      {/* Locations & Participants Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl bg-white shadow p-6 min-h-[300px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-pink-500" /> Locations
          </h2>
          <LocationManager tripId={trip.id} locations={locations || []} />
        </div>
        <div className="rounded-2xl bg-white shadow p-6 min-h-[300px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-block w-5 h-5 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold text-base">👥</span> Participants
          </h2>
          <ParticipantManager tripId={trip.id} participants={participants as any || []} currentUserRole={participantRole?.role || null} />
        </div>
      </div>
    </div>
  );
}