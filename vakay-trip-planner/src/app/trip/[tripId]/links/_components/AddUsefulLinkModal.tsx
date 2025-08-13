// Add useful link modal
'use client';

import { useState } from 'react';
import { X, Link as LinkIcon, MapPin, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LinkIcon className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add Useful Link</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Best Pizza Place"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the place or service"
              rows={3}
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
                className="pl-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Phone number"
                className="pl-10"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or tips"
              rows={2}
            />
          </div>

          {/* Favorite */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_favorite"
              checked={formData.is_favorite}
              onCheckedChange={(checked) => handleInputChange('is_favorite', checked as boolean)}
            />
            <Label htmlFor="is_favorite" className="flex items-center gap-2 cursor-pointer">
              <Star className="h-4 w-4 text-yellow-500" />
              Mark as favorite
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.title || !formData.url}
            >
              {isLoading ? 'Adding...' : 'Add Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
