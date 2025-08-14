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
  isToday
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
        "relative min-h-[140px] sm:min-h-[160px] bg-white p-2 sm:p-3 transition-all duration-200 cursor-pointer",
        "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
        isInRange && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
        isToday && "bg-blue-50 border-l-4 border-l-blue-500",
        isSelected && "ring-2 ring-blue-600 bg-blue-100"
      )}
      style={dayStyle}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}
      tabIndex={isEditingCalendar ? 0 : -1}
      role="button"
      aria-label={`Day ${date.getDate()}, ${date.toLocaleDateString('en-US', { weekday: 'long' })}`}
    >
      {/* Selection Checkbox - moved to top left to avoid overlap */}
      {isEditingCalendar && (
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelectDate}
            className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}

      {/* Date Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-1 sm:gap-2">
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
        
        {/* Day of week (mobile only) */}
        <span className="text-xs text-gray-500 md:hidden">
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </span>
      </div>

      {/* Content Area - with proper spacing and overflow handling */}
      <div className="space-y-1.5 sm:space-y-2 min-h-0 flex-1">
        {/* Primary Location */}
        {location1 && (
          <div className="group">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors min-w-0">
              <div 
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: (location1 as Location).color || '#6B7280' }}
              />
              <span className="text-xs sm:text-sm font-medium text-gray-900 truncate min-w-0 flex-1">
                {(location1 as Location).name}
              </span>
            </div>
          </div>
        )}

        {/* Transfer Day - Show both locations with proper spacing */}
        {isTransfer && location1 && location2 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 min-w-0">
              <div 
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: (location1 as Location).color || '#6B7280' }}
              />
              <span className="text-xs text-gray-700 truncate min-w-0 flex-1">
                {(location1 as Location).name}
              </span>
              <div className="flex-shrink-0 flex items-center justify-center px-0.5 sm:px-1">
                <div className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
              <div 
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: (location2 as Location).color || '#6B7280' }}
              />
              <span className="text-xs text-gray-700 truncate min-w-0 flex-1">
                {(location2 as Location).name}
              </span>
            </div>
          </div>
        )}

        {/* Secondary Location (non-transfer) */}
        {!isTransfer && location2 && (
          <div className="group">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors min-w-0">
              <div 
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: (location2 as Location).color || '#6B7280' }}
              />
              <span className="text-xs text-gray-700 truncate min-w-0 flex-1">
                {(location2 as Location).name}
              </span>
            </div>
          </div>
        )}

        {/* Notes - with proper text wrapping */}
        {dayData?.notes && (
          <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-50 border border-yellow-200 min-w-0">
            <p className="text-xs text-yellow-800 break-words leading-relaxed">
              {dayData.notes}
            </p>
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

      {/* Hover Actions */}
      {isEditingCalendar && (
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Open day editor
              }}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Edit day"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}