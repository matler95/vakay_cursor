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
      description={`Are you sure you want to delete "${accommodation.name}"? This action cannot be undone. This will permanently delete the accommodation and all associated information.`}
      confirmText="Delete Accommodation"
      cancelText="Cancel"
      variant="destructive"
      onConfirm={handleDelete}
      loading={isLoading}
      size="md"
    />
  );
}
