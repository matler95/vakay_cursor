'use client';

import { Database } from '@/types/database.types';
import { useState, useEffect } from 'react';
import { useActionState } from 'react';
import { updateTripDetails } from '../actions';
import { Button } from '@/components/ui/button';
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
  const [state, formAction] = useActionState(updateTripDetails, { message: '', status: '' });

  // Watch for successful state changes
  useEffect(() => {
    if (state?.status === 'success') {
      // Success - close modal and refresh trip data
      onTripUpdated();
      onClose();
    }
  }, [state, onTripUpdated, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Edit Trip Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="trip_id" value={trip.id} />
          
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={trip.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              name="destination"
              defaultValue={trip.destination || ''}
              placeholder="e.g., Rome, Italy"
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
              />
            </div>
          </div>

          {state?.message && (
            <p className={`text-sm ${state.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {state.message}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={false}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
