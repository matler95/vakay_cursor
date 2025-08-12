'use client';

import { useState, useEffect } from 'react';
import { updateLocation } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Copy, Check } from 'lucide-react';
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
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Initialize edits with current values
  useEffect(() => {
    const initialEdits = new Map();
    selectedLocationIds.forEach(id => {
      const location = locations.find(loc => loc.id.toString() === id);
      if (location) {
        initialEdits.set(id, {
          name: location.name,
          description: location.description || '',
          color: location.color || presetColors[7].hex // Fallback to blue if no color
        });
      }
    });
    setEdits(initialEdits);
  }, [selectedLocationIds, locations]);

  const selectedLocations = locations.filter(loc => selectedLocationIds.includes(loc.id.toString()));

  const updateEdit = (locationId: string, field: 'name' | 'description' | 'color', value: string) => {
    const newEdits = new Map(edits);
    const currentEdit = newEdits.get(locationId) || { name: '', description: '', color: presetColors[7].hex };
    newEdits.set(locationId, { ...currentEdit, [field]: value });
    setEdits(newEdits);
  };

  const copyToAll = (field: 'name' | 'description' | 'color', value: string) => {
    const newEdits = new Map(edits);
    selectedLocationIds.forEach(id => {
      const currentEdit = newEdits.get(id) || { name: '', description: '', color: presetColors[7].hex };
      newEdits.set(id, { ...currentEdit, [field]: value });
    });
    setEdits(newEdits);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all names are not empty
    const hasEmptyNames = Array.from(edits.values()).some(edit => edit.name.trim() === '');
    if (hasEmptyNames) {
      setMessage('All location names must be filled.');
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToAll('color', presetColors[7].hex)}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Set All Blue
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToAll('color', presetColors[2].hex)}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Set All Yellow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToAll('color', presetColors[3].hex)}
                className="text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Set All Green
              </Button>
            </div>
          </div>

          {/* Location Edits */}
          <div className="space-y-4">
            {selectedLocations.map((location) => {
              const edit = edits.get(location.id.toString()) || { name: '', description: '', color: '' };
              return (
                <div key={location.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-4 w-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: location.color }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Location {location.id}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`name-${location.id}`}>Name</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToAll('name', edit.name)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                          title="Copy to all locations"
                        >
                          {copiedField === 'name' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <Input
                        id={`name-${location.id}`}
                        type="text"
                        value={edit.name}
                        onChange={(e) => updateEdit(location.id.toString(), 'name', e.target.value)}
                        placeholder="Location name"
                        disabled={isSubmitting}
                        className="w-full"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`description-${location.id}`}>Description</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToAll('description', edit.description)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                          title="Copy to all locations"
                        >
                          {copiedField === 'description' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <Textarea
                        id={`description-${location.id}`}
                        value={edit.description}
                        onChange={(e) => updateEdit(location.id.toString(), 'description', e.target.value)}
                        placeholder="Optional description"
                        disabled={isSubmitting}
                        className="w-full min-h-[60px]"
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Color</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToAll('color', edit.color)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600"
                          title="Copy to all locations"
                        >
                          {copiedField === 'color' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                                             <Select
                         value={edit.color || presetColors[7].hex}
                         onValueChange={(value) => updateEdit(location.id.toString(), 'color', value)}
                         disabled={isSubmitting}
                       >
                        <SelectTrigger>
                                                   <SelectValue>
                           <div className="flex items-center gap-2">
                             <div
                               className="w-4 h-4 rounded-full border border-gray-300"
                               style={{ backgroundColor: edit.color || presetColors[7].hex }}
                             />
                             <span>
                               {presetColors.find(c => c.hex === (edit.color || presetColors[7].hex))?.name || 'Custom'}
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
