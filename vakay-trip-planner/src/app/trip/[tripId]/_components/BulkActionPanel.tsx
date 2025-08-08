// src/app/trip/[tripId]/_components/BulkActionPanel.tsx
'use client';

import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Location = Database['public']['Tables']['locations']['Row'];

interface BulkActionPanelProps {
  selectedCount: number;
  locations: Location[];
  onBulkUpdate: (updates: { location_1_id: number | null }) => void;
  onClearSelection: () => void; // <-- New prop to clear selection
}

export function BulkActionPanel({ selectedCount, locations, onBulkUpdate, onClearSelection }: BulkActionPanelProps) {
  if (selectedCount === 0) {
    return null;
  }

  // This function now directly calls the update prop
  const handleLocationChange = (value: string) => {
    onBulkUpdate({
      location_1_id: value ? Number(value) : null
    });
  };

  return (
    <Card className="mb-4 bg-blue-50 border-blue-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-blue-900">
                {selectedCount} day{selectedCount !== 1 ? 's' : ''} selected
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Select onValueChange={handleLocationChange}>
                <SelectTrigger className="w-[200px] bg-white border-blue-300">
                  <SelectValue placeholder="Set location for all..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: loc.color }}
                        ></div>
                        {loc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={onClearSelection}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-xs text-blue-600">
              Individual editing disabled
            </p>
            <Button 
              variant="default" 
              size="sm"
              onClick={onClearSelection}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Done
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
