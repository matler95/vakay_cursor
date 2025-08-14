'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { MapPin, ArrowRight, Clock, FileText, X, Plus, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface DayEditorProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  dayData: ItineraryDay | undefined;
  locations: Location[];
  onUpdateDraft: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
  onCreateLocation?: (locationData: Partial<Location>) => Promise<Location | null>;
}

interface TransferSettings {
  isTransfer: boolean;
  fromLocationId: number | null;
  toLocationId: number | null;
  startTime: string;
  endTime: string;
  splitType: 'full' | 'am-pm' | 'custom';
}

export function DayEditor({
  isOpen,
  onClose,
  date,
  dayData,
  locations,
  onUpdateDraft,
  onCreateLocation
}: DayEditorProps) {
  const [transferSettings, setTransferSettings] = useState<TransferSettings>({
    isTransfer: false,
    fromLocationId: null,
    toLocationId: null,
    startTime: '09:00',
    endTime: '17:00',
    splitType: 'full'
  });
  const [notes, setNotes] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<AutocompleteOption | null>(null);
  const [customLocationName, setCustomLocationName] = useState('');
  const [showCustomLocationForm, setShowCustomLocationForm] = useState(false);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);

  const dateStr = date.toISOString().split('T')[0];
  const location1 = dayData?.location_1_id ? locations.find(l => l.id === dayData.location_1_id) : null;
  const location2 = dayData?.location_2_id ? locations.find(l => l.id === dayData.location_2_id) : null;

  // Initialize state from dayData
  useEffect(() => {
    if (dayData) {
      setTransferSettings({
        isTransfer: !!dayData.location_2_id,
        fromLocationId: dayData.location_1_id,
        toLocationId: dayData.location_2_id,
        startTime: '09:00',
        endTime: '17:00',
        splitType: 'full'
      });
      setNotes(dayData.notes || '');
    }
  }, [dayData]);

  // Handle location selection from autocomplete
  const handleLocationSelect = (option: AutocompleteOption) => {
    setSelectedLocation(option);
    
    // Check if location already exists in our locations array
    const existingLocation = locations.find(l => 
      l.name.toLowerCase() === option.name.toLowerCase() ||
      l.name.toLowerCase().includes(option.name.toLowerCase()) ||
      option.name.toLowerCase().includes(l.name.toLowerCase())
    );

    if (existingLocation) {
      // Use existing location
      onUpdateDraft(dateStr, { location_1_id: existingLocation.id });
      setCustomLocationName('');
      setShowCustomLocationForm(false);
    } else {
      // Show custom location form
      setCustomLocationName(option.name);
      setShowCustomLocationForm(true);
    }
  };

  // Handle custom location creation
  const handleCreateCustomLocation = async () => {
    if (!customLocationName.trim() || !onCreateLocation) return;

    setIsCreatingLocation(true);
    try {
      const newLocation = await onCreateLocation({
        name: customLocationName.trim(),
        color: '#3B82F6', // Default blue color
        trip_id: dayData?.trip_id || ''
      });

      if (newLocation) {
        onUpdateDraft(dateStr, { location_1_id: newLocation.id });
        setCustomLocationName('');
        setShowCustomLocationForm(false);
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsCreatingLocation(false);
    }
  };

  // Handle transfer settings changes
  const handleTransferChange = (field: keyof TransferSettings, value: any) => {
    const newSettings = { ...transferSettings, [field]: value };
    setTransferSettings(newSettings);

    // Update draft immediately
    if (field === 'isTransfer') {
      if (value) {
        // Enable transfer - keep current location_1_id, set location_2_id to null initially
        onUpdateDraft(dateStr, { location_2_id: null });
      } else {
        // Disable transfer - clear location_2_id
        onUpdateDraft(dateStr, { location_2_id: null });
      }
    } else if (field === 'fromLocationId') {
      onUpdateDraft(dateStr, { location_1_id: value });
    } else if (field === 'toLocationId') {
      onUpdateDraft(dateStr, { location_2_id: value });
    }
  };

  // Handle notes change
  const handleNotesChange = (value: string) => {
    setNotes(value);
    onUpdateDraft(dateStr, { notes: value });
  };

  // Get time options for AM/PM split
  const getTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      times.push(time);
    }
    return times;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${formatDate(date)}`}
      description="Manage your day's itinerary and transfer details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Primary Location Assignment */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Primary Location
          </label>
          
          {!showCustomLocationForm ? (
            <div className="space-y-2">
              <Autocomplete
                value={selectedLocation?.name || location1?.name || ''}
                onChange={() => {}} // Controlled by onSelect
                onSelect={handleLocationSelect}
                placeholder="Search for a location..."
                className="w-full"
              />
              
              {/* Quick location selection from existing */}
              {locations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => onUpdateDraft(dateStr, { location_1_id: loc.id })}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm border transition-colors",
                        location1?.id === loc.id
                          ? "bg-blue-100 border-blue-300 text-blue-800"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300" 
                          style={{ backgroundColor: loc.color }}
                        />
                        {loc.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Create New Location</span>
              </div>
              <Input
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                placeholder="Location name"
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCustomLocation}
                  disabled={!customLocationName.trim() || isCreatingLocation}
                  size="sm"
                  className="flex-1"
                >
                  {isCreatingLocation ? 'Creating...' : 'Create & Assign'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCustomLocationForm(false);
                    setCustomLocationName('');
                    setSelectedLocation(null);
                  }}
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Transfer Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="transfer-toggle"
              checked={transferSettings.isTransfer}
              onChange={(e) => handleTransferChange('isTransfer', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="transfer-toggle" className="text-sm font-medium text-gray-700">
              This is a transfer day
            </label>
          </div>

          {transferSettings.isTransfer && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Location
                  </label>
                  <Select 
                    value={transferSettings.fromLocationId?.toString() || ''} 
                    onValueChange={(value) => handleTransferChange('fromLocationId', value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-300" 
                              style={{ backgroundColor: loc.color }}
                            />
                            {loc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Location
                  </label>
                  <Select 
                    value={transferSettings.toLocationId?.toString() || ''} 
                    onValueChange={(value) => handleTransferChange('toLocationId', value ? parseInt(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-300" 
                              style={{ backgroundColor: loc.color }}
                            />
                            {loc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Transfer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Type
                </label>
                <Select 
                  value={transferSettings.splitType} 
                  onValueChange={(value: 'full' | 'am-pm' | 'custom') => handleTransferChange('splitType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full day transfer</SelectItem>
                    <SelectItem value="am-pm">AM/PM split</SelectItem>
                    <SelectItem value="custom">Custom times</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time settings based on split type */}
              {transferSettings.splitType === 'am-pm' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Morning Location
                    </label>
                    <div className="text-sm text-gray-600">
                      {transferSettings.fromLocationId ? 
                        locations.find(l => l.id === transferSettings.fromLocationId)?.name : 
                        'Not set'
                      }
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Afternoon Location
                    </label>
                    <div className="text-sm text-gray-600">
                      {transferSettings.toLocationId ? 
                        locations.find(l => l.id === transferSettings.toLocationId)?.name : 
                        'Not set'
                      }
                    </div>
                  </div>
                </div>
              )}

              {transferSettings.splitType === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={transferSettings.startTime}
                      onChange={(e) => handleTransferChange('startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={transferSettings.endTime}
                      onChange={(e) => handleTransferChange('endTime', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes, activities, or reminders for this day..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            className="flex-1"
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
