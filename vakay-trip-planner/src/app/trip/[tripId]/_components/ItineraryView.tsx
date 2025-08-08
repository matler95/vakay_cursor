// src/app/trip/[tripId]/_components/ItineraryView.tsx
'use client';

import { getDatesInRange } from '@/lib/dateUtils';
import { Database } from '@/types/database.types';
import { DayCard } from './DayCard';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil } from 'lucide-react';
import { BulkActionPanel } from './BulkActionPanel';

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

  useEffect(() => {
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
  }, [itineraryDays]);

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

  const handleCancel = () => {
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
    setSelectedDates(new Set()); // <-- Reset checkboxes on cancel
    setIsEditing(false);
  };
  
  const handleSave = () => {
    // We will build the save logic in a later step!
    console.log("Saving changes...", draftItinerary);
    setSelectedDates(new Set()); // <-- Reset checkboxes on save
    setIsEditing(false);
  };

  if (!trip.start_date || !trip.end_date) {
    return <p>Please set a start and end date for this trip.</p>;
  }

  const tripDates = getDatesInRange(new Date(trip.start_date), new Date(trip.end_date));
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mt-8">
      <div className="flex justify-end items-center gap-2 mb-4">
        {isEditing ? (
          <>
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit Plan</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Plan</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {isEditing && selectedDates.size > 1 && (
        <BulkActionPanel
          selectedCount={selectedDates.size}
          locations={locations}
          onBulkUpdate={handleBulkUpdate}
          onClearSelection={handleClearSelection} // <-- Pass the new function
        />
      )}

      <div className="grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow-md overflow-hidden">
        {weekdays.map((day) => <div key={day} className="bg-white py-2 text-center font-semibold text-gray-600">{day}</div>)}
        {Array.from({ length: tripDates[0].getUTCDay() }).map((_, i) => <div key={`empty-${i}`} className="bg-gray-50 min-h-36"></div>)}

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
    </div>
  );
}