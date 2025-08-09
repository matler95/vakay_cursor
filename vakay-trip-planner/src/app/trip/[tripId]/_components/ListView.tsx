// src/app/trip/[tripId]/_components/ListView.tsx
'use client';

import { Database } from '@/types/database.types';
import { DayCard } from './DayCard';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface ListViewProps {
  tripDates: Date[];
  draftItinerary: Map<string, ItineraryDay>;
  locations: Location[];
  isEditingCalendar: boolean;
  selectedDates: Set<string>;
  onSelectDate: (dateStr: string) => void;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
}

export function ListView({ 
  tripDates, 
  draftItinerary, 
  locations, 
  isEditingCalendar, 
  selectedDates, 
  onSelectDate, 
  onUpdateDraft 
}: ListViewProps) {
  return (
    <div className="space-y-3">
      {tripDates.map((date) => {
        const dateStr = date.toISOString().split('T')[0];
        const dayData = draftItinerary.get(dateStr);
        return (
          <DayCard
            key={dateStr}
            date={date}
            dayData={dayData}
            locations={locations}
            isEditingCalendar={isEditingCalendar}
            isSelected={selectedDates.has(dateStr)}
            selectionCount={selectedDates.size}
            onSelectDate={() => onSelectDate(dateStr)}
            onUpdateDraft={onUpdateDraft}
            isListView={true}
          />
        );
      })}
    </div>
  );
}
