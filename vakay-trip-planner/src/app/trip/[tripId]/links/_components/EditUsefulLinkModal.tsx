// Edit useful link modal
'use client';

import { useState, useEffect } from 'react';
import { Link as LinkIcon, MapPin, Phone, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Database } from '@/types/database.types';
import { 
  FormModal, 
  StandardInput, 
  StandardTextarea, 
  StandardUrlInput, 
  StandardPhoneInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type UsefulLink = Database['public']['Tables']['useful_links']['Row'];

interface EditUsefulLinkModalProps {
  link: UsefulLink;
  isOpen: boolean;
  onClose: () => void;
  onLinkUpdated: () => void;
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

export function EditUsefulLinkModal({
  link,
  isOpen,
  onClose,
  onLinkUpdated,
}: EditUsefulLinkModalProps) {
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

  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title || '',
        url: link.url || '',
        description: link.description || '',
        category: link.category || 'restaurant',
        address: link.address || '',
        phone: link.phone || '',
        notes: link.notes || '',
        is_favorite: link.is_favorite || false,
      });
    }
  }, [link]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.url) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/useful-links/${link.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onLinkUpdated();
        onClose();
      } else {
        console.error('Failed to update useful link');
      }
    } catch (error) {
      console.error('Error updating useful link:', error);
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
      title="Edit Useful Link"
      description="Update the details of this useful link."
      size="md"
      onSubmit={handleSubmit}
      submitText="Update Link"
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
            <label htmlFor="is_favorite" className="flex items-center gap-2 cursor-pointer">
              <Star className="h-4 w-4 text-yellow-500" />
              Mark as favorite
            </label>
          </div>
        </FormSection>
      </div>
    </FormModal>
  );
}
