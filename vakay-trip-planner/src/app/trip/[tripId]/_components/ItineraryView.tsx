// src/app/trip/[tripId]/_components/ItineraryView.tsx
'use client';

import { getDatesInRange } from '@/lib/dateUtils';
import { Database } from '@/types/database.types';
import { DayCard } from './DayCard';
import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, CheckCircle, AlertCircle, X } from 'lucide-react';
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
}

export function ItineraryView({ trip, itineraryDays, locations }: ItineraryViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(saveItineraryChanges, { message: '' });
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
  }, [itineraryDays]);

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
  const handleUpdateDraft = (dateStr: string, updatedValues: Partial<ItineraryDay>) => {
    setDraftItinerary(prevDraft => {
      const newDraft = new Map(prevDraft);
      const currentDay = newDraft.get(dateStr) || { 
        date: dateStr, 
        trip_id: trip.id, 
        id: -1, // Temporary ID
        location_1_id: null, location_2_id: null, notes: null, summary: null
      };
      newDraft.set(dateStr, { ...currentDay, ...updatedValues });
      return newDraft;
    });
  };

  const handleBulkUpdate = (updates: Partial<ItineraryDay>) => {
    setDraftItinerary(prevDraft => {
      const newDraft = new Map(prevDraft);
      selectedDates.forEach(dateStr => {
        const currentDay = newDraft.get(dateStr) || {
          date: dateStr, trip_id: trip.id, id: -1,
          location_1_id: null, location_2_id: null, notes: null, summary: null
        };
        newDraft.set(dateStr, { ...currentDay, ...updates });
      });
      return newDraft;
    });
  };

  // --- NEW: Function to clear the selection set ---
  const handleClearSelection = () => {
    setSelectedDates(new Set());
  };

  // Quick action handlers


  const handleCancel = () => {
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
    setSelectedDates(new Set()); // <-- Reset checkboxes on cancel
    setIsEditing(false);
    // Clear any status messages
    setShowMessage(false);
  };
  
  const handleSave = () => {
    // Convert draft itinerary to array format for the server action
    const itineraryDaysArray = Array.from(draftItinerary.values())
      .filter(day => day && day.date) // Filter out invalid entries
      .map(day => ({
        ...day,
        // Ensure we have the correct trip_id
        trip_id: trip.id,
      }));

    // Create form data for the server action
    const formData = new FormData();
    formData.append('tripId', trip.id);
    formData.append('itineraryDays', JSON.stringify(itineraryDaysArray));

    // Use startTransition to properly handle the async action
    startTransition(() => {
      formAction(formData);
      
      // Success - reset the form state
      setSelectedDates(new Set());
      setIsEditing(false);
    });
  };

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
    <div className="mt-8">
      {/* Header with Trip Info and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Itinerary</h2>
          <p className="text-gray-600">Plan your daily activities and locations</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending} className="bg-green-600 hover:bg-green-700">
                {isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Itinerary
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Edit your trip itinerary</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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
      
      {/* Month indicator above weekdays */}
      <div className="w-full flex justify-center mb-4">
        <span className="text-base font-normal text-gray-400">
          {monthLabel}
        </span>
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 rounded-2xl bg-transparent text-sm overflow-hidden">
        {Array.from({ length: emptyCells }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-40"></div>
        ))}
        {tripDates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayData = draftItinerary.get(dateStr);
          return (
            <DayCard
              key={dateStr}
              date={date}
              dayData={dayData}
              locations={locations}
              isEditingCalendar={isEditing}
              isSelected={selectedDates.has(dateStr)}
              selectionCount={selectedDates.size}
              onSelectDate={() => handleSelectDate(dateStr)}
              onUpdateDraft={handleUpdateDraft}
            />
          );
        })}
      </div>

      {/* Fixed info area under calendar */}
      <div style={{ minHeight: 72 }} className="w-full flex flex-col justify-center">
        {isEditing && selectedDates.size > 1 ? (
          <>
            <BulkActionPanel
              selectedCount={selectedDates.size}
              locations={locations}
              onBulkUpdate={handleBulkUpdate}
              onClearSelection={handleClearSelection}
            />
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              ⚠️ <strong>Multiple Days Selected:</strong> Individual editing is disabled for selected days. Use the bulk actions above to edit all selected days at once.
            </div>
          </>
        ) : isEditing ? (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            💡 <strong>Edit Mode:</strong> Edit individual days below, or click on multiple days to use bulk editing.
          </div>
        ) : null}
      </div>
    </div>
  );
}