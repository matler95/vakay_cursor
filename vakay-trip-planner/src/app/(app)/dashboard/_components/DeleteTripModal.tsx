// src/app/(app)/dashboard/_components/DeleteTripModal.tsx
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { deleteTrip } from '../actions';
import { StandardModal, Button } from '@/components/ui';

type Trip = Database['public']['Tables']['trips']['Row'];

interface DeleteTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteTripModal({ trip, isOpen, onClose, onDeleted }: DeleteTripModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleDelete = async () => {
    console.log('DeleteTripModal: handleDelete called for trip:', trip.id);
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('tripId', trip.id);

    try {
      console.log('DeleteTripModal: Calling deleteTrip server action');
      const result = await deleteTrip({ message: '' }, formData);
      console.log('DeleteTripModal: Server action result:', result);
      
      if (result && result.message) {
        setMessage(result.message);
        
        if (!result.message.toLowerCase().includes('error')) {
          setMessage('Trip deleted successfully!');
          setTimeout(() => {
            onDeleted();
            onClose();
          }, 1500);
        }
      } else {
        setMessage('Failed to delete trip');
      }
    } catch (error) {
      console.error('DeleteTripModal: Error during deletion:', error);
      setMessage('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button 
        variant="outline" 
        className="flex-1" 
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button 
        variant="destructive"
        className="flex-1"
        onClick={handleDelete}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Deleting...
          </>
        ) : (
          'Delete Trip'
        )}
      </Button>
    </div>
  );

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Trip"
      description={`Are you sure you want to delete "${trip.name}"? This action cannot be undone and will remove all associated data including locations, participants, expenses, and itinerary.`}
      size="lg"
      showFooter
      footer={footer}
    >
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Warning:</strong> This will permanently delete the trip and all its associated data.
          </p>
        </div>
        
        {/* Show server message if any */}
        {message && (
          <div className={`text-sm p-3 rounded-md ${
            message.toLowerCase().includes('error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </StandardModal>
  );
}
