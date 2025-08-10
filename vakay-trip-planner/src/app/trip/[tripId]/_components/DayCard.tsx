'use client';

import { Database } from '@/types/database.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface DayCardProps {
  date: Date;
  dayData: ItineraryDay | undefined;
  locations: Location[];
  isEditingCalendar: boolean;
  isSelected: boolean;
  selectionCount: number;
  onSelectDate: () => void;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
  isListView?: boolean;
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

export function DayCard({ date, dayData, locations, isEditingCalendar, isSelected, selectionCount, onSelectDate, onUpdateDraft, isListView = false }: DayCardProps) {
  const locationsMap = new Map(locations.map((loc) => [loc.id, loc]));
  const location1 = dayData?.location_1_id ? (locationsMap.get(dayData.location_1_id) ?? null) : null;
  const location2 = dayData?.location_2_id ? (locationsMap.get(dayData.location_2_id) ?? null) : null;
  
  // Calculate isTransfer based on current data (for coloring), but keep a local UI state to allow enabling before a value is chosen
  const isTransfer = !!location2;
  const [transferEnabled, setTransferEnabled] = useState<boolean>(!!dayData?.location_2_id);
  useEffect(() => {
    setTransferEnabled(!!dayData?.location_2_id);
  }, [dayData?.location_2_id]);

  // Unified color logic:
  const dayStyle: React.CSSProperties = {};
  const cardBgClass = '';
  const textColor = 'text-gray-900';
  if (location1 && isTransfer && location2) {
    // Pastel gradient with opacity
    dayStyle.background = `linear-gradient(135deg, ${location1.color}33 0%, ${location2.color}33 100%)`;
  } else if (location1) {
    // Pastel solid background with opacity
    dayStyle.background = `${location1.color}33`;
  }

  const dateStr = date.toISOString().split('T')[0];
  const showEditOptions = isEditingCalendar; // Always show edit options when in edit mode
  const isDisabled = isEditingCalendar && isSelected && selectionCount > 1; // Disable when multi-selected

  return (
    <div
      className={`relative flex flex-col ${isListView ? 'p-3 sm:p-4 min-h-0' : 'p-2 sm:p-3 min-h-32 sm:min-h-40'} rounded-lg sm:rounded-xl transition-all duration-200 shadow-none border border-gray-100
        ${cardBgClass}
        ${isEditingCalendar ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md hover:border-gray-200' : ''}
      `}
      style={dayStyle}
    >
      {/* Selection Checkbox - moved to top left to avoid overlap */}
      {isEditingCalendar && (
        <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onSelectDate}
            className="data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-500 border-gray-500 scale-75 sm:scale-100"
          />
        </div>
      )}
      
      <div onClick={isEditingCalendar ? onSelectDate : undefined} className="flex-grow">
        {/* Date Header - adjusted spacing for checkbox */}
        <div className={`flex items-center justify-between mb-1 sm:mb-2 ${isEditingCalendar ? 'ml-5 sm:ml-6' : ''}`}>
          <div className="flex items-center gap-2">
            <time dateTime={date.toISOString()} className={`font-semibold ${isListView ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} ${textColor}`}>
              {isListView ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : date.getUTCDate()}
            </time>
            <div className={`${isListView ? 'text-sm' : 'text-xs'} ${textColor} opacity-60 font-light`}>
              {isListView ? date.toLocaleDateString('en-US', { weekday: 'long' }) : date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
          </div>
        </div>
        
        {showEditOptions ? (
          <div className={`mt-1 relative${isDisabled ? ' opacity-40 pointer-events-none bg-gray-50 bg-opacity-30 rounded-sm' : ''}`} style={{ minHeight: '80px' }} onClick={(e) => e.stopPropagation()}>
            {isListView ? (
              // List view layout: locations on left, notes on right
              <div className="flex gap-3">
                <div className="flex-1 space-y-1 sm:space-y-2">
                  <Select
                    name="location_1_id"
                    value={dayData?.location_1_id?.toString() || ''}
                    onValueChange={(value) => onUpdateDraft(dateStr, { location_1_id: value ? Number(value) : null })}
                    disabled={isDisabled}
                  >
                    <SelectTrigger className={`h-6 sm:h-7 text-xs ${isDisabled ? 'bg-gray-100' : ''}`}>
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {/* Always reserve space for the second select, but hide it if not transferEnabled */}
                  <div style={{ minHeight: '24px', position: 'relative' }}>
                    <Select
                      name="location_2_id"
                      value={dayData?.location_2_id?.toString() || ''}
                      onValueChange={value => onUpdateDraft(dateStr, { location_2_id: value ? Number(value) : null })}
                      disabled={isDisabled || !transferEnabled}
                    >
                      <SelectTrigger
                        className={`h-6 sm:h-7 text-xs ${isDisabled || !transferEnabled ? 'bg-gray-100' : ''}`}
                        style={{
                          opacity: transferEnabled ? 1 : 0,
                          pointerEvents: transferEnabled ? 'auto' : 'none',
                          position: transferEnabled ? 'static' : 'absolute',
                          top: 0, left: 0, width: '100%',
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <SelectValue placeholder="Transfer to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Switch
                    checked={transferEnabled}
                    onCheckedChange={checked => {
                      setTransferEnabled(checked);
                      if (!checked) {
                        // Clear location_2_id in draft when unchecking
                        onUpdateDraft(dateStr, { location_2_id: null });
                      }
                    }}
                    label="Transfer Day"
                    disabled={isDisabled}
                  />
                </div>

                <div className="flex-1">
                  <Textarea
                    name="notes"
                    placeholder="Notes..."
                    value={dayData?.notes || ''}
                    onChange={(e) => onUpdateDraft(dateStr, { notes: e.target.value })}
                    className={`text-xs resize-none ${isDisabled ? 'bg-gray-100' : ''}`} 
                    rows={3}
                    disabled={isDisabled}
                  />
                </div>
              </div>
            ) : (
              // Calendar view layout: vertical stack
              <div className="space-y-1 sm:space-y-2">
                <Select
                  name="location_1_id"
                  value={dayData?.location_1_id?.toString() || ''}
                  onValueChange={(value) => onUpdateDraft(dateStr, { location_1_id: value ? Number(value) : null })}
                  disabled={isDisabled}
                >
                  <SelectTrigger className={`h-6 sm:h-7 text-xs ${isDisabled ? 'bg-gray-100' : ''}`}>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                {/* Always reserve space for the second select, but hide it if not transferEnabled */}
                <div style={{ minHeight: '24px', position: 'relative' }}>
                  <Select
                    name="location_2_id"
                    value={dayData?.location_2_id?.toString() || ''}
                    onValueChange={value => onUpdateDraft(dateStr, { location_2_id: value ? Number(value) : null })}
                    disabled={isDisabled || !transferEnabled}
                  >
                    <SelectTrigger
                      className={`h-6 sm:h-7 text-xs ${isDisabled || !transferEnabled ? 'bg-gray-100' : ''}`}
                      style={{
                        opacity: transferEnabled ? 1 : 0,
                        pointerEvents: transferEnabled ? 'auto' : 'none',
                        position: transferEnabled ? 'static' : 'absolute',
                        top: 0, left: 0, width: '100%',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <SelectValue placeholder="Transfer to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea
                  name="notes"
                  placeholder="Notes..."
                  value={dayData?.notes || ''}
                  onChange={(e) => onUpdateDraft(dateStr, { notes: e.target.value })}
                  className={`text-xs resize-none ${isDisabled ? 'bg-gray-100' : ''}`} 
                  rows={1}
                  disabled={isDisabled}
                />
                <Switch
                  checked={transferEnabled}
                  onCheckedChange={checked => {
                    setTransferEnabled(checked);
                    if (!checked) {
                      // Clear location_2_id in draft when unchecking
                      onUpdateDraft(dateStr, { location_2_id: null });
                    }
                  }}
                  label="Transfer Day"
                  disabled={isDisabled}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1 text-xs">
            {isListView ? (
              // List view layout: locations on left, notes on right
              <div className="flex gap-3">
                <div className="flex-1">
                  {location1 && <p className={`font-semibold ${textColor}`}>{location1.name}</p>}
                  {location2 && <p className={`text-sm ${textColor}`}>→ {location2.name}</p>}
                </div>
                <div className="flex-1">
                  <p className={`whitespace-pre-wrap ${textColor} opacity-80`}>{dayData?.notes || ''}</p>
                </div>
              </div>
            ) : (
              // Calendar view layout: vertical stack
              <>
                {location1 && <p className={`font-semibold ${textColor}`}>{location1.name}</p>}
                {location2 && <p className={`text-sm ${textColor}`}>→ {location2.name}</p>}
                <p className={`mt-1 whitespace-pre-wrap ${textColor} opacity-80`}>{dayData?.notes || ''}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}