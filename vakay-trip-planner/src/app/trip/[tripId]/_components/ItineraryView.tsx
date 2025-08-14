// src/app/trip/[tripId]/_components/ItineraryView.tsx
'use client';

import { getDatesInRange } from '@/lib/dateUtils';
import { Database } from '@/types/database.types';
import { DayCard } from './DayCard';
import { ListView } from './ListView';
import { CalendarGrid } from './CalendarGrid';
import { LocationsSidebar } from './LocationsSidebar';
import { UndoManager, useUndoManager } from './UndoManager';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, CheckCircle, AlertCircle, X, Calendar, List, MapPin, Settings, MapPinPlus, UserRoundPlus } from 'lucide-react';
import { BulkActionPanel } from './BulkActionPanel';
import { LocationManager } from './LocationManager';
import { ParticipantManager, type Participant } from './ParticipantManager';
import { saveItineraryChanges } from '../actions';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface ItineraryViewProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  participants: Participant[];
  participantRole: string | null;
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

type ItinerarySubTab = 'calendar' | 'locations' | 'participants';

export function ItineraryView({ trip, itineraryDays, locations, participants, participantRole, isEditing, setIsEditing }: ItineraryViewProps) {
  return (
    <UndoManager>
      <ItineraryViewContent 
        trip={trip}
        itineraryDays={itineraryDays}
        locations={locations}
        participants={participants}
        participantRole={participantRole}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </UndoManager>
  );
}

