'use client';

import { Database } from '@/types/database.types';
import { PremiumDayCard } from './PremiumDayCard';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';

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
}

export function PremiumCalendarView({
  tripDates,
  draftItinerary,
  locations,
  isEditing,
  selectedDates,
  onSelectDate,
  onUpdateDraft,
}: PremiumCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (tripDates.length === 0) return new Date();
    return new Date(tripDates[0].getFullYear(), tripDates[0].getMonth(), 1);
  });

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
      tripDate.getFullYear() === date.getFullYear()
    );
  };

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

  return (
    <div className="space-y-8">
      {/* Premium Calendar Header */}
      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="h-10 w-10 p-0 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{monthLabel}</h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="h-10 w-10 p-0 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Trip Duration</div>
            <div className="text-lg font-semibold text-gray-900">
              {tripDates.length} day{tripDates.length !== 1 ? 's' : ''}
            </div>
            <div className="text-sm text-gray-500">
              {format(tripDates[0], 'MMM d')} - {format(tripDates[tripDates.length - 1], 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Weekday Headers */}
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center">
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider py-2">
              {day}
            </div>
          </div>
        ))}
      </div>

      {/* Premium Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weeks.flatMap((week, weekIndex) =>
          week.map((date, dayIndex) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayData = draftItinerary.get(dateStr);
            const isInTrip = isTripDay(date);
            
            if (!isInTrip) {
              return (
                <div key={`${weekIndex}-${dayIndex}`} className="min-h-[200px]">
                  {/* Empty space for non-trip days */}
                </div>
              );
            }

            return (
              <div key={dateStr} className="min-h-[160px]">
                <PremiumDayCard
                  date={date}
                  dayData={dayData}
                  locations={locations}
                  isEditing={isEditing}
                  isSelected={selectedDates.has(dateStr)}
                  selectionCount={selectedDates.size}
                  onSelectDate={() => onSelectDate(dateStr)}
                  onUpdateDraft={onUpdateDraft}
                />
              </div>
            );
          })
        )}
      </div>

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
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Quick Tips</div>
            <div className="text-xs text-gray-400">
              {isEditing ? 'Click cards to select • Use bulk actions for multiple days' : 'Click Edit Plan to start organizing your trip'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
