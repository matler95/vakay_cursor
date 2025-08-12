'use client';

import { useState } from 'react';
import { updateLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { X, Save } from 'lucide-react';
import { Database } from '@/types/database.types';

type Location = Database['public']['Tables']['locations']['Row'];

interface EditLocationModalProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
}

// Preset colors for the dropdown (same as AddLocationModal)
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

export function EditLocationModal({ location, isOpen, onClose, onLocationUpdated }: EditLocationModalProps) {
  const [name, setName] = useState(location.name);
  const [color, setColor] = useState(location.color);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleNameSelect = (option: AutocompleteOption) => {
    setName(option.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() === '') {
      setMessage('Location name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('location_id', location.id.toString());
      formData.append('name', name.trim());
      formData.append('description', location.description || ''); // Keep original description
      formData.append('color', color);
      formData.append('trip_id', location.trip_id || '');
      
      const result = await updateLocation(null, formData);
      
      if (result?.message && result.message.includes('error')) {
        throw new Error(result.message);
      }
      
      setIsSubmitting(false);
      setMessage('Location updated successfully!');
      
      setTimeout(() => {
        onLocationUpdated();
        onClose();
        setMessage('');
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      setMessage(error instanceof Error ? error.message : 'Failed to update location');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName(location.name); // Reset to original value
      setColor(location.color);
      setMessage('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Edit Location</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Consistent header with color chip + name, matching multi-edit cards */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-gray-700">{location.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Autocomplete
                value={name}
                onChange={setName}
                onSelect={handleNameSelect}
                placeholder="Search destinations..."
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <Select
                value={color}
                onValueChange={setColor}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
                      <span>
                        {presetColors.find(c => c.hex === color)?.name || 'Custom'}
                      </span>
                    </div>
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
              disabled={isSubmitting || name.trim() === ''}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Location
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
