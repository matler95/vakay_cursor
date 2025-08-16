// src/app/trip/[tripId]/_components/ItineraryView.tsx
'use client';

import { getDatesInRange } from '@/lib/dateUtils';
import { Database } from '@/types/database.types';
import { DayCard } from './DayCard';
import { CalendarGrid } from './CalendarGrid';
import { MobileEditMode } from './MobileEditMode';
import { DayDetailsModal } from './DayDetailsModal';
import { LocationsSidebar } from './LocationsSidebar';
import { UndoManager, useUndoManager } from './UndoManager';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, CheckCircle, AlertCircle, X, MapPin, Settings, MapPinPlus, UserRoundPlus, CopyCheck, Plus } from 'lucide-react';
import { BulkActionPanel } from './BulkActionPanel';
import { LocationManager } from './LocationManager';
import { ParticipantManager, type Participant } from './ParticipantManager';
import { saveItineraryChanges } from '../actions';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Transportation = Database['public']['Tables']['transportation']['Row'];
type Accommodation = Database['public']['Tables']['accommodations']['Row'];

interface ItineraryViewProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  transportation: Transportation[];
  accommodations: Accommodation[];
  participants: Participant[];
  participantRole: string | null;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

type ItinerarySubTab = 'calendar' | 'locations' | 'participants';

export function ItineraryView({ trip, itineraryDays, locations, transportation, accommodations, participants, participantRole, isEditing, setIsEditing }: ItineraryViewProps) {
  return (
    <UndoManager>
      <ItineraryViewContent 
        trip={trip}
        itineraryDays={itineraryDays}
        locations={locations}
        transportation={transportation}
        accommodations={accommodations}
        participants={participants}
        participantRole={participantRole}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </UndoManager>
  );
}

