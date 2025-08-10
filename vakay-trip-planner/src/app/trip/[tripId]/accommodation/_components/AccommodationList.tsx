// Accommodation list component
'use client';

import { Database } from '@/types/database.types';
import { Bed, MapPin, Calendar, Phone, FileText, Copy, ExternalLink, Edit, Trash2 } from 'lucide-react';
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
        <div key={accommodation.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bed className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {accommodation.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{accommodation.address}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
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
                  <div className="flex items-center gap-2 text-sm">
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
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Duration:</span>
                    <span className="text-gray-600">
                      {calculateNights(accommodation.check_in_date, accommodation.check_out_date)} nights
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {accommodation.booking_confirmation && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Confirmation:</span>
                      <span className="text-gray-600 font-mono">
                        {accommodation.booking_confirmation}
                      </span>
                    </div>
                  )}
                  {Boolean((accommodation as any).booking_url) && (
                    <div className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Booking Link:</span>
                      <a
                        href={(accommodation as any).booking_url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate max-w-[200px]"
                        title={(accommodation as any).booking_url as string}
                      >
                        {(accommodation as any).booking_url as string}
                      </a>
                    </div>
                  )}
                  {accommodation.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Phone:</span>
                      <span className="text-gray-600">{accommodation.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {accommodation.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{accommodation.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 ml-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyAddress(accommodation.address)}
                  className="flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Address
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenInMaps(accommodation.address)}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Maps
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAccommodation(accommodation)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingAccommodation(accommodation)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
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
