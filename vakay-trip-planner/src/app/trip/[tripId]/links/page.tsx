// Useful Links page
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Database } from '@/types/database.types';
import { UsefulLinksView } from './_components/UsefulLinksView';
import { TripNavigation } from '../_components/TripNavigation';
import { Calendar, MapPin } from 'lucide-react';
import { EditTripInline } from '../_components/EditTripInline';

export const dynamic = 'force-dynamic';

interface UsefulLinksPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

export default async function UsefulLinksPage({ params }: UsefulLinksPageProps) {
  const { tripId } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch trip details
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (!trip) {
    notFound();
  }

  // Fetch user's role in this trip
  const { data: participantRole } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!participantRole) {
    notFound();
  }

  // Fetch useful links
  const { data: usefulLinks } = await supabase
    .from('useful_links')
    .select('*')
    .eq('trip_id', tripId)
    .order('is_favorite', { ascending: false })
    .order('created_at', { ascending: false });

  // Calculate date range and duration
  const formatDateRange = () => {
    if (!trip.start_date || !trip.end_date) return 'No dates set';
    
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };
    
    if (startDate.getFullYear() !== endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    } else if (startDate.getMonth() !== endDate.getMonth()) {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
    } else {
      return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
    }
  };

  const calculateTotalDays = () => {
    if (!trip.start_date || !trip.end_date) return 0;
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const dateRange = formatDateRange();
  const totalDays = calculateTotalDays();

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Main Trip Header */}
      <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 bg-white">
        {/* Mobile Layout: Stacked */}
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

      <UsefulLinksView
        trip={trip}
        usefulLinks={usefulLinks || []}
        userRole={participantRole?.role || null}
        currentUserId={user.id}
      />
    </div>
  );
}
