'use client';

import { useState, useEffect } from 'react';
import { updateLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { X, Save } from 'lucide-react';
import { Database } from '@/types/database.types';

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
  const [edits, setEdits] = useState<Map<string, { name: string; description: string; color: string }>>(new Map());
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
          description: location.description || '',
          color: colorValue
        });
      }
    });
    setEdits(initialEdits);
  }, [selectedLocationIds, locations, isOpen]); // Added isOpen to ensure re-initialization when modal opens

  const selectedLocations = locations.filter(loc => selectedLocationIds.includes(loc.id.toString()));

  const updateEdit = (locationId: string, field: 'name' | 'description' | 'color', value: string) => {
    const newEdits = new Map(edits);
    const currentEdit = newEdits.get(locationId) || { name: '', description: '', color: '' };
    newEdits.set(locationId, { ...currentEdit, [field]: value });
    setEdits(newEdits);
  };

  const handleNameSelect = (locationId: string, option: AutocompleteOption) => {
    updateEdit(locationId, 'name', option.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          formData.append('description', edit.description.trim());
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">  
          <h2 className="text-lg font-semibold text-gray-900">
            Edit {selectedLocationIds.length} Location{selectedLocationIds.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Edits */}
          <div className="space-y-4">
            {selectedLocations.map((location) => {
              // Get the edit state, fallback to the original location data if not found
              const edit = edits.get(location.id.toString()) || {
                name: location.name,
                description: location.description || '',
                color: location.color || ''
              };
              return (
                <div key={location.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: location.color || '#E5E7EB' }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {location.name}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Name */}
                    <div className="space-y-2 md:col-span-4">
                      <Label htmlFor={`name-${location.id}`}>Location Name</Label>
                      <Autocomplete
                        value={edit.name}
                        onChange={(value) => updateEdit(location.id.toString(), 'name', value)}
                        onSelect={(option) => handleNameSelect(location.id.toString(), option)}
                        placeholder="Search destinations..."
                        className="w-full"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select
                        value={edit.color || ''}
                        onValueChange={(value) => updateEdit(location.id.toString(), 'color', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {edit.color ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{ backgroundColor: edit.color }}
                                />
                                {/* <span>
                                  {presetColors.find(c => c.hex === edit.color)?.name || 'Custom'}
                                </span> */}
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {message && (
            <p className={`text-sm ${message.includes('error') || message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update {selectedLocationIds.length} Location{selectedLocationIds.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
