'use client';

import { useState } from 'react';
import { addLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X, Trash2, MapPin } from 'lucide-react';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { 
  FormModal, 
  StandardInput, 
  StandardTextarea,
  FormSection,
  FormRow,
  FormField,
  FormActions
} from '@/components/ui';

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

const presetColors = [
  { name: 'Soft Red', hex: '#FF6B6B' },
  { name: 'Coral', hex: '#FF8E72' },
  { name: 'Warm Orange', hex: '#FFB86B' },
  { name: 'Vibrant Yellow', hex: '#FFD93D' },
  { name: 'Soft Green', hex: '#A3DE83' },
  { name: 'Mint Green', hex: '#6BCB77' },
  { name: 'Sky Blue', hex: '#4D96FF' },
  { name: 'Light Blue', hex: '#6BCBFF' },
  { name: 'Aqua', hex: '#4BC0C8' },
  { name: 'Turquoise', hex: '#4ECDC4' },
  { name: 'Violet', hex: '#9B5DE5' },
  { name: 'Purple', hex: '#845EC2' },
  { name: 'Pink', hex: '#FF6FB5' },
  { name: 'Soft Pink', hex: '#FF92A5' },
  { name: 'Magenta', hex: '#D65DB1' }
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Locations"
      description="Add new locations to your trip itinerary."
      size="xl"
      onSubmit={handleSubmit}
      submitText={`Save ${locations.filter(loc => loc.name.trim() !== '').length} Location${locations.filter(loc => loc.name.trim() !== '').length !== 1 ? 's' : ''}`}
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <div className="space-y-6">
        {locations.map((location, index) => (
          <div key={location.id} className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200">
            <FormSection title={`Location ${index + 1}`}>
              {/* Location Name */}
              <FormField label="Location Name" required>
                <Autocomplete
                  value={location.name}
                  onChange={(value) => updateLocationEntry(location.id, 'name', value)}
                  onSelect={(destination) => handleDestinationSelect(location.id, destination)}
                  placeholder="Search destinations (e.g., Paris, Angkor Wat, Bali)"
                />

                {location.selectedDestination && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">{location.selectedDestination.name}</span>
                        <span className="text-blue-600">({location.selectedDestination.country})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateLocationEntry(location.id, 'name', location.selectedDestination?.name || '');
                          setLocations(locations.map(loc => 
                            loc.id === location.id ? { ...loc, selectedDestination: null } : loc
                          ));
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                      >
                        Edit manually
                      </button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">{location.selectedDestination.display_name}</p>
                  </div>
                )}
              </FormField>

              {/* Color and Remove */}
              <FormRow cols={2}>
                <FormField label="Color">
                  <Select
                    value={location.color}
                    onValueChange={(value) => updateLocationEntry(location.id, 'color', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: location.color }}
                          />
                          <span className="text-sm">Select color</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {presetColors.map((color) => (
                        <SelectItem key={color.hex} value={color.hex}>
                          <div className="flex items-center gap-3 py-2">
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-sm">{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                {locations.length > 1 && (
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLocationEntry(location.id)}
                      className="h-10 w-full p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-200"
                      aria-label="Remove location"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </FormRow>
            </FormSection>
          </div>
        ))}

        {/* Add Another Location Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addLocationEntry}
          className="w-full h-10 text-sm font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Location
        </Button>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </FormModal>
  );
}
