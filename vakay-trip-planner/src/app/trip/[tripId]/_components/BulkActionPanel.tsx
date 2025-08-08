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
    <Card className="mb-4 bg-gray-100 border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">
              {selectedCount} days selected
            </p>
            <Select onValueChange={handleLocationChange}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Set location for all..." />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* This button now clears the selection */}
          <Button variant="ghost" onClick={onClearSelection}>OK</Button>
        </div>
      </CardContent>
    </Card>
  );
}
