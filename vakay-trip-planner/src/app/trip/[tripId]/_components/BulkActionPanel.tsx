// src/app/trip/[tripId]/_components/BulkActionPanel.tsx
'use client';

import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, MapPin } from 'lucide-react';

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
      location_1_id: value ? Number(value) : null
    });
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-900">
            {selectedCount} day{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Select onValueChange={handleLocationChange}>
            <SelectTrigger className="w-[180px] bg-gray-50 border-gray-200 h-8">
              <SelectValue placeholder="Set location..." />
            </SelectTrigger>
            <SelectContent>
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
          className="h-7 px-2 text-xs"
          >
          Done
          {/* <X className="h-4 w-4" /> */}
          </Button>
      </div>
    </div>
  );
}
