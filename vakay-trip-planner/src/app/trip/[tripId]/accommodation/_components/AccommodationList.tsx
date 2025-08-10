// Accommodation list component
'use client';

import { Bed, MapPin, Calendar, FileText, Copy, ExternalLink, Edit, Trash2, LucideMapPinned } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EditAccommodationModal } from './EditAccommodationModal';
import { DeleteAccommodationModal } from './DeleteAccommodationModal';
import { Database } from '@/types/database.types';

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

  const getStatus = (checkIn: string, checkOut: string) => {
    const now = new Date();
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    if (now < ci) return { label: 'Upcoming', className: 'bg-blue-50 text-blue-700' };
    if (now > co) return { label: 'Past', className: 'bg-gray-50 text-gray-700' };
    return { label: 'Current', className: 'bg-green-50 text-green-700' };
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
    <div className="w-full">
      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-gray-100">
        {accommodations.map((accommodation) => {
          const status = getStatus(accommodation.check_in_date as string, accommodation.check_out_date as string);
          return (
            <div key={accommodation.id} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Bed className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 truncate flex-1">{accommodation.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>{status.label}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-700">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          {formatDate(accommodation.check_in_date)}
                          {accommodation.check_in_time && (<span className="ml-1 text-gray-500">{formatTime(accommodation.check_in_time)}</span>)}
                          <span className="mx-1 text-gray-400">–</span>
                          {formatDate(accommodation.check_out_date)}
                          {accommodation.check_out_time && (<span className="ml-1 text-gray-500">{formatTime(accommodation.check_out_time)}</span>)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1">
                          {calculateNights(accommodation.check_in_date, accommodation.check_out_date)} nights
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 max-w-full">
                          <MapPin className="h-3.5 w-3.5 text-gray-500" />
                          <span className="truncate">{accommodation.address}</span>
                        </span>
                        {(accommodation as any).booking_confirmation && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 max-w-full">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-gray-700 font-mono truncate">{(accommodation as any).booking_confirmation}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {Boolean((accommodation as any).booking_url) && (
                    <Button variant="outline" size="sm" onClick={() => window.open((accommodation as any).booking_url as string, '_blank')} className="h-8 px-3 rounded-full" aria-label="Open booking">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Booking
                    </Button>
                  )}
                  <Button
                    variant="outline"
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
                    className="h-8 px-3 rounded-full"
                    aria-label="Open in maps"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Maps
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onCopyAddress(accommodation.address)} className="h-8 px-3 rounded-full" aria-label="Copy address">
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingAccommodation(accommodation)} className="h-8 px-3 rounded-full" aria-label="Edit accommodation">
                    <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeletingAccommodation(accommodation)} className="h-8 px-3 rounded-full text-red-600 hover:text-red-700" aria-label="Delete accommodation">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Stay</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Dates</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Details</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Maps</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accommodations.map((accommodation) => {
                const status = getStatus(accommodation.check_in_date as string, accommodation.check_out_date as string);
                return (
                  <tr key={accommodation.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Bed className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate max-w-[360px]">{accommodation.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>{status.label}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1 max-w-[520px] truncate">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{accommodation.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        {formatDate(accommodation.check_in_date)}
                        {accommodation.check_in_time && (<span className="ml-1 text-gray-500">{formatTime(accommodation.check_in_time)}</span>)}
                        <span className="mx-1 text-gray-400">–</span>
                        {formatDate(accommodation.check_out_date)}
                        {accommodation.check_out_time && (<span className="ml-1 text-gray-500">{formatTime(accommodation.check_out_time)}</span>)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                        <Button variant="ghost" size="sm" onClick={() => window.open((accommodation as any).booking_url as string, '_blank')} aria-label="Open booking" className="h-8 w-8 p-0 text-gray-500">
                            <ExternalLink className="h-4 w-4" />
                          </Button>

                    </td>
                    <td className="py-4 px-4">
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
                          aria-label="Open in maps"
                          className="h-8 w-8 p-0 text-gray-500"
                        >
                          <LucideMapPinned className="h-4 w-4" />
                        </Button>
</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingAccommodation(accommodation)} aria-label="Edit" className="h-8 w-8 p-0 text-gray-500">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingAccommodation(accommodation)} aria-label="Delete" className="h-8 w-8 p-0 text-gray-500 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
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
