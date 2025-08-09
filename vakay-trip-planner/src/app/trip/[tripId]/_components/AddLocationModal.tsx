'use client';


import { useState, useEffect } from 'react';
import { addLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';



interface AddLocationModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onLocationAdded: () => void;
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

interface LocationEntry {
  id: string;
  name: string;
  color: string;
}

export function AddLocationModal({ tripId, isOpen, onClose, onLocationAdded }: AddLocationModalProps) {
  const [locations, setLocations] = useState<LocationEntry[]>([
    { id: '1', name: '', color: presetColors[7].hex }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const addLocationEntry = () => {
    const newId = (locations.length + 1).toString();
    setLocations([...locations, { id: newId, name: '', color: presetColors[7].hex }]);
  };

  const removeLocationEntry = (id: string) => {
    if (locations.length > 1) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
  };

  const updateLocationEntry = (id: string, field: 'name' | 'color', value: string) => {
    setLocations(locations.map(loc => 
      loc.id === id ? { ...loc, [field]: value } : loc
    ));
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage('');
    
    // Filter out empty locations
    const validLocations = locations.filter(loc => loc.name.trim() !== '');
    
    if (validLocations.length === 0) {
      setIsSubmitting(false);
      setMessage('Please add at least one location.');
      return;
    }

    try {
      // Submit each location
      for (const location of validLocations) {
        const locationFormData = new FormData();
        locationFormData.append('name', location.name.trim());
        locationFormData.append('color', location.color);
        locationFormData.append('trip_id', tripId);
        
        const result = await addLocation(null, locationFormData);
        if (result.message && result.message.includes('error')) {
          throw new Error(result.message);
        }
      }
      
      setIsSubmitting(false);
      onLocationAdded();
      onClose();
      // Reset form
      setLocations([{ id: '1', name: '', color: presetColors[7].hex }]);
    } catch (error) {
      setIsSubmitting(false);
      setMessage(error instanceof Error ? error.message : 'Failed to add locations');
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Locations</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {locations.map((location, index) => (
              <div key={location.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-grow space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Location {index + 1}</span>
                    {locations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocationEntry(location.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`name-${location.id}`}>Location Name</Label>
                    <Input
                      id={`name-${location.id}`}
                      name={`name-${location.id}`}
                      placeholder="e.g., Paris"
                      value={location.name}
                      onChange={(e) => updateLocationEntry(location.id, 'name', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
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
                            <span>
                              {presetColors.find(c => c.hex === location.color)?.name || 'Custom'}
                            </span>
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
              {isSubmitting ? <Spinner size={18} className="mr-2" /> : null}
              {isSubmitting ? `Saving...` : `Save ${locations.filter(loc => loc.name.trim() !== '').length} Location${locations.filter(loc => loc.name.trim() !== '').length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
