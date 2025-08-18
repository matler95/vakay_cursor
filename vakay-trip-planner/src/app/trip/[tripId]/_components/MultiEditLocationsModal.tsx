'use client';

import { useState, useEffect } from 'react';
import { updateLocation } from '../actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { Database } from '@/types/database.types';
import { 
  FormModal, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type Location = Database['public']['Tables']['locations']['Row'];

interface MultiEditLocationsModalProps {
  tripId: string;
  selectedLocationIds: string[];
  locations: Location[];
  isOpen: boolean;
  onClose: () => void;
  onLocationsUpdated: () => void;
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

export function MultiEditLocationsModal({ 
  tripId, 
  selectedLocationIds, 
  locations, 
  isOpen, 
  onClose, 
  onLocationsUpdated 
}: MultiEditLocationsModalProps) {
  const [edits, setEdits] = useState<Map<string, { name: string; color: string }>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Initialize edits with current values
  useEffect(() => {
    const initialEdits = new Map();
    selectedLocationIds.forEach(id => {
      const location = locations.find(loc => loc.id.toString() === id);
      if (location) {
        // Ensure color is a valid string, fallback to empty string if undefined/null
        const colorValue = location.color && typeof location.color === 'string' ? location.color : '';
        initialEdits.set(id, {
          name: location.name,
          color: colorValue
        });
      }
    });
    setEdits(initialEdits);
  }, [selectedLocationIds, locations, isOpen]); // Added isOpen to ensure re-initialization when modal opens

  const selectedLocations = locations.filter(loc => selectedLocationIds.includes(loc.id.toString()));

  const updateEdit = (locationId: string, field: 'name' | 'color', value: string) => {
    const newEdits = new Map(edits);
    const currentEdit = newEdits.get(locationId) || { name: '', color: '' };
    newEdits.set(locationId, { ...currentEdit, [field]: value });
    setEdits(newEdits);
  };

  const handleNameSelect = (locationId: string, option: AutocompleteOption) => {
    updateEdit(locationId, 'name', option.name);
  };

  const handleSubmit = async () => {
    // Validate that all names are not empty
    const hasEmptyNames = Array.from(edits.values()).some(edit => edit.name.trim() === '');
    if (hasEmptyNames) {
      setMessage('All location names must be filled.');
      return;
    }

    // Validate that all colors are selected
    const hasEmptyColors = Array.from(edits.values()).some(edit => !edit.color);
    if (hasEmptyColors) {
      setMessage('All locations must have a color selected.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Update each location
      for (const [locationId, edit] of edits) {
        const location = locations.find(loc => loc.id.toString() === locationId);
        if (location) {
          const formData = new FormData();
          formData.append('location_id', locationId);
          formData.append('name', edit.name.trim());
          formData.append('color', edit.color);
          formData.append('trip_id', tripId);
          
          const result = await updateLocation(null, formData);
          
          if (result?.message && result.message.includes('error')) {
            throw new Error(result.message);
          }
        }
      }
      
      setIsSubmitting(false);
      setMessage(`Successfully updated ${selectedLocationIds.length} location${selectedLocationIds.length !== 1 ? 's' : ''}!`);
      
      setTimeout(() => {
        onLocationsUpdated();
        onClose();
        setMessage('');
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      setMessage(error instanceof Error ? error.message : 'Failed to update locations');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEdits(new Map());
      setMessage('');
      onClose();
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit ${selectedLocationIds.length} Location${selectedLocationIds.length !== 1 ? 's' : ''}`}
      description="Update the details of selected locations."
      size="lg"
      onSubmit={handleSubmit}
      submitText={`Update ${selectedLocationIds.length} Location${selectedLocationIds.length !== 1 ? 's' : ''}`}
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <div className="space-y-6">
        {/* Location Edits */}
        {selectedLocations.map((location) => {
          // Get the edit state, fallback to the original location data if not found
          const edit = edits.get(location.id.toString()) || {
            name: location.name,
            color: location.color || ''
          };
          return (
            <div key={location.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: location.color || '#E5E7EB' }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {location.name}
                </span>
              </div>
              
              <FormSection title={`Location ${location.name}`}>
                <FormRow cols={2}>
                  {/* Name */}
                  <FormField label="Location Name" required>
                    <Autocomplete
                      value={edit.name}
                      onChange={(value) => updateEdit(location.id.toString(), 'name', value)}
                      onSelect={(option) => handleNameSelect(location.id.toString(), option)}
                      placeholder="Search destinations..."
                      className="w-full"
                      disabled={isSubmitting}
                    />
                  </FormField>

                  {/* Color */}
                  <FormField label="Color" required>
                    <Select
                      value={edit.color || ''}
                      onValueChange={(value) => updateEdit(location.id.toString(), 'color', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue>
                          {edit.color ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: edit.color }}
                              />
                            </div>
                          ) : (
                            <span className="text-gray-500">Select color</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {presetColors.map((colorOption) => (
                          <SelectItem key={colorOption.hex} value={colorOption.hex}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: colorOption.hex }}
                              />
                              <span>{colorOption.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </FormRow>
              </FormSection>
            </div>
          );
        })}

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('error') || message.includes('Failed') 
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
