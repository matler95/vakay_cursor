'use client';

import { Database } from '@/types/database.types';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

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
}

function getTextColorForBackground(hexColor: string): 'text-white' | 'text-gray-900' {
    if (!hexColor) return 'text-gray-900';
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'text-gray-900' : 'text-white';
}

export function DayCard({ date, dayData, locations, isEditingCalendar, isSelected, selectionCount, onSelectDate, onUpdateDraft }: DayCardProps) {
  const [isTransfer, setIsTransfer] = useState(!!dayData?.location_2_id);

  const locationsMap = new Map(locations.map((loc) => [loc.id, loc]));
  const location1 = dayData?.location_1_id ? (locationsMap.get(dayData.location_1_id) ?? null) : null;
  const location2 = dayData?.location_2_id ? (locationsMap.get(dayData.location_2_id) ?? null) : null;

  const dayStyle: React.CSSProperties = {};
  let textColor: string = 'text-gray-900';
  if (location1 && location2) {
    dayStyle.background = `linear-gradient(to bottom right, ${location1.color}, ${location2.color})`;
    textColor = 'text-white';
  } else if (location1) {
    dayStyle.background = location1.color;
    textColor = getTextColorForBackground(location1.color);
  }

  const dateStr = date.toISOString().split('T')[0];
  const isOnlySelected = isEditingCalendar && isSelected && selectionCount === 1;

  return (
    <div className={`relative flex flex-col p-2 min-h-36 ${isEditingCalendar ? 'cursor-pointer' : ''}`} style={dayStyle}>
      {isEditingCalendar && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={onSelectDate} />
        </div>
      )}
      
      <div onClick={isEditingCalendar ? onSelectDate : undefined} className="flex-grow">
        <time dateTime={date.toISOString()} className={`font-bold text-left ${textColor}`}>{date.getUTCDate()}</time>
        
        {isOnlySelected ? (
          <div className="mt-1 space-y-2" onClick={(e) => e.stopPropagation()}>
            <Select
              name="location_1_id"
              value={dayData?.location_1_id?.toString() || ''}
              onValueChange={(value) => onUpdateDraft(dateStr, { location_1_id: value ? Number(value) : null })}
            >
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                {locations.map((loc) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {isTransfer && (
               <Select
                name="location_2_id"
                value={dayData?.location_2_id?.toString() || ''}
                onValueChange={(value) => onUpdateDraft(dateStr, { location_2_id: value ? Number(value) : null })}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Transfer to..." /></SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Textarea
              name="notes"
              placeholder="Notes..."
              value={dayData?.notes || ''}
              onChange={(e) => onUpdateDraft(dateStr, { notes: e.target.value })}
              className="text-xs resize-none" rows={2}
            />
            <label className="flex items-center space-x-2 text-xs">
              <Checkbox checked={isTransfer} onCheckedChange={(checked) => setIsTransfer(!!checked)} />
              <span className={textColor}>Add Transfer</span>
            </label>
          </div>
        ) : (
          <div className="mt-1 text-xs">
            {location1 && <p className={`font-semibold ${textColor}`}>{location1.name}</p>}
            {location2 && <p className={`text-sm ${textColor}`}>→ {location2.name}</p>}
            <p className={`mt-1 whitespace-pre-wrap ${textColor} opacity-80`}>{dayData?.notes || ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}