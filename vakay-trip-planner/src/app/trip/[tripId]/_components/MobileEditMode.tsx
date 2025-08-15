'use client';

/**
 * MobileEditMode Component
 * 
 * Provides a mobile-optimized split-screen editing experience for trip itineraries.
 * 
 * Features:
 * - Split-screen layout: Calendar (upper half) + Edit controls (bottom half)
 * - Touch-friendly multi-day selection with hold and drag
 * - Visual selection indicators (border/background)
 * - iPhone 13 size reference with no scrolling
 * - Native-like touch interactions
 * - Responsive design for mobile devices
 * 
 * Touch Interactions:
 * - Single tap: Toggle day selection
 * - Long press (400ms) + drag: Select multiple days
 * - Visual feedback with pressed state and selection highlighting
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, RotateCcw } from 'lucide-react';
import { getDatesInRange } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface MobileEditModeProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  onExitEditMode: () => void;
  saveAction: (formData: FormData) => void;
}

interface DateRange {
  start: string;
  end: string;
}

export function MobileEditMode({
  trip,
  itineraryDays,
  locations,
  onExitEditMode,
  saveAction
}: MobileEditModeProps) {
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [isClickMode, setIsClickMode] = useState(true);
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('none');
  const [transferLocation, setTransferLocation] = useState<string>('none');
  const [pressedDate, setPressedDate] = useState<string | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; date: string } | null>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressDelay = 400; // 400ms for long press (more responsive)

  const tripDates = useMemo(() => {
    return getDatesInRange(
      new Date(trip.start_date || new Date()), 
      new Date(trip.end_date || new Date())
    );
  }, [trip.start_date, trip.end_date]);

  // Calculate calendar layout
  const calendarLayout = useMemo(() => {
    if (tripDates.length === 0) return { emptyCellsBefore: 0, emptyCellsAfter: 0 };
    
    const firstDay = tripDates[0].getUTCDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const emptyCellsBefore = adjustedFirstDay;
    
    const lastTripDate = tripDates[tripDates.length - 1];
    const lastDayOfWeek = lastTripDate.getUTCDay();
    const adjustedLastDay = lastDayOfWeek === 0 ? 6 : lastDayOfWeek - 1;
    const emptyCellsAfter = 6 - adjustedLastDay;
    
    return { emptyCellsBefore, emptyCellsAfter };
  }, [tripDates]);

  const { emptyCellsBefore, emptyCellsAfter } = calendarLayout;

  // Initialize draft itinerary
  useEffect(() => {
    if (tripDates.length === 0) return;
    
    const initialMap = new Map();
    
    tripDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const existingDay = itineraryDays.find(day => day.date === dateStr);
      
      if (existingDay) {
        initialMap.set(dateStr, existingDay);
      } else {
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

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, dateStr: string) => {
    e.preventDefault();
    const touch = e.touches[0];
    
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, date: dateStr };
    setPressedDate(dateStr);
    
    // Start long press timer
    touchTimeoutRef.current = setTimeout(() => {
      if (touchStartRef.current) {
        setIsClickMode(false);
        setIsSelecting(true);
        setSelectionStart(dateStr);
        setHasMoved(false);
        setSelectedRange({ start: dateStr, end: dateStr });
        setSelectedDates(new Set([dateStr]));
        
        // Add haptic feedback simulation for better mobile experience
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, longPressDelay);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current || !isSelecting) return;
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element) {
      const dayCard = element.closest('[data-date]');
      if (dayCard) {
        const dateStr = dayCard.getAttribute('data-date');
        if (dateStr && dateStr !== selectionStart) {
          if (!hasMoved) {
            setHasMoved(true);
            setIsClickMode(false);
          }
          
          const startDate = new Date(selectionStart!);
          const currentDate = new Date(dateStr);
          
          if (currentDate < startDate) {
            setSelectedRange({ start: dateStr, end: selectionStart! });
          } else {
            setSelectedRange({ start: selectionStart!, end: dateStr });
          }
        }
      }
    }
  }, [isSelecting, selectionStart, hasMoved]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    // Clear long press timer
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    
    if (touchStartRef.current && !hasMoved && isClickMode) {
      // Single tap - toggle selection
      const dateStr = touchStartRef.current.date;
      setSelectedDates(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dateStr)) {
          newSet.delete(dateStr);
        } else {
          newSet.add(dateStr);
        }
        return newSet;
      });
      setSelectedRange(null);
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
    setHasMoved(false);
    setPressedDate(null);
    touchStartRef.current = null;
  }, [hasMoved, isClickMode]);

  // Check if a date is selected
  const isDateSelected = useCallback((dateStr: string) => {
    if (selectedRange) {
      const date = new Date(dateStr);
      const start = new Date(selectedRange.start);
      const end = new Date(selectedRange.end);
      return date >= start && date <= end;
    }
    return selectedDates.has(dateStr);
  }, [selectedRange, selectedDates]);

  // Auto-fill selectors with existing data when selection changes
  useEffect(() => {
    if (selectedRange) {
      // For range selection, check if all days have the same location
      const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
      const dateStrs = rangeDates.map(d => d.toISOString().split('T')[0]);
      
      // Check if all selected days have the same location_1_id
      const locationIds = dateStrs.map(dateStr => {
        const dayData = draftItinerary.get(dateStr);
        return dayData?.location_1_id;
      });
      
      const allSameLocation = locationIds.every(id => id === locationIds[0]) && locationIds[0] !== null;
      
      if (allSameLocation) {
        setSelectedLocation(locationIds[0]!.toString());
      } else {
        setSelectedLocation('none');
      }
      
      // For transfer, check the last day
      const lastDateStr = dateStrs[dateStrs.length - 1];
      const lastDayData = draftItinerary.get(lastDateStr);
      if (lastDayData?.location_2_id) {
        setTransferLocation(lastDayData.location_2_id.toString());
      } else {
        setTransferLocation('none');
      }
    } else if (selectedDates.size === 1) {
      // For single day selection, use that day's data
      const dateStr = Array.from(selectedDates)[0];
      const dayData = draftItinerary.get(dateStr);
      
      if (dayData?.location_1_id) {
        setSelectedLocation(dayData.location_1_id.toString());
      } else {
        setSelectedLocation('none');
      }
      
      if (dayData?.location_2_id) {
        setTransferLocation(dayData.location_2_id.toString());
      } else {
        setTransferLocation('none');
      }
    } else if (selectedDates.size === 0 && !selectedRange) {
      // Clear selection - reset selectors
      setSelectedLocation('none');
      setTransferLocation('none');
    }
  }, [selectedRange, selectedDates, draftItinerary]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRange(null);
    setSelectedDates(new Set());
    setIsSelecting(false);
    setHasMoved(false);
    setIsClickMode(true);
    setSelectedLocation('none');
    setTransferLocation('none');
  }, []);

  // Handle location assignment
  const handleAssignLocation = useCallback(() => {
    const locationId = selectedLocation && selectedLocation !== 'none' ? parseInt(selectedLocation) : null;
    const transferId = transferLocation && transferLocation !== 'none' ? parseInt(transferLocation) : null;
    
    let datesToUpdate: string[] = [];
    
    if (selectedRange) {
      const rangeDates = getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end));
      datesToUpdate = rangeDates.map(d => d.toISOString().split('T')[0]);
    } else if (selectedDates.size > 0) {
      datesToUpdate = Array.from(selectedDates);
    }
    
    if (datesToUpdate.length === 0) return;
    
    const newDraftItinerary = new Map(draftItinerary);
    
    datesToUpdate.forEach(dateStr => {
      const existing = newDraftItinerary.get(dateStr);
      const updatedDay: ItineraryDay = {
        ...existing,
        id: existing?.id || 0,
        date: dateStr,
        location_1_id: locationId,
        location_2_id: existing?.location_2_id || null, // Preserve existing transfer unless explicitly set
        notes: existing?.notes || null,
        summary: existing?.summary || null,
        trip_id: existing?.trip_id || trip.id || '',
      };
      newDraftItinerary.set(dateStr, updatedDay);
    });
    
    // Apply transfer to last day if specified
    if (transferId && datesToUpdate.length > 0) {
      const lastDateStr = datesToUpdate[datesToUpdate.length - 1];
      const lastDay = newDraftItinerary.get(lastDateStr);
      if (lastDay) {
        lastDay.location_2_id = transferId;
        newDraftItinerary.set(lastDateStr, lastDay);
      }
    }
    
    setDraftItinerary(newDraftItinerary);
    setHasDraftChanges(true);
    clearSelection();
  }, [selectedRange, selectedDates, draftItinerary, selectedLocation, transferLocation, clearSelection, trip.id]);

  // Handle save
  const handleSave = useCallback(() => {
    const changedDays: ItineraryDay[] = [];
    
    draftItinerary.forEach((dayData, dateStr) => {
      const originalDay = itineraryDays.find(d => d.date === dateStr);
      if (originalDay && JSON.stringify(originalDay) !== JSON.stringify(dayData)) {
        changedDays.push(dayData);
      }
    });
    
    if (changedDays.length > 0) {
      const formData = new FormData();
      formData.append('tripId', trip.id || '');
      formData.append('itineraryDays', JSON.stringify(changedDays));
      
      saveAction(formData);
      setHasDraftChanges(false);
      onExitEditMode();
    } else {
      onExitEditMode();
    }
  }, [draftItinerary, itineraryDays, trip.id, saveAction, onExitEditMode]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setDraftItinerary(new Map(itineraryDays.map(day => [day.date, day])));
    setHasDraftChanges(false);
    clearSelection();
    onExitEditMode();
  }, [itineraryDays, clearSelection, onExitEditMode]);

  const selectionCount = selectedRange 
    ? getDatesInRange(new Date(selectedRange.start), new Date(selectedRange.end)).length
    : selectedDates.size;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Button
            onClick={onExitEditMode}
            variant="ghost"
            size="sm"
            className="p-1.5"
          >
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Itinerary</h2>
            <p className="text-xs text-gray-600">
              {selectionCount > 0 ? `${selectionCount} day${selectionCount > 1 ? 's' : ''} selected` : 'Select days to edit'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-1.5">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 h-8 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasDraftChanges}
            size="sm"
            className="flex items-center gap-1.5 h-8 px-2 text-xs bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            <Save className="h-3 w-3" />
            Save
          </Button>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex-1 flex flex-col">
        {/* Upper Half - Calendar */}
        <div className="flex-1 p-2 pb-1">
          <div className="h-full">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div 
              ref={calendarRef}
              className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden border border-gray-200 flex-1 touch-pan-y"
            >
              {/* Empty cells before */}
              {Array.from({ length: emptyCellsBefore }).map((_, i) => (
                <div key={`empty-before-${i}`} className="min-h-[65px] bg-gray-50 border border-gray-100"></div>
              ))}

              {/* Day cards */}
              {tripDates.map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayData = draftItinerary.get(dateStr);
                const isSelected = isDateSelected(dateStr);
                const isToday = date.toDateString() === new Date().toDateString();
                const isPressed = pressedDate === dateStr;
                
                const location1 = locations.find(loc => loc.id === dayData?.location_1_id);
                const location2 = locations.find(loc => loc.id === dayData?.location_2_id);
                
                return (
                  <div
                    key={dateStr}
                    data-date={dateStr}
                    className={cn(
                      "relative min-h-[65px] bg-white border border-gray-100 p-1.5 cursor-pointer select-none",
                      "touch-manipulation transition-all duration-150",
                      isSelected && "ring-2 ring-blue-500 bg-blue-50",
                      isToday && "ring-2 ring-green-500",
                      isPressed && "scale-95 bg-gray-100",
                      isSelecting && "cursor-grabbing"
                    )}
                    onTouchStart={(e) => handleTouchStart(e, dateStr)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* Date */}
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {date.getDate()}
                    </div>
                    
                    {/* Location indicators */}
                    {location1 && (
                      <div className="flex items-center gap-1 mb-1">
                        <div 
                          className="w-2.5 h-2.5 rounded-full border border-gray-300"
                          style={{ backgroundColor: location1.color || '#6B7280' }}
                        />
                        <span className="text-xs text-gray-600 truncate">
                          {location1.name}
                        </span>
                      </div>
                    )}
                    
                    {location2 && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2.5 h-2.5 rounded-full border border-gray-300"
                          style={{ backgroundColor: location2.color || '#6B7280' }}
                        />
                        <span className="text-xs text-gray-500 truncate">
                          {location2.name} (transfer)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty cells after */}
              {Array.from({ length: emptyCellsAfter }).map((_, i) => (
                <div key={`empty-after-${i}`} className="min-h-[65px] bg-gray-50 border border-gray-100"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Half - Edit Controls */}
        <div className="h-1/2 p-2 pt-1 bg-gray-50 border-t border-gray-200">
          {selectionCount > 0 ? (
            <div className="space-y-3 h-full">
              {/* Selection info */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-2.5 py-1.5 rounded-full">
                  <span className="text-xs font-medium">
                    {selectionCount} day{selectionCount > 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>

              {/* Location selector */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Assign Location
                  </label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          <div className="flex items-center gap-3 py-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: location.color || '#6B7280' }}
                            />
                            <span className="text-xs">{location.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transfer location */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                    Transfer Location (optional)
                  </label>
                  <Select value={transferLocation} onValueChange={setTransferLocation}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select transfer location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No transfer</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          <div className="flex items-center gap-3 py-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300" 
                              style={{ backgroundColor: location.color || '#6B7280' }}
                            />
                            <span className="text-xs">{location.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign button */}
                <Button
                  onClick={handleAssignLocation}
                  disabled={selectedLocation === 'none'}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-xs"
                >
                  Assign to Selected Days
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-center text-xs text-gray-500 mt-auto">
                <p>Tap days to select, or hold and drag to select multiple</p>
                <p className="mt-1 text-gray-400">Use two fingers to scroll if needed</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div className="text-gray-500">
                <p className="text-base font-medium mb-1.5">Select Days to Edit</p>
                <p className="text-xs">Tap individual days or hold and drag to select multiple days</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
