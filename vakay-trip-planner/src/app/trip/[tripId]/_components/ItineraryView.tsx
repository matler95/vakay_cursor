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
import { Pencil, CheckCircle, AlertCircle, X, Calendar, List, MapPin, Settings } from 'lucide-react';
import { BulkActionPanel } from './BulkActionPanel';
import { saveItineraryChanges } from '../actions';
import { useActionState } from 'react';


type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface ItineraryViewProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}


export function ItineraryView({ trip, itineraryDays, locations, isEditing, setIsEditing }: ItineraryViewProps) {
  return (
    <UndoManager>
      <ItineraryViewContent 
        trip={trip}
        itineraryDays={itineraryDays}
        locations={locations}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </UndoManager>
  );
}

// Separate component that can use the undo context
function ItineraryViewContent({ trip, itineraryDays, locations, isEditing, setIsEditing }: ItineraryViewProps) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [state, formAction] = useActionState(saveItineraryChanges, { message: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list'); // Default to list on mobile
  const [showLocationsSidebar, setShowLocationsSidebar] = useState(false);
  const { addAction } = useUndoManager();
  


  useEffect(() => {
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
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
    if (state.message) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 3000); // Show for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [state.message]);

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

  if (!trip.start_date || !trip.end_date) {
    return <p>Please set a start and end date for this trip.</p>;
  }

  const tripDates = getDatesInRange(new Date(trip.start_date), new Date(trip.end_date));


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

  return (
    <div>
      {/* Header with Trip Info and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                  <div className="flex gap-3 ml-auto">
            {/* View Toggle Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                    className="hidden md:flex items-center gap-2"
                  >
                    {viewMode === 'calendar' ? (
                      <>
                        <List className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Switch to {viewMode === 'calendar' ? 'list' : 'calendar'} view</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Locations Sidebar Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowLocationsSidebar(!showLocationsSidebar)}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showLocationsSidebar ? 'Hide' : 'Show'} locations sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Edit Button - always visible */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2"
                  >
                    {isEditing ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Exit Edit
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditing ? 'Exit edit mode' : 'Edit trip plan'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
      </div>
      
      {/* Status message */}
      {state.message && showMessage && (
        <div className={`mb-4 flex items-center justify-between rounded-md p-3 transition-all duration-300 ${
          state.message.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {state.message.includes('successfully') ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{state.message}</span>
          </div>
          <button
            onClick={() => {
              setShowMessage(false);
            }}
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* View Content */}
      <div className="flex">
        <div className="flex-1">
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
        </div>

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
      </div>

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