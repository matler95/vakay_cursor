// Accommodation list component
'use client';

import { Database } from '@/types/database.types';
import { Bed, MapPin, Calendar, Phone, FileText, Copy, ExternalLink, Edit, Trash2, MapPinned, ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EditAccommodationModal } from './EditAccommodationModal';
import { DeleteAccommodationModal } from './DeleteAccommodationModal';

type Accommodation = Database['public']['Tables']['accommodations']['Row'];

interface AccommodationListProps {
  accommodations: Accommodation[];
  onCopyAddress: (text: string) => void;
  onOpenInMaps: (address: string) => void;
}

export function AccommodationList({ 
  accommodations, 
  onCopyAddress, 
  onOpenInMaps 
}: AccommodationListProps) {
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null);
  const [deletingAccommodation, setDeletingAccommodation] = useState<Accommodation | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return nights;
  };

  if (accommodations.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Bed className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No accommodations yet</h3>
        <p className="text-gray-500 mb-4">
          Add your first accommodation to start planning your stay
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {accommodations.map((accommodation) => (
        <div key={accommodation.id} className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: Info */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start sm:items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Bed className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {accommodation.name}
                  </h3>
                  <div className="flex items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{accommodation.address}</span>
                  </div>
                </div>
              </div>

              {/* Dates & details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 sm:mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Check-in:</span>
                    <span className="text-gray-600">
                      {formatDate(accommodation.check_in_date)}
                      {accommodation.check_in_time && (
                        <span className="ml-2 text-gray-500">
                          {formatTime(accommodation.check_in_time)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">Check-out:</span>
                    <span className="text-gray-600">
                      {formatDate(accommodation.check_out_date)}
                      {accommodation.check_out_time && (
                        <span className="ml-2 text-gray-500">
                          {formatTime(accommodation.check_out_time)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium text-gray-700">Duration:</span>
                    <span className="text-gray-600">
                      {calculateNights(accommodation.check_in_date, accommodation.check_out_date)} nights
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {(accommodation as any).booking_confirmation && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Confirmation:</span>
                      <span className="text-gray-600 font-mono truncate">
                        {(accommodation as any).booking_confirmation}
                      </span>
                    </div>
                  )}
                  {(accommodation as any).contact_phone && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Phone:</span>
                      <span className="text-gray-600">{(accommodation as any).contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {(accommodation as any).notes && (
                <div className="mb-2 sm:mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-700">{(accommodation as any).notes}</p>
                </div>
              )}
            </div>

            {/* Right: Actions - grid on mobile, vertical on desktop */}
            <div className="sm:ml-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2 sm:flex sm:flex-col">
              {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyAddress(accommodation.address)}
                  className="flex items-center gap-1 w-full sm:w-auto"
                  aria-label="Copy address"
                >
                  <Copy className="h-3 w-3" />
                  <span className="hidden xs:inline">Address</span>
                  <span className="sm:inline">Address</span>
                </Button> */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open((accommodation as any).booking_url as string, '_blank')}
                  className="flex items-center gap-1 w-full sm:w-auto"
                >
                  <span className="hidden xs:inline">Details </span>
                  <span className="sm:inline">Details </span>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const lat = (accommodation as any).latitude as number | undefined;
                    const lon = (accommodation as any).longitude as number | undefined;
                    if (typeof lat === 'number' && typeof lon === 'number') {
                      window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
                    } else {
                      onOpenInMaps(accommodation.address);
                    }
                  }}
                  className="flex items-center gap-1 w-full sm:w-auto"
                  >
                  <span className="hidden xs:inline">Maps </span>
                  <span className="sm:inline">Maps </span>
                  <MapPinned className="h-4 w-4" />
                  {/* <span className="hidden xs:inline">Maps</span>
                  <span className="sm:inline">Maps</span> */}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingAccommodation(accommodation)}
                  className="flex items-center gap-1 w-full sm:w-auto"
                  aria-label="Edit accommodation"
                >
                  <Edit className="h-4 w-4" />
                  {/* <span className="hidden xs:inline">Edit</span>
                  <span className="sm:inline">Edit</span> */}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingAccommodation(accommodation)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                  aria-label="Delete accommodation"
                >
                  <Trash2 className="h-4 w-4" />
                  {/* <span className="hidden xs:inline">Delete</span>
                  <span className="sm:inline">Delete</span> */}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {editingAccommodation && (
        <EditAccommodationModal
          accommodation={editingAccommodation}
          isOpen={!!editingAccommodation}
          onClose={() => setEditingAccommodation(null)}
          onAccommodationUpdated={() => {
            setEditingAccommodation(null);
            window.location.reload();
          }}
        />
      )}

      {/* Delete Modal */}
      {deletingAccommodation && (
        <DeleteAccommodationModal
          accommodation={deletingAccommodation}
          isOpen={!!deletingAccommodation}
          onClose={() => setDeletingAccommodation(null)}
          onAccommodationDeleted={() => {
            setDeletingAccommodation(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
