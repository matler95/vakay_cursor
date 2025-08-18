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
      description={`Are you sure you want to delete this ${getTransportationTypeLabel(transportation.type).toLowerCase()}? This action cannot be undone and will remove all associated details including dates, times, and notes. Provider: ${transportation.provider}. Route: ${formatLocationDisplay(transportation.departure_location, transportation.type)} → ${formatLocationDisplay(transportation.arrival_location, transportation.type)}${transportation.departure_date ? `. Date: ${new Date(transportation.departure_date).toLocaleDateString()}` : ''}${transportation.departure_time ? `. Time: ${transportation.departure_time}` : ''}${transportation.booking_reference ? `. Booking Ref: ${transportation.booking_reference}` : ''}`}
      confirmText="Delete Transportation"
      cancelText="Cancel"
      variant="destructive"
      onConfirm={handleDelete}
      loading={isDeleting}
    />
  );
}