// Separate component that can use the undo context
function ItineraryViewContent({ trip, itineraryDays, locations, participants, participantRole, isEditing, setIsEditing }: ItineraryViewProps) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [state, setState] = useState<{ message: string }>({ message: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list'); // Default to list on mobile
  const [showLocationsSidebar, setShowLocationsSidebar] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<ItinerarySubTab>('calendar');
  const { addAction } = useUndoManager();

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

  // Set default view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setViewMode('calendar');
      } else {
        setViewMode('list');
      }
    };

    // Set initial view mode
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleSelectDate = (dateStr: string) => {
    const newSelectedDates = new Set(selectedDates);
    if (newSelectedDates.has(dateStr)) {
      newSelectedDates.delete(dateStr);
    } else {
      newSelectedDates.add(dateStr);
    }
    setSelectedDates(newSelectedDates);
  };

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

  const handleBulkUpdate = useCallback((updates: Partial<ItineraryDay>) => {
    const previousData = new Map<string, ItineraryDay>();
    const selectedDatesArray = Array.from(selectedDates);
    
    // Store previous data for undo
    selectedDatesArray.forEach(dateStr => {
      const existing = draftItinerary.get(dateStr);
      if (existing) {
        previousData.set(dateStr, { ...existing });
      }
    });

    // Apply updates
    setDraftItinerary(prev => {
      const newMap = new Map(prev);
      selectedDatesArray.forEach(dateStr => {
        const existing = newMap.get(dateStr);
        if (existing) {
          newMap.set(dateStr, { ...existing, ...updates });
        } else {
          newMap.set(dateStr, {
            id: 0,
        date: dateStr, 
        trip_id: trip.id, 
            location_1_id: null,
            location_2_id: null,
            notes: '',
            summary: '',
            ...updates
          });
        }
      });
      return newMap;
    });

    // Add undo action for bulk update
    if (previousData.size > 0) {
      const actionDescription = selectedDatesArray.length === 1 
        ? `Updated ${selectedDatesArray.length} day`
        : `Updated ${selectedDatesArray.length} days`;
      
      addAction(
        actionDescription,
        () => {
          setDraftItinerary(prev => {
            const newMap = new Map(prev);
            previousData.forEach((data, dateStr) => {
              newMap.set(dateStr, data);
            });
            return newMap;
          });
        },
        { previousData, updates, selectedDates: selectedDatesArray }
      );
    }

    setSelectedDates(new Set());
  }, [selectedDates, draftItinerary, trip.id, addAction]);

  // --- NEW: Function to clear the selection set ---
  const handleClearSelection = useCallback(() => {
    const previousData = new Map<string, ItineraryDay>();
    const selectedDatesArray = Array.from(selectedDates);
    
    // Store previous data for undo
    selectedDatesArray.forEach(dateStr => {
      const existing = draftItinerary.get(dateStr);
      if (existing) {
        previousData.set(dateStr, { ...existing });
      }
    });

    // Clear selected dates
    setDraftItinerary(prev => {
      const newMap = new Map(prev);
      selectedDatesArray.forEach(dateStr => {
        newMap.set(dateStr, {
          id: 0,
          date: dateStr,
        trip_id: trip.id,
          location_1_id: null,
          location_2_id: null,
          notes: '',
          summary: ''
        });
      });
      return newMap;
    });

    // Add undo action for clear
    if (previousData.size > 0) {
      const actionDescription = selectedDatesArray.length === 1 
        ? `Cleared ${selectedDatesArray.length} day`
        : `Cleared ${selectedDatesArray.length} days`;
      
      addAction(
        actionDescription,
        () => {
          setDraftItinerary(prev => {
            const newMap = new Map(prev);
            previousData.forEach((data, dateStr) => {
              newMap.set(dateStr, data);
            });
            return newMap;
          });
        },
        { previousData, selectedDates: selectedDatesArray }
      );
    }

      setSelectedDates(new Set());
  }, [selectedDates, draftItinerary, trip.id, addAction]);

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
    <div className="space-y-4 sm:space-y-6 pb-8 sm:pb-0">
      {/* Secondary Header - Calendar */}
      <div className="flex justify-between items-center gap-4 mb-3 sm:mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Itinerary
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {isEditing ? 'Edit mode: Select days to assign locations' : 'Plan your daily activities'}
          </p>
        </div>
      </div>

      {/* Sub-tabs for Itinerary sections */}
      <div className="border-b border-gray-200 mb-3 sm:mb-4">
        <nav className="-mb-px flex space-x-4 sm:space-x-6" role="tablist" aria-label="Itinerary sections">
          {[
            { id: 'calendar', name: 'Calendar', icon: Calendar },
            { id: 'locations', name: 'Locations', icon: MapPin },
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
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-tab Content */}
      {activeSubTab === 'calendar' && (
        <>
          {/* Calendar Controls - Edit and View Toggle */}
          <div className="flex justify-end gap-2 sm:gap-3 mb-2">
            {/* Edit Mode Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    {isEditing ? (
                      <>
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Exit Edit</span>
                      </>
                    ) : (
                      <>
                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
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

            {/* View Mode Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  >
                    {viewMode === 'calendar' ? (
                      <>
                        <List className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">List</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Calendar</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to {viewMode === 'calendar' ? 'list' : 'calendar'} view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
      
      {viewMode === 'calendar' ? (
            <CalendarGrid
              trip={trip}
              itineraryDays={itineraryDays}
                  locations={locations}
              isEditing={isEditing}
                  onUpdateDraft={handleUpdateDraft}
              onBulkUpdate={handleBulkUpdate}
              onExitEditMode={() => setIsEditing(false)}
              saveAction={formAction}
                />
      ) : (
        <ListView
          tripDates={tripDates}
          draftItinerary={draftItinerary}
          locations={locations}
          isEditingCalendar={isEditing}
          selectedDates={selectedDates}
          onSelectDate={handleSelectDate}
          onUpdateDraft={handleUpdateDraft}
            />
          )}
        </>
      )}

      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <LocationManager tripId={trip.id} locations={locations} />
        </div>
      )}

      {activeSubTab === 'participants' && (
        <div className="space-y-4">
          <ParticipantManager tripId={trip.id} participants={participants} currentUserRole={participantRole} />
        </div>
      )}

      {/* Locations Sidebar */}
      {showLocationsSidebar && (
        <LocationsSidebar
          locations={locations}
          itineraryDays={itineraryDays}
          tripId={trip.id}
          onLocationSelect={(location) => {
            // Handle location selection - could open day editor or assign to selected dates
            console.log('Location selected:', location);
          }}
          onEditLocation={(location) => {
            // Handle location editing - could open edit modal
            console.log('Edit location:', location);
          }}
          onDeleteLocation={(locationId) => {
            // Handle location deletion
            console.log('Delete location:', locationId);
          }}
          onCreateLocation={() => {
            // Handle location creation - could open add location modal
            console.log('Create location');
          }}
          className="w-80 border-l border-gray-200"
        />
      )}

      {/* Floating Bulk Action Panel */}
      {isEditing && selectedDates.size > 1 && (
        <BulkActionPanel
          selectedCount={selectedDates.size}
          locations={locations}
          onBulkUpdate={handleBulkUpdate}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Undo Manager */}
      <UndoManager />
    </div>
  );
}