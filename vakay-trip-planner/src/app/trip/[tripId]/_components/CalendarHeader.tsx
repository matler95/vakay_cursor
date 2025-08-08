'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CalendarHeaderProps {
  tripName: string;
  startDate: Date;
  endDate: Date;
  currentMonth: Date;
  onMonthChange: (newMonth: Date) => void;
}

export function CalendarHeader({ 
  tripName, 
  startDate, 
  endDate, 
  currentMonth, 
  onMonthChange 
}: CalendarHeaderProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatDateRange = () => {
    const start = startDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const end = endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${start} - ${end}`;
  };

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    onMonthChange(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    onMonthChange(newMonth);
  };

  const goToTripRange = () => {
    onMonthChange(startDate);
  };

  return (
    <div className="mb-6">
      {/* Trip Context */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{tripName}</h2>
        <p className="text-sm text-gray-600">{formatDateRange()}</p>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg border p-3 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h3 className="font-semibold text-gray-900">
              {formatMonthYear(currentMonth)}
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToTripRange}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Trip Range
          </Button>
          
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="text-xs h-7"
            >
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="text-xs h-7"
            >
              List
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
