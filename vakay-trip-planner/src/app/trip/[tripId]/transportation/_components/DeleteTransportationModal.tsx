'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui';

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

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/transportation/${transportation.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onTransportationDeleted();
        onClose();
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

  // Helper function to format location display for flights
  const formatLocationDisplay = (location: string, type: string) => {
    if (type === 'flight') {
      // Extract airport code from location string
      // Expected format: "WAW - Warsaw Chopin Airport, Warsaw" or just "WAW"
      const airportCodeMatch = location.match(/^([A-Z]{3})/);
      if (airportCodeMatch) {
        return airportCodeMatch[1]; // Return just the airport code (e.g., "WAW")
      }
      // Fallback: if no airport code found, return the original location
      return location;
    }
    // For non-flight transportation, return the original location
    return location;
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${getTransportationTypeLabel(transportation.type)}`}
      description="Are you sure you want to delete this transportation? This action cannot be undone and will remove all associated details including dates, times, and notes."
      confirmText="Delete Transportation"
      cancelText="Cancel"
      variant="destructive"
      onConfirm={handleDelete}
      loading={isDeleting}
    >
      {/* Transportation Details */}
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Provider:</span>
            <span>{transportation.provider}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Route:</span>
            <span>
              {formatLocationDisplay(transportation.departure_location, transportation.type)} → {formatLocationDisplay(transportation.arrival_location, transportation.type)}
            </span>
          </div>
          {transportation.departure_date && (
            <div className="flex justify-between">
              <span className="font-medium">Date:</span>
              <span>{new Date(transportation.departure_date).toLocaleDateString()}</span>
            </div>
          )}
          {transportation.departure_time && (
            <div className="flex justify-between">
              <span className="font-medium">Time:</span>
              <span>{transportation.departure_time}</span>
            </div>
          )}
          {transportation.booking_reference && (
            <div className="flex justify-between">
              <span className="font-medium">Booking Ref:</span>
              <span className="font-mono text-sm">{transportation.booking_reference}</span>
            </div>
          )}
        </div>
      </div>
    </ConfirmationModal>
  );
}
