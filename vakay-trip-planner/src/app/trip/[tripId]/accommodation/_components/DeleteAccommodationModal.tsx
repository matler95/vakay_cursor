'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Bed, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui';

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

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Accommodation"
      description={`Are you sure you want to delete "${accommodation.name}"? This action cannot be undone.`}
      confirmText="Delete Accommodation"
      cancelText="Cancel"
      variant="destructive"
      onConfirm={handleDelete}
      loading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bed className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{accommodation.name}</h3>
            <p className="text-sm text-gray-600">{accommodation.address}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">Warning</h4>
            <p className="text-sm text-red-700 mt-1">
              This will permanently delete the accommodation and all associated information.
            </p>
          </div>
        </div>
      </div>
    </ConfirmationModal>
  );
}
