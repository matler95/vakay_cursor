'use client';

import { Database } from '@/types/database.types';
import { PremiumDayCard } from './PremiumDayCard';
import { format, isToday, isYesterday, isTomorrow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface PremiumListViewProps {
  tripDates: Date[];
  draftItinerary: Map<string, ItineraryDay>;
  locations: Location[];
  isEditing: boolean;
  selectedDates: Set<string>;
  onSelectDate: (dateStr: string) => void;
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
}

export function PremiumListView({
  tripDates,
  draftItinerary,
  locations,
  isEditing,
  selectedDates,
  onSelectDate,
  onUpdateDraft,
}: PremiumListViewProps) {
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d');
  };

  const getDateSubtext = (date: Date) => {
    if (isToday(date) || isYesterday(date) || isTomorrow(date)) {
      return format(date, 'MMMM d, yyyy');
    }
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Trip Timeline</h2>
            <p className="text-gray-600">
              {tripDates.length} day{tripDates.length !== 1 ? 's' : ''} • {format(tripDates[0], 'MMM d')} - {format(tripDates[tripDates.length - 1], 'MMM d, yyyy')}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Progress</div>
            <div className="text-lg font-semibold text-gray-900">
              {Array.from(draftItinerary.values()).filter(day => day.location_1_id || day.notes).length} planned
            </div>
          </div>
        </div>
      </div>

      {/* Premium Timeline */}
      <div className="relative">
        {/* Enhanced Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 rounded-full"></div>
        
        <div className="space-y-10">
          {tripDates.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayData = draftItinerary.get(dateStr);
            const isCurrentDay = isToday(date);
            const hasContent = dayData?.location_1_id || dayData?.location_2_id || dayData?.notes;
            
            return (
              <div key={dateStr} className="relative group">
                {/* Premium Timeline dot */}
                <div className={`
                  absolute left-8 w-4 h-4 rounded-full border-4 border-white shadow-lg transition-all duration-300
                  ${isCurrentDay ? 'bg-blue-500 scale-125' : hasContent ? 'bg-green-500' : 'bg-gray-400'}
                  ${isEditing ? 'group-hover:scale-150' : ''}
                  transform -translate-x-2
                `}></div>
                
                {/* Content */}
                <div className="ml-20">
                  {/* Premium Date header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className={`
                        text-xl font-bold transition-colors duration-200
                        ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}
                        ${isEditing ? 'group-hover:text-blue-600' : ''}
                      `}>
                        {getDateLabel(date)}
                      </h3>
                      
                      {isCurrentDay && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1">
                          Current Day
                        </Badge>
                      )}
                      
                      {hasContent && !isCurrentDay && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1">
                          Planned
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-500 font-medium">
                      {getDateSubtext(date)}
                    </p>
                  </div>
                  
                  {/* Premium Day card */}
                  <div className={`transition-all duration-300 ${isEditing ? 'group-hover:shadow-xl group-hover:scale-[1.02]' : ''}`}>
                    <PremiumDayCard
                      date={date}
                      dayData={dayData}
                      locations={locations}
                      isEditing={isEditing}
                      isSelected={selectedDates.has(dateStr)}
                      selectionCount={selectedDates.size}
                      onSelectDate={() => onSelectDate(dateStr)}
                      onUpdateDraft={onUpdateDraft}
                      isListView={true}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
