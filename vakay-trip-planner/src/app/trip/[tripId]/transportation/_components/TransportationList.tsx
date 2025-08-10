// Transportation list component
'use client';

import { Database } from '@/types/database.types';
import { Plane, Train, Bus, Car, Ship, MapPin, Calendar, Clock, FileText, Copy, ExternalLink, Edit, Trash2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { EditTransportationModal } from './EditTransportationModal';
import { DeleteTransportationModal } from './DeleteTransportationModal';

type Transportation = Database['public']['Tables']['transportation']['Row'];

interface TransportationListProps {
  transportation: Transportation[];
  onCopyLocation: (text: string) => void;
  onOpenInMaps: (location: string) => void;
}

export function TransportationList({ 
  transportation, 
  onCopyLocation, 
  onOpenInMaps 
}: TransportationListProps) {
  const [editingTransportation, setEditingTransportation] = useState<Transportation | null>(null);
  const [deletingTransportation, setDeletingTransportation] = useState<Transportation | null>(null);

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

  const getTransportationIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return Plane;
      case 'train':
        return Train;
      case 'bus':
        return Bus;
      case 'car_rental':
        return Car;
      case 'ferry':
        return Ship;
      default:
        return Plane;
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
        return 'Other';
    }
  };

  if (transportation.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Plane className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transportation yet</h3>
        <p className="text-gray-500 mb-4">
          Add your first transportation to start planning your journey
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {transportation.map((transport) => {
        const Icon = getTransportationIcon(transport.type);
        const typeLabel = getTransportationTypeLabel(transport.type);
        
        return (
          <div key={transport.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {transport.provider}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        {typeLabel}
                      </span>
                      {transport.booking_reference && (
                        <span className="text-gray-500">
                          #{transport.booking_reference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">From:</span>
                      <span className="text-gray-600">{transport.departure_location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">To:</span>
                      <span className="text-gray-600">{transport.arrival_location}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Departure:</span>
                      <span className="text-gray-600">
                        {formatDate(transport.departure_date)}
                        {transport.departure_time && (
                          <span className="ml-2 text-gray-500">
                            {formatTime(transport.departure_time)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Arrival:</span>
                      <span className="text-gray-600">
                        {formatDate(transport.arrival_date)}
                        {transport.arrival_time && (
                          <span className="ml-2 text-gray-500">
                            {formatTime(transport.arrival_time)}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Type-specific details */}
                {transport.type === 'flight' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      {transport.flight_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Plane className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Flight:</span>
                          <span className="text-gray-600 font-mono">{transport.flight_number}</span>
                        </div>
                      )}
                      {transport.terminal && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Terminal:</span>
                          <span className="text-gray-600">{transport.terminal}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {transport.gate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Gate:</span>
                          <span className="text-gray-600">{transport.gate}</span>
                        </div>
                      )}
                      {transport.seat && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Seat:</span>
                          <span className="text-gray-600">{transport.seat}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {transport.type === 'train' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      {transport.vehicle_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Train className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Train:</span>
                          <span className="text-gray-600 font-mono">{transport.vehicle_number}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {transport.carriage_coach && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Coach:</span>
                          <span className="text-gray-600">{transport.carriage_coach}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {transport.type === 'car_rental' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      {transport.pickup_location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Pickup:</span>
                          <span className="text-gray-600">{transport.pickup_location}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {transport.dropoff_location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">Dropoff:</span>
                          <span className="text-gray-600">{transport.dropoff_location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {transport.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{transport.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCopyLocation(transport.departure_location)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    From
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenInMaps(transport.departure_location)}
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
                    onClick={() => setEditingTransportation(transport)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingTransportation(transport)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Edit Modal */}
      {editingTransportation && (
        <EditTransportationModal
          transportation={editingTransportation}
          isOpen={!!editingTransportation}
          onClose={() => setEditingTransportation(null)}
          onTransportationUpdated={() => {
            setEditingTransportation(null);
            window.location.reload();
          }}
        />
      )}

      {/* Delete Modal */}
      {deletingTransportation && (
        <DeleteTransportationModal
          transportation={deletingTransportation}
          isOpen={!!deletingTransportation}
          onClose={() => setDeletingTransportation(null)}
          onTransportationDeleted={() => {
            setDeletingTransportation(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
