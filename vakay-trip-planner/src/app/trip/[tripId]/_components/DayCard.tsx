'use client';

import { Database } from '@/types/database.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface DayCardProps {
  date: Date;
  dayData?: ItineraryDay;
  locations: Location[];
  isEditingCalendar: boolean;
  isSelected: boolean;
  selectionCount: number;
  onSelectDate: () => void;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
  isListView?: boolean;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  isInRange?: boolean;
  isToday?: boolean;
  'data-date'?: string;
}

// Add a simple Switch component
function Switch({ checked, onCheckedChange, id, label, disabled }: { checked: boolean, onCheckedChange: (checked: boolean) => void, id?: string, label?: string, disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}> 
      <span className="text-xs">{label}</span>
      <span className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={e => onCheckedChange(e.target.checked)}
          className="sr-only"
        />
        <span
          className={`block w-10 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
        ></span>
        <span
          className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`}
        ></span>
      </span>
    </label>
  );
}

export function DayCard({ 
  date, 
  dayData, 
  locations, 
  isEditingCalendar, 
  isSelected, 
  selectionCount, 
  onSelectDate, 
  onUpdateDraft, 
  isListView = false,
  onMouseDown,
  onMouseEnter,
  onKeyDown,
  isInRange,
  isToday,
  'data-date': dataDate
}: DayCardProps) {
  const locationsMap = new Map(locations.map((loc) => [loc.id, loc]));
  const location1: Location | null = dayData?.location_1_id ? (locationsMap.get(dayData.location_1_id) ?? null) : null;
  const location2: Location | null = dayData?.location_2_id ? (locationsMap.get(dayData.location_2_id) ?? null) : null;
  
  // Debug logging
  const dateStr = date.toISOString().split('T')[0];
  if (date.getDate() <= 5) {
    console.log(`DayCard ${dateStr}:`, {
      dayData,
      location1_id: dayData?.location_1_id,
      location2_id: dayData?.location_2_id,
      location1,
      location2,
      locationsCount: locations.length,
      locationsMapSize: locationsMap.size
    });
  }
  
  // Calculate isTransfer based on current data (for coloring), but keep a local UI state to allow enabling before a value is chosen
  const isTransfer = !!location2;
  const [transferEnabled, setTransferEnabled] = useState<boolean>(!!dayData?.location_2_id);
  useEffect(() => {
    setTransferEnabled(!!dayData?.location_2_id);
  }, [dayData?.location_2_id]);

  // Unified color logic:
  const dayStyle: React.CSSProperties = {};
  let cardBgClass = '';
  const textColor = 'text-gray-900';
  
  // Enhanced styling for range selection and consecutive days
  if (isInRange) {
    cardBgClass = 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50';
  } else if (location1 && isTransfer && location2) {
    // Pastel gradient with opacity
    const color1 = location1.color || '#6B7280';
    const color2 = location2.color || '#6B7280';
    dayStyle.background = `linear-gradient(135deg, ${color1}33 0%, ${color2}33 100%)`;
  } else if (location1) {
    // Pastel solid background with opacity
    const color1 = location1.color || '#6B7280';
    dayStyle.background = `${color1}33`;
  }

  const showEditOptions = isEditingCalendar; // Always show edit options when in edit mode
  const isDisabled = isEditingCalendar && isSelected && selectionCount > 1; // Disable when multi-selected

  return (
    <div
      className={cn(
        "relative min-h-[80px] sm:min-h-[100px] bg-white p-2 sm:p-3 transition-all duration-200 cursor-pointer",
        " hover:outline-2 hover:outline-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
        isInRange && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
        isToday && "bg-blue-50 border-l-4 border-l-blue-500",
        isSelected && "ring-2 ring-blue-600 bg-blue-100",
        isEditingCalendar && "select-none"
      )}
      style={dayStyle}
      onClick={onSelectDate}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}
      tabIndex={isEditingCalendar ? 0 : -1}
      role="button"
      aria-label={`Day ${date.getDate()}, ${date.toLocaleDateString('en-US', { weekday: 'long' })}`}
      data-date={dataDate}
    >
      {/* Selection Checkbox - positioned to avoid covering day number */}
      {isEditingCalendar && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectDate();
            }}
            className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}

      {/* Date Header with Month */}
      <div className="flex items-center gap-1 mb-2 sm:mb-3">
        {/* Month */}
        <span className="text-xs text-gray-500 font-medium">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </span>
        {/* Day Number */}
        <span className={cn(
          "text-base sm:text-lg font-semibold",
          isToday ? "text-blue-600" : "text-gray-900"
        )}>
          {date.getDate()}
        </span>
        {isToday && (
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>

      {/* Content Area - with proper spacing and overflow handling */}
      <div className="space-y-1.5 sm:space-y-2 min-h-0 flex-1">
          {/* Primary Location */}
          {location1 && (
            <div className="mb-2 truncate">
              <span className="text-xs sm:text-sm font-medium text-gray-900">
                {(location1 as Location).name}
              </span>
            </div>
          )}

          {/* Transfer Location */}
          {isTransfer && location1 && location2 && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <span>→</span>
              <span className="truncate">
                {(location2 as Location).name}
              </span>
            </div>
          )}


        {/* Empty State */}
        {!location1 && !location2 && !dayData?.notes && (
          <div className="h-6 sm:h-8 flex items-center justify-center">
            <span className="text-xs text-gray-400 text-center">
              {isEditingCalendar ? "Click to add location" : "No plans"}
            </span>
          </div>
        )}
      </div>

      {/* Hover Actions - removed, using outline instead */}
      {/* The hover effect is now handled by the main div's hover:bg-gray-50 class */}
    </div>
  );
}