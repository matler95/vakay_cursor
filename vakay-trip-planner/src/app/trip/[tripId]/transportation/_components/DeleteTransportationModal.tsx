'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Transportation = Database['public']['Tables']['transportation']['Row'];

interface DeleteTransportationModalProps {
  transportation: Transportation;
  isOpen: boolean;
  onClose: () => void;
  onTransportationDeleted: () => void;
}

export function DeleteTransportationModal({
  transportation,
  isOpen,
  onClose,
  onTransportationDeleted,
}: DeleteTransportationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/transportation/${transportation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onTransportationDeleted();
      } else {
        console.error('Failed to delete transportation');
      }
    } catch (error) {
      console.error('Error deleting transportation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTransportationTypeLabel = (type: string) => {
    switch (type) {
      case 'flight':
        return 'Flight';
      case 'train':
        return 'Train';
      case 'bus':
        return 'Bus';
      case 'car_rental':
        return 'Car Rental';
      case 'ferry':
        return 'Ferry';
      default:
        return 'Transportation';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Delete Transportation</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Delete {getTransportationTypeLabel(transportation.type)}
              </h3>
              <p className="text-sm text-gray-600">
                {transportation.provider} - {transportation.departure_location} to {transportation.arrival_location}
              </p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this transportation? This action cannot be undone and will remove all associated details including dates, times, and notes.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
