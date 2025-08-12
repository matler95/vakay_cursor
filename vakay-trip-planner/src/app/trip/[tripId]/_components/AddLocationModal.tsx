'use client';

import { useState } from 'react';
import { addLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Trash2, MapPin } from 'lucide-react';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';

interface AddLocationModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onLocationAdded: () => void;
}

interface LocationEntry {
  id: string;
  name: string;
  description: string;
  color: string;
  selectedDestination?: AutocompleteOption | null;
}

// Preset colors for the dropdown
const presetColors = [
  { name: 'Red', hex: '#FF383C' },
  { name: 'Orange', hex: '#FF8D28' },
  { name: 'Yellow', hex: '#FFCC00' },
  { name: 'Green', hex: '#34C759' },
  { name: 'Mint', hex: '#00C8B3' },
  { name: 'Teal', hex: '#00C3D0' },
  { name: 'Cyan', hex: '#00C0E8' },
  { name: 'Blue', hex: '#0088FF' },
  { name: 'Indigo', hex: '#6155F5' },
  { name: 'Purple', hex: '#CB30E0' },
  { name: 'Pink', hex: '#FF2D55' },
  { name: 'Brown', hex: '#AC7F5E' },
  { name: 'Gray', hex: '#8E8E93' }
];

export function AddLocationModal({ tripId, isOpen, onClose, onLocationAdded }: AddLocationModalProps) {
  const [locations, setLocations] = useState<LocationEntry[]>([
    { id: '1', name: '', description: '', color: presetColors[7].hex, selectedDestination: null }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const updateLocationEntry = (id: string, field: 'name' | 'description' | 'color', value: string) => {
    setLocations(locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ));
  };

  const addLocationEntry = () => {
    const newId = (locations.length + 1).toString();
    setLocations([...locations, { id: newId, name: '', description: '', color: presetColors[7].hex, selectedDestination: null }]);
  };

  const removeLocationEntry = (id: string) => {
    if (locations.length > 1) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
  };

  const handleDestinationSelect = (locationId: string, destination: AutocompleteOption) => {
    setLocations(locations.map(loc => 
      loc.id === locationId ? { ...loc, name: destination.name, selectedDestination: destination } : loc
    ));
  };

  const handleSubmit = async () => {
    const validLocations = locations.filter(loc => loc.name.trim() !== '');
    
    if (validLocations.length === 0) {
      setMessage('Please add at least one location.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      for (const location of validLocations) {
        const formData = new FormData();
        formData.append('trip_id', tripId);
        formData.append('name', location.name.trim());
        formData.append('description', location.description.trim());
        formData.append('color', location.color);
        
        const result = await addLocation(null, formData);
        
        if (result?.message && result.message.includes('error')) {
          throw new Error(result.message);
        }
      }
      
      setIsSubmitting(false);
      setMessage(`Successfully added ${validLocations.length} location${validLocations.length !== 1 ? 's' : ''}!`);
      
      setTimeout(() => {
        onLocationAdded();
        onClose();
        // Reset form
        setLocations([{ id: '1', name: '', description: '', color: presetColors[7].hex, selectedDestination: null }]);
        setMessage('');
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      setMessage(error instanceof Error ? error.message : 'Failed to add locations');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-4 sm:p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Add Locations</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-4">
            {locations.map((location, index) => (
              <div key={location.id} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
                <div className="flex-grow space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Location {index + 1}</span>
                    {locations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocationEntry(location.id)}
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2 md:col-span-4">
                      <Label htmlFor={`name-${location.id}`}>Location Name</Label>
                      <Autocomplete
                        value={location.name}
                        onChange={(value) => updateLocationEntry(location.id, 'name', value)}
                        onSelect={(destination) => handleDestinationSelect(location.id, destination)}
                        placeholder="Search destinations (e.g., Paris, Angkor Wat, Bali)"
                        className="w-full"
                      />
                    </div>

                  {location.selectedDestination && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{location.selectedDestination.name}</span>
                          <span className="text-blue-600">
                            ({location.selectedDestination.country})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Clear the selected destination to allow manual editing
                            updateLocationEntry(location.id, 'name', location.selectedDestination?.name || '');
                            setLocations(locations.map(loc => 
                              loc.id === location.id ? { ...loc, selectedDestination: null } : loc
                            ));
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Edit manually
                        </button>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {location.selectedDestination.display_name}
                      </p>
                    </div>
                  )}

                    <div className="space-y-2 md:col-span-1">
                      <Label>Color</Label>
                      <Select
                        value={location.color}
                        onValueChange={(value) => updateLocationEntry(location.id, 'color', value)}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: location.color }}
                              />
                              {/* <span>
                                {presetColors.find(c => c.hex === location.color)?.name || 'Custom'}
                              </span> */}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {presetColors.map((color) => (
                            <SelectItem key={color.hex} value={color.hex}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: color.hex }}
                                />
                                <span>{color.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addLocationEntry}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Location
          </Button>

          {message && (
            <p className={`text-sm ${message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting || locations.every(loc => loc.name.trim() === '')}>
              {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : null}
              {isSubmitting ? `Saving...` : `Save ${locations.filter(loc => loc.name.trim() !== '').length} Location${locations.filter(loc => loc.name.trim() !== '').length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
