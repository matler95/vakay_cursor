'use client';

import { useState, useRef, useCallback, useEffect, useMemo, startTransition } from 'react';
import { Database } from '@/types/database.types';
import { DayCard } from './DayCard';
import { RangeActionBar } from './RangeActionBar';
import { getDatesInRange } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import { useUndoManager } from './UndoManager';
import { Calendar as CalendarIcon } from 'lucide-react';
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
  saveAction: (formData: FormData) => void; // Add this prop for saving to database
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
  onExitEditMode,
  saveAction
}: CalendarGridProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [hasMoved, setHasMoved] = useState(false);
  const [isClickMode, setIsClickMode] = useState(true);
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [showSaveCancel, setShowSaveCancel] = useState(false); // Track if Save/Cancel should be visible
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
  // Adjust for Monday as first day: 0=Sunday, 1=Monday, 2=Tuesday, etc.
  // We want Monday=0, Tuesday=1, ..., Sunday=6
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const emptyCells = adjustedFirstDay;

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

  // Show Save/Cancel buttons immediately when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setShowSaveCancel(true);
    } else {
      setShowSaveCancel(false);
    }
  }, [isEditing]);

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

  // Range selection handlers
  const handleMouseDown = useCallback((dateStr: string) => {
    if (!isEditing) return;
    
    console.log('=== MOUSE DOWN ===', dateStr);
    setHasMoved(false);
    setSelectionStart(dateStr);
    setIsClickMode(true); // Start in click mode
    setShowSaveCancel(false); // Hide Save/Cancel when starting to select days
  }, [isEditing]);

  const handleMouseEnter = useCallback((dateStr: string) => {
    if (!selectionStart) return;
    
    console.log('=== MOUSE ENTER ===', dateStr, 'hasMoved:', hasMoved, 'isSelecting:', isSelecting, 'isClickMode:', isClickMode);
    
    // If this is the first move, switch to drag mode
    if (!hasMoved) {
      console.log('First move detected - switching to drag mode');
      setHasMoved(true);
      setIsClickMode(false);
      setIsSelecting(true);
      setSelectedRange({ start: selectionStart, end: dateStr });
      
      // Clear individual selections when starting range selection
      setSelectedDates(new Set());
    } else if (isSelecting) {
      // Continue range selection
      console.log('Continuing range selection');
      const startDate = new Date(selectionStart);
      const currentDate = new Date(dateStr);
      
      if (currentDate < startDate) {
        setSelectedRange({ start: dateStr, end: selectionStart });
      } else {
        setSelectedRange({ start: selectionStart, end: dateStr });
      }
    }
  }, [selectionStart, hasMoved, isSelecting]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionStart(null);
    setHasMoved(false);
    setIsClickMode(true); // Reset to click mode
  }, []);

  // Handle mouse move for better drag detection
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!selectionStart || !isEditing) return;
    
    console.log('=== MOUSE MOVE ===', 'selectionStart:', selectionStart, 'hasMoved:', hasMoved, 'isSelecting:', isSelecting);
    
    // Get the element under the mouse
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (!element) return;
    
    // Find the closest day card
    const dayCard = element.closest('[data-date]');
    if (dayCard) {
      const dateStr = dayCard.getAttribute('data-date');
      if (dateStr && dateStr !== selectionStart) {
        console.log('=== MOUSE MOVE OVER DAY ===', dateStr, 'from', selectionStart);
        
        // If this is the first move, switch to drag mode
        if (!hasMoved) {
          console.log('First move detected via mouse move - switching to drag mode');
          setHasMoved(true);
          setIsClickMode(false);
          setIsSelecting(true);
          setSelectedRange({ start: selectionStart, end: dateStr });
          
          // Clear individual selections when starting range selection
          setSelectedDates(new Set());
        } else if (isSelecting) {
          // Continue range selection
          console.log('Continuing range selection via mouse move');
          const startDate = new Date(selectionStart);
          const currentDate = new Date(dateStr);
          
          if (currentDate < startDate) {
            setSelectedRange({ start: dateStr, end: selectionStart });
          } else {
            setSelectedRange({ start: selectionStart, end: dateStr });
          }
        }
      }
    }
  }, [selectionStart, hasMoved, isSelecting, isEditing]);

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

  // Check if a date is in the selected range or individually selected
  const isInSelectedRange = useCallback((dateStr: string) => {
    // Check if date is in range selection
    if (selectedRange) {
      const date = new Date(dateStr);
      const start = new Date(selectedRange.start);
      const end = new Date(selectedRange.end);
      const inRange = date >= start && date <= end;
      console.log(`Date ${dateStr}: Range selection check - inRange: ${inRange}`);
      return inRange;
    }
    
    // Check if date is individually selected
    const isIndividuallySelected = selectedDates.has(dateStr);
    console.log(`Date ${dateStr}: Individual selection check - selected: ${isIndividuallySelected}`);
    return isIndividuallySelected;
  }, [selectedRange, selectedDates]);

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
    setSelectedDates(new Set());
    setIsSelecting(false);
    setHasMoved(false);
    setIsClickMode(true);
    // Show Save/Cancel buttons again when no days are selected (if still in edit mode)
    if (isEditing) {
      setShowSaveCancel(true);
    }
  }, [isEditing]);

  // Handle individual day selection/deselection
  const handleDayClick = useCallback((dateStr: string) => {
    console.log('=== HANDLE DAY CLICK CALLED ===');
    console.log('Date clicked:', dateStr);
    console.log('isEditing:', isEditing);
    console.log('isSelecting:', isSelecting);
    console.log('isClickMode:', isClickMode);
    console.log('Current selectedDates:', Array.from(selectedDates));
    console.log('Current selectedRange:', selectedRange);
    
    if (!isEditing) {
      console.log('Not in edit mode, returning');
      return;
    }
    
    // If we're in range selection mode or not in click mode, don't handle individual clicks
    if (isSelecting || !isClickMode) {
      console.log('In range selection mode or not in click mode, returning');
      return;
    }
    
    console.log('=== HANDLE DAY CLICK ===');
    console.log('Date clicked:', dateStr);
    console.log('Current selectedDates:', Array.from(selectedDates));
    console.log('Is date currently selected?', selectedDates.has(dateStr));
    
    // Hide Save/Cancel buttons when starting to select days
    setShowSaveCancel(false);
    
    // Toggle selection for this specific date
    setSelectedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        // Deselect the day
        console.log('Deselecting day:', dateStr);
        newSet.delete(dateStr);
      } else {
        // Select the day
        console.log('Selecting day:', dateStr);
        newSet.add(dateStr);
      }
      console.log('New selectedDates:', Array.from(newSet));
      return newSet;
    });
    
    // Clear range selection when toggling individual days
    setSelectedRange(null);
  }, [isEditing, isSelecting, isClickMode, selectedDates, selectedRange]);

  // Handle showing Save/Cancel buttons after "Done" is clicked
  const handleShowSaveCancel = useCallback(() => {
    setShowSaveCancel(true);
    // Note: Selection state will be cleared by the RangeActionBar's onClear
  }, []);

  // Handle saving draft changes
  const handleSaveChanges = useCallback(() => {
    console.log('=== SAVE CHANGES STARTED ===');
    console.log('Current draft itinerary size:', draftItinerary.size);
    console.log('Current itineraryDays length:', itineraryDays.length);
    
    // Collect all changed days
    const changedDays: ItineraryDay[] = [];
    
    draftItinerary.forEach((dayData, dateStr) => {
      const originalDay = itineraryDays.find(d => d.date === dateStr);
      if (originalDay && JSON.stringify(originalDay) !== JSON.stringify(dayData)) {
        console.log(`Saving changes for ${dateStr}:`, {
          original: originalDay,
          updated: dayData,
          changes: {
            location_1_id: originalDay.location_1_id !== dayData.location_1_id,
            location_2_id: originalDay.location_2_id !== dayData.location_2_id,
            notes: originalDay.notes !== dayData.notes,
            summary: originalDay.summary !== dayData.summary
          }
        });
        
        // Add to changed days array
        changedDays.push(dayData);
      }
    });
    
    console.log(`=== SAVE COMPLETED ===`);
    console.log(`Total changes: ${changedDays.length}`);
    
    if (changedDays.length > 0) {
      console.log('=== SAVING TO DATABASE ===');
      
      // Create FormData for the save action
      const formData = new FormData();
      formData.append('tripId', trip.id || '');
      formData.append('itineraryDays', JSON.stringify(changedDays));
      
      // Call the save action to persist changes to database
      startTransition(() => {
        saveAction(formData);
      });
      
      console.log('=== CHANGES SENT TO DATABASE ===');
      setHasDraftChanges(false);
      setShowSaveCancel(false); // Close the Save/Cancel window
      onExitEditMode();
    } else {
      console.log('=== NO CHANGES TO SAVE ===');
      setHasDraftChanges(false);
      setShowSaveCancel(false); // Close the Save/Cancel window
      onExitEditMode();
    }
  }, [draftItinerary, itineraryDays, trip.id, saveAction, onExitEditMode]);

  // Handle canceling draft changes
  const handleCancelChanges = useCallback(() => {
    // Reset draft itinerary to original state
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
    setHasDraftChanges(false);
    setSelectedRange(null);
    setHasMoved(false);
    setIsClickMode(true);
    setShowSaveCancel(false); // Hide Save/Cancel when cancelling
    onExitEditMode();
  }, [itineraryDays, onExitEditMode]);

  // Handle bulk location assignment
  const handleBulkLocationAssign = useCallback((locationId: number | null) => {
    // Get dates to update - either from range or individual selection
    let datesToUpdate: string[] = [];
    
    if (selectedRange) {
      const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
      datesToUpdate = rangeDates.map(d => d.toISOString().split('T')[0]);
    } else if (selectedDates.size > 0) {
      datesToUpdate = Array.from(selectedDates);
    }
    
    if (datesToUpdate.length === 0) return;
    
    console.log('=== BULK LOCATION ASSIGN ===');
    console.log('Dates to update:', datesToUpdate);
    console.log('Location ID to assign:', locationId);
    console.log('Current draft itinerary size:', draftItinerary.size);
    
    // Create a new Map instance to ensure React re-renders
    const newDraftItinerary = new Map(draftItinerary);
    
    // Apply changes to draft itinerary
    datesToUpdate.forEach(dateStr => {
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
  }, [selectedRange, selectedDates, draftItinerary, clearSelection, trip.id]);

  // Handle bulk transfer assignment
  const handleBulkTransferAssign = useCallback((fromLocationId: number | null, toLocationId: number | null) => {
    // Get dates to update - either from range or individual selection
    let datesToUpdate: string[] = [];
    
    if (selectedRange) {
      const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
      datesToUpdate = rangeDates.map(d => d.toISOString().split('T')[0]);
    } else if (selectedDates.size > 0) {
      datesToUpdate = Array.from(selectedDates);
    }
    
    if (datesToUpdate.length === 0) return;
    
    // Create a new Map instance to ensure React re-renders
    const newDraftItinerary = new Map(draftItinerary);
    
    // Apply main location to all days
    datesToUpdate.forEach(dateStr => {
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
    if (toLocationId && datesToUpdate.length > 0) {
      const lastDateStr = datesToUpdate[datesToUpdate.length - 1];
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
  }, [selectedRange, selectedDates, draftItinerary, clearSelection, trip.id]);

  // Handle bulk notes
  const handleBulkNotes = useCallback((notes: string) => {
    // Get dates to update - either from range or individual selection
    let datesToUpdate: string[] = [];
    
    if (selectedRange) {
      const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
      datesToUpdate = rangeDates.map(d => d.toISOString().split('T')[0]);
    } else if (selectedDates.size > 0) {
      datesToUpdate = Array.from(selectedDates);
    }
    
    if (datesToUpdate.length === 0) return;
    
    // Create a new Map instance to ensure React re-renders
    const newDraftItinerary = new Map(draftItinerary);
    
    // Apply notes to all days
    datesToUpdate.forEach(dateStr => {
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
  }, [selectedRange, selectedDates, draftItinerary, clearSelection, trip.id]);

  return (
    <div className="space-y-6">
      {/* Calendar Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
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
          className={cn(
            "relative grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200",
            isEditing && "select-none",
            isSelecting && "cursor-crosshair"
          )}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {/* Empty cells for proper alignment */}
          {Array.from({ length: emptyCells }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] sm:min-h-[100px] bg-white"></div>
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
                selectionCount={selectedRange 
                  ? getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end)).length
                  : selectedDates.size
                }
                onSelectDate={() => handleDayClick(dateStr)} // Use handleDayClick for individual selection
                onUpdateDraft={onUpdateDraft}
                onMouseDown={() => handleMouseDown(dateStr)}
                onMouseEnter={() => handleMouseEnter(dateStr)}
                onKeyDown={(e) => handleKeyDown(e, dateStr)}
                isInRange={isSelected}
                isToday={isToday}
                data-date={dateStr}
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

      {/* Save/Cancel buttons when in edit mode - floating above calendar */}
      {showSaveCancel && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[400px]">
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
          
          {/* Instructions moved to floating bar */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-blue-800">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm font-medium">How to edit:</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Click and drag to select date ranges, then use the Range Action Bar to assign locations. Changes are saved as drafts until you click "Save Changes".
            </p>
          </div>
        </div>
      )}

      {/* Range Action Bar */}
      {(selectedRange || selectedDates.size > 0) && !showSaveCancel && (
        <>
          <RangeActionBar
            selectedRange={selectedRange || { start: '', end: '' }}
            locations={locations}
            onAssignLocation={handleBulkLocationAssign}
            onAssignTransfer={handleBulkTransferAssign}
            onClear={clearSelection}
            onDone={handleShowSaveCancel}
            currentLocationId={selectedRange 
              ? draftItinerary.get(selectedRange.start)?.location_1_id ?? null
              : selectedDates.size > 0 
                ? draftItinerary.get(Array.from(selectedDates)[0])?.location_1_id ?? null
                : null
            }
            currentTransferId={selectedRange 
              ? draftItinerary.get(selectedRange.end)?.location_2_id ?? null
              : selectedDates.size > 0 
                ? draftItinerary.get(Array.from(selectedDates)[selectedDates.size - 1])?.location_2_id ?? null
                : null
            }
          />
        </>
      )}
    </div>
  );
}
