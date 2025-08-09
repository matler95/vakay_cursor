// src/app/trip/[tripId]/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Database } from '@/types/database.types';
import { ItineraryView } from './_components/ItineraryView';
import { LocationManager } from './_components/LocationManager';
import { ParticipantManager } from './_components/ParticipantManager';
import { EditTripInline } from './_components/EditTripInline';
import { TripNavigation } from './_components/TripNavigation';
import { type Participant } from './_components/ParticipantManager';
import { Calendar, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TripPageProps {
  params: Promise<{
    tripId: string;
  }>;
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

  // Calculate total days
  const startDate = trip.start_date ? new Date(trip.start_date) : null;
  const endDate = trip.end_date ? new Date(trip.end_date) : null;
  const totalDays = startDate && endDate ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
  const dateRange = startDate && endDate ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '';

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Modern Trip Header */}
      <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 bg-white">
        {/* Mobile Layout: Compact horizontal layout */}
        <div className="md:hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-gray-900 truncate">
                {trip.name}
              </h1>
            </div>
            <div className="flex-shrink-0">
              <EditTripInline trip={trip} userRole={participantRole?.role || null} />
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-600 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              {dateRange}
            </span>
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-pink-500" />
                {trip.destination}
              </span>
            )}
            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded-full text-xs">
              {totalDays} days
            </span>
          </div>
        </div>

        {/* Desktop Layout: Original layout */}
        <div className="hidden md:flex md:items-center md:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
              {trip.name}
            </h1>
            <div className="flex flex-row items-center gap-4 text-gray-600 text-base">
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
      </div>

      {/* Trip Navigation */}
      <TripNavigation tripId={trip.id} />

      {/* Calendar Container */}
      <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl bg-white shadow p-3 sm:p-6">
        <ItineraryView trip={trip} itineraryDays={itineraryDays || []} locations={locations || []} />
      </div>

      {/* Locations & Participants Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <div className="rounded-xl sm:rounded-2xl bg-white shadow p-4 sm:p-6 min-h-[250px] sm:min-h-[300px] flex flex-col">
          <LocationManager tripId={trip.id} locations={locations || []} />
        </div>
        <div className="rounded-xl sm:rounded-2xl bg-white shadow p-4 sm:p-6 min-h-[250px] sm:min-h-[300px] flex flex-col">
          <ParticipantManager tripId={trip.id} participants={participants || []} currentUserRole={participantRole?.role || null} />
        </div>
      </div>
    </div>
  );
}