'use client';

import { Database } from '@/types/database.types';
import { useState, useEffect } from 'react';
import { updateTripDetails } from '../actions';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

type Trip = Database['public']['Tables']['trips']['Row'];

interface EditTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: () => void;
}

export function EditTripModal({ trip, isOpen, onClose, onTripUpdated }: EditTripModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    
    try {
      // Add a longer delay to ensure the spinner shows
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const result = await updateTripDetails(null, formData);
      
      if (result.status === 'success') {
        onClose();
        onTripUpdated();
      } else {
        setError(result.message || 'Failed to update trip');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Edit Trip Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="trip_id" value={trip.id} />
          
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={trip.name}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              name="destination"
              defaultValue={trip.destination || ''}
              placeholder="e.g., Rome, Italy"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={trip.start_date || ''}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={trip.end_date || ''}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={18} className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
