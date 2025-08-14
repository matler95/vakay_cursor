'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Database } from '@/types/database.types';
import { DayCard } from './DayCard';
import { RangeActionBar } from './RangeActionBar';
import { getDatesInRange } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { useUndoManager } from './UndoManager';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface CalendarGridProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  isEditing: boolean;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
  onBulkUpdate: (updates: Partial<ItineraryDay>) => void;
  onExitEditMode: () => void;
}

interface DateRange {
  start: string;
  end: string;
}

export function CalendarGrid({ 
  trip, 
  itineraryDays, 
  locations, 
  isEditing, 
  onUpdateDraft, 
  onBulkUpdate,
  onExitEditMode
}: CalendarGridProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const { addAction } = useUndoManager();

  const tripDates = useMemo(() => 
    getDatesInRange(
      new Date(trip.start_date || new Date()), 
      new Date(trip.end_date || new Date())
    ), [trip.start_date, trip.end_date]
  );
   
  // Calculate calendar layout
  const firstDay = tripDates[0].getUTCDay();
  const emptyCells = (firstDay + 6) % 7;

  // Initialize draft itinerary from props
  useEffect(() => {
    // Create a map with all trip dates, using existing data or creating empty entries
    const initialMap = new Map();
    
    tripDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const existingDay = itineraryDays.find(day => day.date === dateStr);
      
      if (existingDay) {
        initialMap.set(dateStr, existingDay);
      } else {
        // Create empty entry for dates without existing data
        initialMap.set(dateStr, {
          id: 0,
          date: dateStr,
          location_1_id: null,
          location_2_id: null,
          notes: null,
          summary: null,
          trip_id: trip.id || '',
        });
      }
    });
    
    setDraftItinerary(initialMap);
  }, [itineraryDays, tripDates, trip.id]);

  // Debug effect to track draft itinerary changes
  useEffect(() => {
    console.log('=== DRAFT ITINERARY CHANGED ===');
    console.log('New draft itinerary size:', draftItinerary.size);
    console.log('Sample draft data:', Array.from(draftItinerary.entries()).slice(0, 3));
  }, [draftItinerary]);

  // Debug effect to track editing state
  useEffect(() => {
    console.log('=== EDITING STATE CHANGED ===');
    console.log('isEditing:', isEditing);
    console.log('hasDraftChanges:', hasDraftChanges);
    console.log('selectedRange:', selectedRange);
  }, [isEditing, hasDraftChanges, selectedRange]);

  // Debug locations data
  useEffect(() => {
    console.log('=== LOCATIONS DATA ===');
    console.log('Locations count:', locations.length);
    console.log('Sample locations:', locations.slice(0, 3));
    console.log('Locations with colors:', locations.filter(loc => loc.color).slice(0, 3));
  }, [locations]);

  // Get month labels
  const monthLabel = useMemo(() => {
    const monthYearSet = Array.from(new Set(tripDates.map(d => `${d.getUTCMonth()}-${d.getUTCFullYear()}`)))
      .map(key => {
        const [month, year] = key.split('-');
        return { month: Number(month), year: Number(year) };
      });

    if (monthYearSet.length === 1) {
      return tripDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (monthYearSet.length === 2) {
      const [a, b] = monthYearSet;
      if (a.year === b.year) {
        return `${new Date(a.year, a.month).toLocaleString('en-US', { month: 'long' })} – ${new Date(b.year, b.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
      } else {
        return `${new Date(a.year, a.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })} – ${new Date(b.year, b.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
      }
    }
    return '';
  }, [tripDates]);

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Range selection handlers
  const handleMouseDown = useCallback((dateStr: string) => {
    if (!isEditing) return;
    
    setIsSelecting(true);
    setSelectionStart(dateStr);
    setSelectedRange({ start: dateStr, end: dateStr });
  }, [isEditing]);

  const handleMouseEnter = useCallback((dateStr: string) => {
    if (!isSelecting || !selectionStart) return;
    
    const startDate = new Date(selectionStart!);
    const currentDate = new Date(dateStr);
    
    if (currentDate < startDate) {
      setSelectedRange({ start: dateStr, end: selectionStart! });
    } else {
      setSelectedRange({ start: selectionStart!, end: dateStr });
    }
  }, [isSelecting, selectionStart]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionStart(null);
  }, []);

  // Keyboard range selection
  const handleKeyDown = useCallback((e: React.KeyboardEvent, dateStr: string) => {
    if (!isEditing) return;
    
    if (e.key === 'Shift' && e.shiftKey) {
      if (!selectedRange) {
        setSelectedRange({ start: dateStr, end: dateStr });
      } else {
        const startDate = new Date(selectedRange.start);
        const currentDate = new Date(dateStr);
        
        if (currentDate < startDate) {
          setSelectedRange({ start: dateStr, end: selectedRange.start });
        } else {
          setSelectedRange({ start: selectedRange.start, end: dateStr });
        }
      }
    }
  }, [isEditing, selectedRange]);

  // Check if a date is in the selected range
  const isInSelectedRange = useCallback((dateStr: string) => {
    if (!selectedRange) return false;
    
    const date = new Date(dateStr);
    const start = new Date(selectedRange.start);
    const end = new Date(selectedRange.end);
    
    return date >= start && date <= end;
  }, [selectedRange]);

  // Get consecutive day groups for visual grouping
  const consecutiveGroups = useMemo(() => {
    const groups: Array<{ start: string; end: string; locationId: number | null }> = [];
    let currentGroup: { start: string; end: string; locationId: number | null } | null = null;

    tripDates.forEach((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayData = draftItinerary.get(dateStr);
      const locationId = dayData?.location_1_id ?? null;

      if (currentGroup && currentGroup.locationId === locationId) {
        // Extend current group
        currentGroup.end = dateStr;
      } else {
        // Start new group
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = { start: dateStr, end: dateStr, locationId };
      }
    });

    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  }, [tripDates, draftItinerary]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRange(null);
  }, []);

  // Handle saving draft changes
  const handleSaveChanges = useCallback(() => {
    // Apply all draft changes to the database
    draftItinerary.forEach((dayData, dateStr) => {
      const originalDay = itineraryDays.find(d => d.date === dateStr);
      if (originalDay && JSON.stringify(originalDay) !== JSON.stringify(dayData)) {
        onUpdateDraft(dateStr, dayData);
      }
    });
    setHasDraftChanges(false);
    onExitEditMode();
  }, [draftItinerary, itineraryDays, onUpdateDraft, onExitEditMode]);

  // Handle canceling draft changes
  const handleCancelChanges = useCallback(() => {
    // Reset draft itinerary to original state
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
    setHasDraftChanges(false);
    setSelectedRange(null);
    onExitEditMode();
  }, [itineraryDays, onExitEditMode]);

  // Handle bulk location assignment
  const handleBulkLocationAssign = useCallback((locationId: number | null) => {
    if (!selectedRange) return;
    
    console.log('=== BULK LOCATION ASSIGN ===');
    console.log('Selected range:', selectedRange);
    console.log('Location ID to assign:', locationId);
    console.log('Current draft itinerary size:', draftItinerary.size);
    
    const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
    console.log('Range dates:', rangeDates.map(d => d.toISOString().split('T')[0]));
    
    // Create a new Map instance to ensure React re-renders
    const newDraftItinerary = new Map(draftItinerary);
    
    // Apply changes to draft itinerary
    rangeDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const existing = newDraftItinerary.get(dateStr);
      
      const updatedDay: ItineraryDay = {
        ...existing, // Spread existing properties first
        id: existing?.id || 0,
        date: dateStr,
        location_1_id: locationId,
        location_2_id: null, // Clear any existing transfer
        notes: existing?.notes || null,
        summary: existing?.summary || null,
        trip_id: existing?.trip_id || trip.id || '',
      };
      
      console.log(`Updating day ${dateStr}:`, {
        from: existing?.location_1_id,
        to: locationId,
        updatedDay
      });
      
      newDraftItinerary.set(dateStr, updatedDay);
    });
    
    console.log('New draft itinerary size:', newDraftItinerary.size);
    console.log('Sample updated days:', Array.from(newDraftItinerary.entries()).slice(0, 3));
    
    setDraftItinerary(newDraftItinerary);
    setHasDraftChanges(true);
    
    // Delay clearing selection to ensure state update is processed
    setTimeout(() => {
      clearSelection();
    }, 100);
  }, [selectedRange, draftItinerary, clearSelection, trip.id]);

  // Handle bulk transfer assignment
  const handleBulkTransferAssign = useCallback((fromLocationId: number | null, toLocationId: number | null) => {
    if (!selectedRange) return;
    
    const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
    
    // Create a new Map instance to ensure React re-renders
    const newDraftItinerary = new Map(draftItinerary);
    
    // Apply main location to all days
    rangeDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const existing = newDraftItinerary.get(dateStr);
      const updatedDay: ItineraryDay = {
        ...existing, // Spread existing properties first
        id: existing?.id || 0,
        date: dateStr,
        location_1_id: fromLocationId,
        location_2_id: existing?.location_2_id || null,
        notes: existing?.notes || null,
        summary: existing?.summary || null,
        trip_id: existing?.trip_id || trip.id || '',
      };
      newDraftItinerary.set(dateStr, updatedDay);
    });
    
    // Apply transfer to last day only
    if (toLocationId && rangeDates.length > 0) {
      const lastDateStr = rangeDates[rangeDates.length - 1].toISOString().split('T')[0];
      const lastDay = newDraftItinerary.get(lastDateStr);
      if (lastDay) {
        lastDay.location_2_id = toLocationId;
        newDraftItinerary.set(lastDateStr, lastDay);
      }
    }
    
    setDraftItinerary(newDraftItinerary);
    setHasDraftChanges(true);
    
    // Delay clearing selection to ensure state update is processed
    setTimeout(() => {
      clearSelection();
    }, 100);
  }, [selectedRange, draftItinerary, clearSelection, trip.id]);

  // Handle bulk notes
  const handleBulkNotes = useCallback((notes: string) => {
    if (!selectedRange) return;
    
    const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
    
    // Create a new Map instance to ensure React re-renders
    const newDraftItinerary = new Map(draftItinerary);
    
    // Apply notes to all days
    rangeDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const existing = newDraftItinerary.get(dateStr);
      const updatedDay: ItineraryDay = {
        ...existing, // Spread existing properties first
        id: existing?.id || 0,
        date: dateStr,
        location_1_id: existing?.location_1_id || null,
        location_2_id: existing?.location_2_id || null,
        notes: notes,
        summary: existing?.summary || null,
        trip_id: existing?.trip_id || trip.id || '',
      };
      newDraftItinerary.set(dateStr, updatedDay);
    });
    
    setDraftItinerary(newDraftItinerary);
    setHasDraftChanges(true);
    
    // Delay clearing selection to ensure state update is processed
    setTimeout(() => {
      clearSelection();
    }, 100);
  }, [selectedRange, draftItinerary, clearSelection, trip.id]);

  return (
    <div className="space-y-6">
      {/* Save/Cancel buttons when in edit mode - floating above calendar */}
      {isEditing && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">
                {hasDraftChanges ? 'You have unsaved changes' : 'Edit mode active'}
              </span>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleCancelChanges}
                variant="outline"
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveChanges}
                disabled={!hasDraftChanges}
                className="px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Calendar Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          {/* Left side - Month/Year and Today button */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <h1 className="text-2xl font-semibold text-gray-900">
                {monthLabel}
              </h1>
              
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Today
            </button>
          </div>

          {/* Right side - Calendar icon and view options */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              <span>Itinerary Calendar</span>
            </div>
            
            {/* Debug: Show editing state */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isEditing 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isEditing ? 'Edit Mode' : 'View Mode'}
            </div>
          </div>
        </div>

        {/* Help message when not in edit mode */}
        {!isEditing && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">How to use the calendar:</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Click the edit button (pencil icon) above to enable edit mode. Then you can select date ranges and assign locations to your trip days.
            </p>
          </div>
        )}

        {/* Help message when in edit mode */}
        {isEditing && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Edit Mode Active:</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Click and drag to select date ranges, then use the Range Action Bar to assign locations. Changes are saved as drafts until you click "Save Changes".
            </p>
          </div>
        )}

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div 
          ref={calendarRef}
          className="relative grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Empty cells for proper alignment */}
          {Array.from({ length: emptyCells }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[140px] sm:min-h-[160px] bg-white"></div>
          ))}

          {/* Consecutive day grouping overlay */}
          {consecutiveGroups.map((group, index) => {
            if (!group.locationId || group.start === group.end) return null;
            
            const startIndex = tripDates.findIndex(d => d.toISOString().split('T')[0] === group.start) + emptyCells;
            const endIndex = tripDates.findIndex(d => d.toISOString().split('T')[0] === group.end) + emptyCells;
            const span = endIndex - startIndex + 1;
            
            return (
              <div
                key={`group-${index}`}
                className="absolute pointer-events-none z-10"
                style={{
                  left: `${(startIndex % 7) * (100 / 7)}%`,
                  top: `${Math.floor(startIndex / 7) * 100}%`,
                  width: `${span * (100 / 7)}%`,
                  height: '100%',
                }}
              >
                <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 border-r-2 border-blue-200 opacity-80"></div>
              </div>
            );
          })}

          {/* Day cards */}
          {tripDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayData = draftItinerary.get(dateStr);
            const isSelected = isInSelectedRange(dateStr);
            const isToday = date.toDateString() === new Date().toDateString();
            
            // Debug first few days
            if (date.getDate() <= 5) {
              console.log(`Rendering DayCard for ${dateStr}:`, {
                dayData,
                hasLocation1: !!dayData?.location_1_id,
                hasLocation2: !!dayData?.location_2_id,
                location1Id: dayData?.location_1_id,
                location2Id: dayData?.location_2_id,
                foundLocation1: locations.find(loc => loc.id === dayData?.location_1_id),
                foundLocation2: locations.find(loc => loc.id === dayData?.location_2_id)
              });
            }
            
            return (
              <DayCard
                key={dateStr}
                date={date}
                dayData={dayData}
                locations={locations}
                isEditingCalendar={isEditing}
                isSelected={isSelected}
                selectionCount={selectedRange ? 1 : 0}
                onSelectDate={() => {}} // Not used in grid view
                onUpdateDraft={onUpdateDraft}
                onMouseDown={() => handleMouseDown(dateStr)}
                onMouseEnter={() => handleMouseEnter(dateStr)}
                onKeyDown={(e) => handleKeyDown(e, dateStr)}
                isInRange={isSelected}
                isToday={isToday}
              />
            );
          })}

          {/* Range selection indicator */}
          {selectedRange && (
            <div className="absolute pointer-events-none z-20">
              <div className="bg-blue-500 bg-opacity-20 border-2 border-blue-500 rounded-lg"></div>
            </div>
          )}
        </div>
      </div>

      {/* Range Action Bar */}
      {selectedRange && (
        <>
          <RangeActionBar
            selectedRange={selectedRange}
            locations={locations}
            onAssignLocation={handleBulkLocationAssign}
            onAssignTransfer={handleBulkTransferAssign}
            onClear={clearSelection}
            currentLocationId={draftItinerary.get(selectedRange.start)?.location_1_id ?? null}
            currentTransferId={draftItinerary.get(selectedRange.end)?.location_2_id ?? null}
          />
        </>
      )}
    </div>
  );
}
