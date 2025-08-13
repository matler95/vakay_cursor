// src/app/trip/[tripId]/_components/BulkActionPanel.tsx
'use client';

import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type Location = Database['public']['Tables']['locations']['Row'];

interface BulkActionPanelProps {
  selectedCount: number;
  locations: Location[];
  onBulkUpdate: (updates: { location_1_id: number | null }) => void;
  onClearSelection: () => void;
}

export function BulkActionPanel({ selectedCount, locations, onBulkUpdate, onClearSelection }: BulkActionPanelProps) {
  if (selectedCount === 0) {
    return null;
  }

  const handleLocationChange = (value: string) => {
    onBulkUpdate({
      location_1_id: value === 'clear' ? null : Number(value)
    });
  };

    return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 max-w-[calc(100vw-2rem)]">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
            {selectedCount} day{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 hidden sm:block">Set location for all:</span>
          <Select onValueChange={handleLocationChange}>
            <SelectTrigger className="w-[120px] sm:w-[180px] bg-gray-50 border-gray-200 h-7 sm:h-8 text-xs">
              <SelectValue placeholder="Choose location..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clear">Clear location</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300" 
                      style={{ backgroundColor: loc.color }}
                    ></div>
                    {loc.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={onClearSelection}
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs whitespace-nowrap"
          >
          Clear Selection
        </Button>
      </div>
    </div>
  );
}
