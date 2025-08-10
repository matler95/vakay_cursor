'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { X, Bed, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Accommodation = Database['public']['Tables']['accommodations']['Row'];

interface DeleteAccommodationModalProps {
  accommodation: Accommodation;
  isOpen: boolean;
  onClose: () => void;
  onAccommodationDeleted: () => void;
}

export function DeleteAccommodationModal({
  accommodation,
  isOpen,
  onClose,
  onAccommodationDeleted
}: DeleteAccommodationModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/accommodation/${accommodation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onAccommodationDeleted();
      } else {
        console.error('Failed to delete accommodation');
        alert('Failed to delete accommodation. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      alert('Failed to delete accommodation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Accommodation</h2>
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

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bed className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{accommodation.name}</h3>
              <p className="text-sm text-gray-600">{accommodation.address}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Are you sure?</h4>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone. This will permanently delete the accommodation
                  "{accommodation.name}" and all associated information.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isLoading ? 'Deleting...' : 'Delete Accommodation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
