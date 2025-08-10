'use client';

import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';
import { ItineraryView } from './_components/ItineraryView';
import { LocationManager } from './_components/LocationManager';
import { ParticipantManager } from './_components/ParticipantManager';
import { EditTripInline } from './_components/EditTripInline';
import { TripNavigation } from './_components/TripNavigation';
import { type Participant } from './_components/ParticipantManager';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { AddLocationModal } from './_components/AddLocationModal';
import { AddParticipantModal } from './_components/AddParticipantModal';
import { useRouter } from 'next/navigation';
import Lottie from 'lottie-react';
import flightAnimation from '@/../public/Flight.json';



interface TripPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

export default function TripPage({ params }: TripPageProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<Database['public']['Tables']['trips']['Row'] | null>(null);
  const [itineraryDays, setItineraryDays] = useState<Database['public']['Tables']['itinerary_days']['Row'][]>([]);
  const [locations, setLocations] = useState<Database['public']['Tables']['locations']['Row'][]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantRole, setParticipantRole] = useState<{ role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { tripId: id } = await params;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { 
          router.push('/auth/callback');
          return;
        }

        const { count } = await supabase
          .from('trip_participants')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', id)
          .eq('user_id', user.id);
        if (count === 0) { 
          router.push('/dashboard');
          return;
        }

        const { data: tripData } = await supabase
          .from('trips')
          .select('*')
          .eq('id', id)
          .single();
        if (!tripData) { 
          router.push('/dashboard');
          return;
        }
        setTrip(tripData);

        const { data: itineraryDaysData } = await supabase
          .from('itinerary_days')
          .select('*')
          .eq('trip_id', id);
        setItineraryDays(itineraryDaysData || []);

        const { data: locationsData } = await supabase
          .from('locations')
          .select('*')
          .eq('trip_id', id)
          .order('name');
        setLocations(locationsData || []);

        // Fetch participants and their profiles
        const { data: participantRows } = await supabase
          .from('trip_participants')
          .select('user_id, role')
          .eq('trip_id', id);

        if (participantRows && participantRows.length > 0) {
          const userIds = participantRows.map((p: { user_id: string; role: string }) => p.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          const profileMap = new Map((profiles || []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name]));
          const participantsData = participantRows.map((p: { user_id: string; role: string }) => ({
            role: p.role,
            profiles: {
              id: p.user_id,
              full_name: profileMap.get(p.user_id) ?? null,
            },
          }));
          setParticipants(participantsData);
        }
        
        const { data: participantRoleData } = await supabase
          .from('trip_participants')
          .select('role')
          .eq('trip_id', id)
          .eq('user_id', user.id)
          .single();
        setParticipantRole(participantRoleData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching trip data:', error);
        router.push('/dashboard');
      }
    };

    fetchData();
  }, [params, router]);

  // Calculate total days
  const startDate = trip?.start_date ? new Date(trip.start_date) : null;
  const endDate = trip?.end_date ? new Date(trip.end_date) : null;
  const totalDays = startDate && endDate ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
  const dateRange = startDate && endDate ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '';

  if (isLoading || !trip) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="flex flex-col items-center">
          <Lottie animationData={flightAnimation} loop style={{ width: 96, height: 96 }} />
          <span className="mt-4 text-lg text-white font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

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

      {/* Secondary Header - Trip Plan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Trip Plan
          </h2>
          <p className="text-gray-600 mt-1">
            Plan your daily itinerary and manage trip details
          </p>
        </div>
        
        <div className="flex gap-3">
          {/* Add Location Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsAddLocationModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Location</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new locations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Add Participant Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsAddParticipantModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Participant</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Invite participants</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

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

      {/* Modals */}
      {isAddLocationModalOpen && (
        <AddLocationModal
          tripId={trip.id}
          isOpen={isAddLocationModalOpen}
          onClose={() => setIsAddLocationModalOpen(false)}
          onLocationAdded={() => {
            setIsAddLocationModalOpen(false);
            // Refresh the page to get updated data
            window.location.reload();
          }}
        />
      )}

      {isAddParticipantModalOpen && (
        <AddParticipantModal
          tripId={trip.id}
          isOpen={isAddParticipantModalOpen}
          onClose={() => setIsAddParticipantModalOpen(false)}
          onParticipantAdded={() => {
            setIsAddParticipantModalOpen(false);
            // Refresh the page to get updated data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}