'use client';

import { useState } from 'react';
import { updateLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { Save } from 'lucide-react';
import { Database } from '@/types/database.types';
import { 
  FormModal, 
  StandardInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type Location = Database['public']['Tables']['locations']['Row'];

interface EditLocationModalProps {
  location: Location;
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
}

// Preset colors for the dropdown (same as AddLocationModal)
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

export function EditLocationModal({ location, isOpen, onClose, onLocationUpdated }: EditLocationModalProps) {
  const [name, setName] = useState(location.name);
  const [color, setColor] = useState(location.color);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleNameSelect = (option: AutocompleteOption) => {
    setName(option.name);
  };

  const handleSubmit = async () => {
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Location"
      description="Update the details of this location."
      size="md"
      onSubmit={handleSubmit}
      submitText="Update Location"
      cancelText="Cancel"
      loading={isSubmitting}
    >
      {/* Consistent header with color chip + name, matching multi-edit cards */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-gray-700">{location.name}</span>
      </div>

      <div className="space-y-6">
        <FormSection title="Location Details">
          <FormRow cols={2}>
            <FormField label="Location Name" required>
              <Autocomplete
                value={name}
                onChange={setName}
                onSelect={handleNameSelect}
                placeholder="Search destinations..."
                className="w-full"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField label="Color" required>
              <Select
                value={color}
                onValueChange={setColor}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-10">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color }}
                      />
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
            </FormField>
          </FormRow>
        </FormSection>

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
