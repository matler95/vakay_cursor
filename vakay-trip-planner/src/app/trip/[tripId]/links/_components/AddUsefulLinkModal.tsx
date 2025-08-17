// Add useful link modal
'use client';

import { useState } from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FormModal, 
  StandardInput, 
  StandardTextarea, 
  StandardUrlInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

interface AddUsefulLinkModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onLinkAdded: () => void;
}

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'poi', label: 'Point of Interest', icon: '📍' },
  { value: 'activity', label: 'Activity', icon: '🎯' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'transport', label: 'Transport', icon: '🚌' },
  { value: 'other', label: 'Other', icon: '🔗' },
];

export function AddUsefulLinkModal({
  tripId,
  isOpen,
  onClose,
  onLinkAdded,
}: AddUsefulLinkModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'restaurant',
    address: '',
    phone: '',
    notes: '',
    is_favorite: false,
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.url) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/useful-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: tripId,
          ...formData,
        }),
      });

      if (response.ok) {
        onLinkAdded();
        onClose();
        // Reset form
        setFormData({
          title: '',
          url: '',
          description: '',
          category: 'restaurant',
          address: '',
          phone: '',
          notes: '',
          is_favorite: false,
        });
      } else {
        console.error('Failed to add useful link');
      }
    } catch (error) {
      console.error('Error adding useful link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Useful Link"
      description="Add a useful link, website, or resource for your trip."
      size="md"
      onSubmit={handleSubmit}
      submitText="Add Link"
      cancelText="Cancel"
      loading={isLoading}
    >
      <div className="space-y-6">
        <FormSection title="Basic Information">
          <FormField label="Category">
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <StandardInput
            label="Title"
            name="title"
            placeholder="e.g., Best Pizza Place"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />

          <StandardUrlInput
            label="URL"
            name="url"
            placeholder="https://example.com"
            value={formData.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            required
          />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_favorite"
              checked={formData.is_favorite}
              onCheckedChange={(checked) => handleInputChange('is_favorite', checked as boolean)}
            />
            <label
              htmlFor="is_favorite"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mark as favorite
            </label>
          </div>
        </FormSection>
      </div>
    </FormModal>
  );
}
