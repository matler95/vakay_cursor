'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

type Location = {
  id: number;
  name: string;
  color: string;
};

interface RangeActionBarProps {
  selectedRange: { start: string; end: string };
  locations: Location[];
  onAssignLocation: (locationId: number | null) => void;
  onAssignTransfer: (fromLocationId: number | null, toLocationId: number | null) => void;
  onClear: () => void;
  onDone?: () => void; // Add onDone prop
  currentLocationId?: number | null;
  currentTransferId?: number | null;
}

export function RangeActionBar({
  selectedRange,
  locations,
  onAssignLocation,
  onAssignTransfer,
  onClear,
  onDone,
  currentLocationId,
  currentTransferId
}: RangeActionBarProps) {
  // Get the current locations for the selected range
  const getCurrentLocations = (): { location1: number | null; location2: number | null } => {
    if (!selectedRange) return { location1: null, location2: null };
    
    // Use the currentLocationId as location1 and currentTransferId as location2
    return {
      location1: currentLocationId ?? null,
      location2: currentTransferId ?? null
    };
  };

  const currentLocations = getCurrentLocations();
  const [selectedLocation, setSelectedLocation] = useState<string>(
    currentLocations.location1 ? currentLocations.location1.toString() : 'none'
  );
  const [transferLocation, setTransferLocation] = useState<string>(
    currentLocations.location2 ? currentLocations.location2.toString() : 'none'
  );

  // Update selections when the range changes
  useEffect(() => {
    const locations = getCurrentLocations();
    setSelectedLocation(locations.location1 ? locations.location1.toString() : 'none');
    setTransferLocation(locations.location2 ? locations.location2.toString() : 'none');
  }, [selectedRange, currentLocationId, currentTransferId]);

  const handleDone = () => {
    // Apply changes as draft
    const locationId = selectedLocation && selectedLocation !== 'none' ? parseInt(selectedLocation) : null;
    const transferId = transferLocation && transferLocation !== 'none' ? parseInt(transferLocation) : null;
    
    console.log('=== RANGE ACTION BAR - HANDLE DONE ===');
    console.log('Selected location string:', selectedLocation);
    console.log('Parsed location ID:', locationId);
    console.log('Transfer location string:', transferLocation);
    console.log('Transfer ID:', transferId);
    
    if (transferId) {
      // Assign main location to all days, transfer to last day
      onAssignTransfer(locationId, transferId);
    } else {
      // Just assign the main location
      onAssignLocation(locationId);
    }
    
    // Show save/cancel buttons immediately (replaces this modal)
    onDone?.();
    
    // Clear selection to show Save/Cancel buttons
    onClear();
  };

  const isDoneDisabled = !selectedLocation || selectedLocation === 'none';

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-xl shadow-lg border border-gray-200 p-6 min-w-[400px]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Assign Location to {selectedRange.start === selectedRange.end ? 'Day' : 'Range'}
          </h3>
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Range Display */}
        <div className="text-sm text-gray-600">
          {selectedRange.start === selectedRange.end ? (
            <span>{new Date(selectedRange.start).toLocaleDateString()}</span>
          ) : (
            <span>
              {new Date(selectedRange.start).toLocaleDateString()} – {new Date(selectedRange.end).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Main Location Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Location
          </label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No location</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: location.color || '#6B7280' }}
                    />
                    {location.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transfer Location Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Transfer Location (optional)
          </label>
          <Select value={transferLocation} onValueChange={setTransferLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select transfer location (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No transfer</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: location.color || '#6B7280' }}
                    />
                    {location.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            If selected, this will be assigned as a transfer to the last day of the range
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClear}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDone}
            disabled={isDoneDisabled}
            className="flex-1"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
