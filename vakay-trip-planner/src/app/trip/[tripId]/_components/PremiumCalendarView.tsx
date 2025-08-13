'use client';

import { Database } from '@/types/database.types';
import { PremiumDayCard } from './PremiumDayCard';
import { RangeActionBar } from './RangeActionBar';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Edit3, Lightbulb, MapPin, Smartphone, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface PremiumCalendarViewProps {
  tripDates: Date[];
  draftItinerary: Map<string, ItineraryDay>;
  locations: Location[];
  isEditing: boolean;
  selectedDates: Set<string>;
  onSelectDate: (dateStr: string) => void;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
  onToggleDateSelection: () => void;
}

export function PremiumCalendarView({
  tripDates,
  draftItinerary,
  locations,
  isEditing,
  selectedDates,
  onUpdateDraft,
  onToggleDateSelection
}: PremiumCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (tripDates.length === 0) return new Date();
    return new Date(tripDates[0].getFullYear(), tripDates[0].getMonth(), 1);
  });

  // Range selection state
  const [rangeSelection, setRangeSelection] = useState<{
    start: string | null;
    end: string | null;
    isSelecting: boolean;
  }>({
    start: null,
    end: null,
    isSelecting: false,
  });

  // Mobile touch state
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; date: string } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; date: string } | null>(null);
  const [showMobileTips, setShowMobileTips] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Generate calendar grid with proper week boundaries
  const calendarDays = useMemo(() => {
    if (tripDates.length === 0) return [];
    
    const firstDate = tripDates[0];
    const lastDate = tripDates[tripDates.length - 1];
    
    // Start from the beginning of the week containing the first trip date
    const start = startOfWeek(firstDate, { weekStartsOn: 1 }); // Monday start
    // End at the end of the week containing the last trip date
    const end = endOfWeek(lastDate, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start, end });
  }, [tripDates]);

  // Group days by week for proper grid layout
  const weeks = useMemo(() => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    calendarDays.forEach((day, index) => {
      currentWeek.push(day);
      
      if ((index + 1) % 7 === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [calendarDays]);

  const isTripDay = (date: Date) => {
    return tripDates.some(tripDate => 
      tripDate.getDate() === date.getDate() &&
      tripDate.getMonth() === date.getMonth() &&
      tripDate.getFullYear() === tripDate.getFullYear()
    );
  };

  // Range selection helpers
  const getDateString = (date: Date) => date.toISOString().split('T')[0];
  
  const isInRange = (dateStr: string) => {
    if (!rangeSelection.start || !rangeSelection.end) return false;
    const date = new Date(dateStr);
    const start = new Date(rangeSelection.start);
    const end = new Date(rangeSelection.end);
    return date >= start && date <= end;
  };

  const isRangeStart = (dateStr: string) => dateStr === rangeSelection.start;
  const isRangeEnd = (dateStr: string) => dateStr === rangeSelection.end;

  // Handle day selection with range support
  const handleDayClick = useCallback((dateStr: string, event: React.MouseEvent) => {
    if (!isEditing) return;

    if (event.shiftKey && rangeSelection.start) {
      // Shift+click to extend range
      const start = new Date(rangeSelection.start);
      const end = new Date(dateStr);
      
      if (start > end) {
        setRangeSelection({
          start: dateStr,
          end: rangeSelection.start,
          isSelecting: false,
        });
      } else {
        setRangeSelection({
          start: rangeSelection.start,
          end: dateStr,
          isSelecting: false,
        });
      }
    } else {
      // Regular click to start new range
      setRangeSelection({
        start: dateStr,
        end: dateStr,
        isSelecting: false,
      });
    }
  }, [isEditing, rangeSelection.start]);

  // Handle mouse down for drag selection
  const handleMouseDown = useCallback((dateStr: string) => {
    if (!isEditing) return;
    
    setRangeSelection({
      start: dateStr,
      end: dateStr,
      isSelecting: true,
    });
  }, [isEditing]);

  // Handle mouse enter for drag selection
  const handleMouseEnter = useCallback((dateStr: string) => {
    if (!isEditing || !rangeSelection.isSelecting) return;
    
    setRangeSelection(prev => ({
      ...prev,
      end: dateStr,
    }));
  }, [isEditing, rangeSelection.isSelecting]);

  // Handle mouse up to finish drag selection
  const handleMouseUp = useCallback(() => {
    setRangeSelection(prev => ({
      ...prev,
      isSelecting: false,
    }));
  }, []);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent, dateStr: string) => {
    if (!isEditing) return;
    
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      date: dateStr
    });
    setTouchEnd(null);
  }, [isEditing]);

  const handleTouchMove = useCallback((e: React.TouchEvent, dateStr: string) => {
    if (!touchStart || !isEditing) return;
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      date: dateStr
    });
  }, [touchStart, isEditing]);

  const handleTouchEnd = useCallback((e: React.TouchEvent, dateStr: string) => {
    if (!touchStart || !isEditing) return;
    
    const touch = e.changedTouches[0];
    const endTouch = {
      x: touch.clientX,
      y: touch.clientY,
      date: dateStr
    };
    
    // Calculate swipe distance and direction
    const deltaX = endTouch.x - touchStart.x;
    const deltaY = endTouch.y - touchStart.y;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
      // Horizontal swipe for range selection
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          // Swipe right - extend range
          if (rangeSelection.start && !rangeSelection.end) {
            setRangeSelection(prev => ({
              ...prev,
              end: dateStr,
              isSelecting: false
            }));
          }
        } else {
          // Swipe left - start new range
          setRangeSelection({
            start: dateStr,
            end: null,
            isSelecting: false
          });
        }
      }
    } else {
      // Tap - toggle selection
      handleDayClick(dateStr, {} as React.MouseEvent);
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, isEditing, rangeSelection, handleDayClick]);

  // Get selected dates in range
  const getSelectedDatesInRange = useMemo(() => {
    if (!rangeSelection.start || !rangeSelection.end) return [];
    
    const start = new Date(rangeSelection.start);
    const end = new Date(rangeSelection.end);
    const dates: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (isTripDay(d)) {
        dates.push(dateStr);
      }
    }
    
    return dates;
  }, [rangeSelection.start, rangeSelection.end, tripDates]);

  // Detect consecutive blocks with same location
  const getConsecutiveBlockInfo = useCallback((dateStr: string) => {
    const currentDay = draftItinerary.get(dateStr);
    if (!currentDay?.location_1_id) return { isConsecutiveBlock: false, isBlockStart: false, isBlockEnd: false };
    
    const currentDate = new Date(dateStr);
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevDay = draftItinerary.get(prevDateStr);
    
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    const nextDay = draftItinerary.get(nextDateStr);
    
    const hasPrevSameLocation = prevDay?.location_1_id === currentDay.location_1_id;
    const hasNextSameLocation = nextDay?.location_1_id === currentDay.location_1_id;
    
    return {
      isConsecutiveBlock: hasPrevSameLocation || hasNextSameLocation,
      isBlockStart: !hasPrevSameLocation && hasNextSameLocation,
      isBlockEnd: hasPrevSameLocation && !hasNextSameLocation,
    };
  }, [draftItinerary]);

  // Range action handlers
  const handleAssignLocation = useCallback((locationId: number | null) => {
    const dates = getSelectedDatesInRange;
    dates.forEach(dateStr => {
      onUpdateDraft(dateStr, { location_1_id: locationId });
    });
    setRangeSelection({ start: null, end: null, isSelecting: false });
  }, [getSelectedDatesInRange, onUpdateDraft]);

  const handleMarkTransfer = useCallback((originId: number, destinationId: number) => {
    const dates = getSelectedDatesInRange;
    if (dates.length === 1) {
      // Single day: set as transfer day
      onUpdateDraft(dates[0], { 
        location_1_id: originId, 
        location_2_id: destinationId 
      });
    } else {
      // Multiple days: set first day as transfer, rest as destination
      dates.forEach((dateStr, index) => {
        if (index === 0) {
          // First day: transfer day
          onUpdateDraft(dateStr, { 
            location_1_id: originId, 
            location_2_id: destinationId 
          });
        } else {
          // Subsequent days: destination location
          onUpdateDraft(dateStr, { 
            location_1_id: destinationId,
            location_2_id: null
          });
        }
      });
    }
    setRangeSelection({ start: null, end: null, isSelecting: false });
  }, [getSelectedDatesInRange, onUpdateDraft]);

  const handleAddNotes = useCallback(() => {
    // TODO: Implement bulk notes
    setRangeSelection({ start: null, end: null, isSelecting: false });
  }, []);

  const handleClearRange = useCallback(() => {
    const dates = getSelectedDatesInRange;
    dates.forEach(dateStr => {
      onUpdateDraft(dateStr, { location_1_id: null, location_2_id: null, notes: null });
    });
    setRangeSelection({ start: null, end: null, isSelecting: false });
  }, [getSelectedDatesInRange, onUpdateDraft]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthLabel = format(currentMonth, 'MMMM yyyy');

  // Function to go to the previous week
  const goToPreviousWeek = useCallback(() => {
    const newStart = new Date(currentMonth);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentMonth(newStart);
  }, [currentMonth]);

  // Function to go to the next week
  const goToNextWeek = useCallback(() => {
    const newStart = new Date(currentMonth);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentMonth(newStart);
  }, [currentMonth]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show mobile tips on first visit
  useEffect(() => {
    if (isMobile && isEditing) {
      const hasSeenTips = localStorage.getItem('vakay-mobile-tips');
      if (!hasSeenTips) {
        setShowMobileTips(true);
        setTimeout(() => setShowMobileTips(false), 5000);
        localStorage.setItem('vakay-mobile-tips', 'true');
      }
    }
  }, [isMobile, isEditing]);

  return (
    <div className="space-y-6">
      {/* Mobile Tips Banner */}
      {showMobileTips && (
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900">Mobile Tips</h4>
              <p className="text-sm text-blue-700">
                Tap to select, swipe right to extend range, swipe left for new selection
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileTips(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousWeek}
              className="h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextWeek}
              className="h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMM d')} - {format(currentMonth, 'MMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-500">
              Week {Math.ceil((currentMonth.getTime() - new Date(tripDates[0]).getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1}
            </p>
          </div>
        </div>

        {/* Mobile-Optimized Edit Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isEditing && (
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <Hand className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Edit Mode</span>
              <Badge variant="secondary" className="text-xs">
                {isMobile ? 'Touch' : 'Click'} to select
              </Badge>
            </div>
          )}
          
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleDateSelection()}
            className="h-9 px-4"
          >
            {isEditing ? "Done" : "Edit Plan"}
          </Button>
        </div>
      </div>

      {/* Mobile-Optimized Instructions */}
      {isEditing && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Hand className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">
                {isMobile ? 'Touch & Swipe' : 'Click & Drag'} to Select Days
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{isMobile ? 'Tap' : 'Click'} to select individual days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>{isMobile ? 'Swipe right' : 'Shift+click'} to extend selection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{isMobile ? 'Swipe left' : 'Drag'} to select multiple days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Use bulk actions panel below for multiple days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Suggestions Panel - Show when editing and there are gaps */}
      {isEditing && (() => {
        const unassignedDays = tripDates.filter(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dayData = draftItinerary.get(dateStr);
          return !dayData?.location_1_id;
        });
        
        if (unassignedDays.length === 0) return null;
        
        const assignedDays = tripDates.filter(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dayData = draftItinerary.get(dateStr);
          return !!dayData?.location_1_id;
        });
        
        const completionPercentage = Math.round((assignedDays.length / tripDates.length) * 100);
        
        return (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-900">Smart Planning Assistant</h3>
                <p className="text-sm text-blue-700">Let me help you complete your itinerary</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Progress */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-900">Progress</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{completionPercentage}%</div>
                <div className="text-xs text-blue-600">
                  {assignedDays.length} of {tripDates.length} days planned
                </div>
              </div>
              
              {/* Gaps */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-purple-900">Gaps</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-purple-900">{unassignedDays.length}</div>
                <div className="text-xs text-purple-600">
                  {unassignedDays.length === 1 ? 'day' : 'days'} unassigned
                </div>
              </div>
              
              {/* Suggestions */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-900">Tips</span>
                </div>
                <div className="text-sm text-green-700">
                  {unassignedDays.length <= 3 ? 'Almost done! Fill the gaps to complete your trip.' : 
                   `Use ${isMobile ? 'swipe gestures' : 'range selection'} to assign multiple days at once.`}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            {unassignedDays.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span className="text-sm font-medium text-blue-900">Quick Actions:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Find the first unassigned day and suggest it
                      const firstUnassigned = unassignedDays[0];
                      if (firstUnassigned) {
                        const dateStr = firstUnassigned.toISOString().split('T')[0];
                        // This would ideally open a quick assignment modal
                        console.log('Suggest assignment for:', dateStr);
                      }
                    }}
                    className="h-8 px-3 text-xs bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Suggest Next Location
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Premium Weekday Headers */}
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center">
            <div className="text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          </div>
        ))}
      </div>

      {/* Premium Calendar Grid */}
      <div 
        ref={calendarRef}
        className="grid grid-cols-7 gap-2"
        onMouseUp={handleMouseUp}
      >
        {weeks.flatMap((week, weekIndex) =>
          week.map((date, dayIndex) => {
            const dateStr = getDateString(date);
            const dayData = draftItinerary.get(dateStr);
            const isInTrip = isTripDay(date);
            
            if (!isInTrip) {
              return (
                <div key={`${weekIndex}-${dayIndex}`} className="h-[160px] bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                  <span className="text-sm text-gray-400">
                    {format(date, 'MMM d')}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={dateStr}
                className="relative"
                onTouchStart={(e) => handleTouchStart(e, dateStr)}
                onTouchMove={(e) => handleTouchMove(e, dateStr)}
                onTouchEnd={(e) => handleTouchEnd(e, dateStr)}
              >
                <PremiumDayCard
                  date={date}
                  dayData={dayData}
                  locations={locations}
                  isEditing={isEditing}
                  isSelected={selectedDates.has(dateStr)}
                  isInRange={isInRange(dateStr)}
                  rangeStart={isRangeStart(dateStr)}
                  rangeEnd={isRangeEnd(dateStr)}
                  {...getConsecutiveBlockInfo(dateStr)}
                  draftItinerary={draftItinerary}
                  selectionCount={selectedDates.size}
                  onSelectDate={(dateStr, event) => handleDayClick(dateStr, event)}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  onUpdateDraft={onUpdateDraft}
                  isListView={false}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Range Action Bar */}
      {rangeSelection.start && rangeSelection.end && getSelectedDatesInRange.length > 0 && (
        <RangeActionBar
          selectedDates={getSelectedDatesInRange}
          locations={locations}
          draftItinerary={draftItinerary}
          tripDates={tripDates}
          onAssignLocation={handleAssignLocation}
          onMarkTransfer={handleMarkTransfer}
          onAddNotes={handleAddNotes}
          onClearRange={handleClearRange}
          onClose={() => setRangeSelection({ start: null, end: null, isSelecting: false })}
        />
      )}

      {/* Premium Legend */}
      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-500 shadow-sm"></div>
              <span className="font-medium">Today</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
              <span className="font-medium">Planned</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-purple-500 shadow-sm"></div>
              <span className="font-medium">Transfer Day</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-300 shadow-sm"></div>
              <span className="font-medium">Range Selection</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Quick Tips</div>
            <div className="text-xs text-gray-400">
              {isEditing ? 'Shift+click or drag to select ranges • Use bulk actions for multiple days' : 'Click Edit Plan to start organizing your trip'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