// Separate component that can use the undo context
function ItineraryViewContent({ trip, itineraryDays, locations, transportation, accommodations, participants, participantRole, isEditing, setIsEditing }: ItineraryViewProps) {
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [state, setState] = useState<{ message: string }>({ message: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [showLocationsSidebar, setShowLocationsSidebar] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<ItinerarySubTab>('calendar');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isDeleteParticipantsMode, setIsDeleteParticipantsMode] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<string>('');
  const { addAction } = useUndoManager();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset delete mode when switching tabs
  useEffect(() => {
    if (activeSubTab !== 'locations') {
      setIsDeleteMode(false);
      setIsAddLocationModalOpen(false);
    }
    if (activeSubTab !== 'participants') {
      setIsDeleteParticipantsMode(false);
      setIsAddParticipantModalOpen(false);
    }
    if (activeSubTab !== 'calendar') {
      setIsEditing(false);
    }
  }, [activeSubTab, setIsEditing]);
  // Form action function that matches the expected signature
  const formAction = async (formData: FormData) => {
    try {
      const result = await saveItineraryChanges(state, formData);
      if (result?.message) {
        setState({ message: result.message });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ message: errorMessage });
      return { message: errorMessage };
    }
  };
  


  useEffect(() => {
    const initialMap = new Map((itineraryDays || []).map(day => [day.date, day]));
    setDraftItinerary(initialMap);
  }, [itineraryDays]);

  // Auto-dismiss status messages after 3 seconds
  useEffect(() => {
    if (state?.message) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 3000); // Show for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [state?.message]);

  // --- NEW: Function to update the draft state from a child component ---
  const handleUpdateDraft = useCallback((dateStr: string, updatedValues: Partial<ItineraryDay>) => {
    const previousData = draftItinerary.get(dateStr);
    
    setDraftItinerary(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(dateStr);
      if (existing) {
        newMap.set(dateStr, { ...existing, ...updatedValues });
      } else {
        newMap.set(dateStr, {
          id: 0,
          date: dateStr,
          trip_id: trip.id,
          location_1_id: null,
          location_2_id: null,
          notes: '',
          summary: '',
          ...updatedValues
        });
      }
      return newMap;
    });

    // Add undo action
    if (previousData) {
      addAction(
        `Updated day ${dateStr}`,
        () => {
          setDraftItinerary(prev => {
            const newMap = new Map(prev);
            newMap.set(dateStr, previousData);
            return newMap;
          });
        },
        { previousData, updatedValues }
      );
    }
  }, [draftItinerary, trip.id, addAction]);

  // Handle day click for showing details (when not in edit mode)
  const handleDayClick = useCallback((dateStr: string) => {
    if (!isEditing) {
      setSelectedDayDate(dateStr);
      setIsDayDetailsOpen(true);
    }
  }, [isEditing]);

  // Handle day details modal close
  const handleDayDetailsClose = useCallback(() => {
    setIsDayDetailsOpen(false);
    setSelectedDayDate('');
  }, []);

  // Handle day update from modal
  const handleDayUpdate = useCallback((dateStr: string, updatedValues: Partial<ItineraryDay>) => {
    handleUpdateDraft(dateStr, updatedValues);
  }, [handleUpdateDraft]);

  // Quick action handlers

  // Calculate trip dates
  const tripDates = trip.start_date && trip.end_date 
    ? getDatesInRange(new Date(trip.start_date), new Date(trip.end_date))
    : [];

  // Early return if no trip dates
  if (tripDates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please set start and end dates for this trip to view the itinerary.</p>
      </div>
    );
  }

  // Calculate unique months/years in tripDates
  const monthYearSet = Array.from(new Set(tripDates.map(d => `${d.getUTCMonth()}-${d.getUTCFullYear()}`)))
    .map(key => {
      const [month, year] = key.split('-');
      return { month: Number(month), year: Number(year) };
    });
  let monthLabel = '';
  if (monthYearSet.length === 1) {
    monthLabel = tripDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (monthYearSet.length === 2) {
    const [a, b] = monthYearSet;
    if (a.year === b.year) {
      monthLabel = `${new Date(a.year, a.month).toLocaleString('en-US', { month: 'long' })} – ${new Date(b.year, b.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    } else {
      monthLabel = `${new Date(a.year, a.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })} – ${new Date(b.year, b.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    }
  }

  // Calculate the index for the first day (Monday=0, Sunday=6)
  const firstDay = tripDates[0].getUTCDay();
  const emptyCells = (firstDay + 6) % 7;

  // Show success/error message
  if (showMessage && state?.message) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-2 p-4 rounded-lg shadow-lg ${
          state.message.includes('success') || state.message.includes('saved')
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {state.message.includes('success') || state.message.includes('saved') ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{state.message}</span>
          <button
            onClick={() => setShowMessage(false)}
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* --- HEADER SECTION --- */}
      {/* This is the main flex container. It holds the header text on the left
          and the conditionally rendered button group on the right. */}
      <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 py-3 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center gap-4 mb-6">
        
        {/* Left Side: Header Text */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {activeSubTab === 'calendar' && 'Itinerary'}
            {activeSubTab === 'locations' && 'Locations'}
            {activeSubTab === 'participants' && 'Participants'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {activeSubTab === 'calendar' && 'Plan your daily activities'}
            {activeSubTab === 'locations' && 'Manage locations for your trip'}
            {activeSubTab === 'participants' && 'Manage who\'s coming on your trip'}
          </p>
        </div>

        {/* Right Side: Calendar Controls - MOVED HERE and CONSOLIDATED */}
        {activeSubTab === 'calendar' && (
        <div className="flex gap-3">
            {/* Edit Mode Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "default" : "default"}
                    className="flex items-center gap-2"
                    >
                    {isEditing ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Exit Edit</span>
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditing ? 'Exit edit mode' : 'Enter edit mode'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>
        )}

        {/* Right Side: Locations Controls */}
        {activeSubTab === 'locations' && (
          <div className="flex gap-3">
            {/* Select Locations Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                    variant={isDeleteMode ? "default" : "outline"}
                    className="flex items-center gap-2"
                    >
                    {isDeleteMode ? (
                      <>
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </>
                    ) : (
                      <>
                        <CopyCheck className="h-4 w-4" />
                        {/* <span className="hidden sm:inline">Select Locations</span> */}
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDeleteMode ? 'Cancel' : 'Select locations'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Add Location Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsAddLocationModalOpen(true)}
                    variant="default"
                    className="flex items-center gap-2"
                    >
                    <Plus className="h-4 w-4" />
                    {/* <span className="hidden sm:inline">Add Location</span> */}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add locations</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Right Side: Participants Controls */}
        {activeSubTab === 'participants' && (
          <div className="flex gap-3">
            {/* Select Participants Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsDeleteParticipantsMode(!isDeleteParticipantsMode)}
                    variant={isDeleteParticipantsMode ? "default" : "outline"}
                    className="flex items-center gap-2"
                    >
                    {isDeleteParticipantsMode ? (
                      <>
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </>
                    ) : (
                      <>
                        <CopyCheck className="h-4 w-4" />
                        {/* <span className="hidden sm:inline">Select Participants</span> */}
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDeleteParticipantsMode ? 'Cancel' : 'Select participants'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Add Participant Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsAddParticipantModalOpen(true)}
                    variant="default"
                    className="flex items-center gap-2"
                    >
                    <Plus className="h-4 w-4" />
                    {/* <span className="hidden sm:inline">Add Participant</span> */}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Invite participants</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* --- SUB-TABS NAVIGATION --- */}
      
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-6" role="tablist" aria-label="Itinerary sections">
          {[
            { id: 'calendar', name: 'Calendar', icon: MapPin },
            { id: 'locations', name: 'Locations', icon: MapPinPlus },
            { id: 'participants', name: 'Participants', icon: UserRoundPlus }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as ItinerarySubTab)}
                className={`flex items-center gap-1 sm:gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.name}
              >
                <Icon className="h-4 w-4" />
                <span className="sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* --- SUB-TAB CONTENT --- */}
      {/* The duplicated button controls have been REMOVED from here */}
      {activeSubTab === 'calendar' && (
        <>
          {/* Mobile Edit Mode */}
          {isMobile && isEditing && (
            <MobileEditMode
              trip={trip}
              itineraryDays={itineraryDays}
              locations={locations}
              transportation={transportation}
              accommodations={accommodations}
              onExitEditMode={() => setIsEditing(false)}
              saveAction={formAction}
            />
          )}
          
          {/* Desktop Edit Mode */}
          {(!isMobile || !isEditing) && (
            <CalendarGrid
              trip={trip}
              itineraryDays={itineraryDays}
              locations={locations}
              isEditing={isEditing}
              onUpdateDraft={handleUpdateDraft}
              onBulkUpdate={() => {}} // No longer needed
              onExitEditMode={() => setIsEditing(false)}
              saveAction={formAction}
              onDayClick={handleDayClick}
            />
          )}
        </>
      )}

      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <LocationManager 
            tripId={trip.id} 
            locations={locations} 
            isDeleteMode={isDeleteMode}
            setIsDeleteMode={setIsDeleteMode}
            isAddLocationModalOpen={isAddLocationModalOpen}
            setIsAddLocationModalOpen={setIsAddLocationModalOpen}
          />
        </div>
      )}

      {activeSubTab === 'participants' && (
        <div className="space-y-4">
          <ParticipantManager 
            tripId={trip.id} 
            participants={participants} 
            currentUserRole={participantRole}
            isDeleteMode={isDeleteParticipantsMode}
            setIsDeleteMode={setIsDeleteParticipantsMode}
            isAddParticipantModalOpen={isAddParticipantModalOpen}
            setIsAddParticipantModalOpen={setIsAddParticipantModalOpen}
          />
        </div>
      )}
        </div>
      
      {/* Day Details Modal - works for both mobile and desktop */}
      {isDayDetailsOpen && selectedDayDate && (
        <DayDetailsModal
          isOpen={isDayDetailsOpen}
          onClose={handleDayDetailsClose}
          trip={trip}
          itineraryDays={itineraryDays}
          locations={locations}
          transportation={transportation}
          accommodations={accommodations}
          currentDate={selectedDayDate}
          onUpdateDay={handleDayUpdate}
        />
      )}
    </div>
  );
}