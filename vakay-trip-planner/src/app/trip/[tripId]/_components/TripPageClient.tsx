// src/app/trip/[tripId]/_components/TripPageClient.tsx
'use client';

import { Database } from '@/types/database.types';
import { ItineraryView } from './ItineraryView';
import { LocationManager } from './LocationManager';
import { ParticipantManager, type Participant } from './ParticipantManager';
import { EditTripInline } from './EditTripInline';
import { TripNavigation } from './TripNavigation';
import { Calendar, MapPin, MapPinPlus, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { AddLocationModal } from './AddLocationModal';
import { AddParticipantModal } from './AddParticipantModal';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface TripPageClientProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  participants: Participant[];
  participantRole: { role: string } | null;
}

export function TripPageClient({
  trip,
  itineraryDays,
  locations,
  participants,
  participantRole,
}: TripPageClientProps) {
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDates, setSelectedDates] = useState(new Set());

  const startDate = trip?.start_date ? new Date(trip.start_date) : null;
  const endDate = trip?.end_date ? new Date(trip.end_date) : null;
  const totalDays = startDate && endDate
    ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;
  const dateRange = startDate && endDate
    ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Modern Trip Header */}
      <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 bg-white">
        {/* Mobile Layout */}
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

        {/* Desktop Layout */}
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

      {/* Secondary Header - Trip Plan */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Trip Plan</h2>
          {isEditing ? (
          <div className="text-gray-600 mt-1">
            <strong>Edit Mode:</strong> Edit days individually or select multiple to update locations
          </div>
        ) : (
          <p className="text-gray-600 mt-1">
            Add locations and participants to start planning your trip
          </p>
      )}
        </div>

        <div className="flex gap-3">
          {/* Add Location Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={() => setIsAddLocationModalOpen(true)} variant="outline" size="sm" className="flex items-center gap-2">
                  <MapPinPlus className="h-4 w-4" />
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
                <Button onClick={() => setIsAddParticipantModalOpen(true)} variant="outline" size="sm" className="flex items-center gap-2">
                  <UserRoundPlus className="h-4 w-4" />
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
        <ItineraryView
        trip={trip}
        itineraryDays={itineraryDays || []}
        locations={locations || []}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        />
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
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}


