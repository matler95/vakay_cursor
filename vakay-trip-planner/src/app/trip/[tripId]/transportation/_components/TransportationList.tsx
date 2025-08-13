// Transportation list component
'use client';

import { Database } from '@/types/database.types';
import { Plane, Train, Bus, Car, Ship, MapPin, Calendar, Clock, FileText, Copy, ExternalLink, Edit, Trash2, Navigation, Search, MapPinned, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { EditTransportationModal } from './EditTransportationModal';
import { DeleteTransportationModal } from './DeleteTransportationModal';


type Transportation = Database['public']['Tables']['transportation']['Row'];

interface TransportationListProps {
  transportation: Transportation[];
  tripId: string;
  expenseStatus: Record<string, boolean>;
  onCopyLocation: (text: string) => void;
  onOpenInMaps: (location: string) => void;
}

export function TransportationList({ 
  transportation, 
  tripId,
  expenseStatus,
  onCopyLocation, 
  onOpenInMaps 
}: TransportationListProps) {
  const [editingTransportation, setEditingTransportation] = useState<Transportation | null>(null);
  const [deletingTransportation, setDeletingTransportation] = useState<Transportation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const getStatus = (departureDate: string, arrivalDate: string) => {
    const now = new Date();
    const departure = new Date(departureDate);
    const arrival = new Date(arrivalDate);
    if (now < departure) return 'upcoming';
    if (now > arrival) return 'past';
    return 'current';
  };

  const getStatusChip = (status: 'upcoming' | 'current' | 'past') => {
    switch (status) {
      case 'upcoming':
        return { label: 'Upcoming', className: 'bg-blue-50 text-blue-700' };
      case 'past':
        return { label: 'Past', className: 'bg-gray-50 text-gray-700' };
      default:
        return { label: 'Current', className: 'bg-green-50 text-green-700' };
    }
  };

  const getExpenseStatusChip = (hasExpense: boolean) => {
    if (hasExpense) {
      return { label: 'Expense', className: 'bg-green-50 text-green-700', icon: DollarSign };
    }
    return { label: 'No Expense', className: 'bg-gray-50 text-gray-500', icon: null };
  };

  const filteredSorted = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = transportation.filter((t) => {
      if (!term) return true;
      return (
        t.provider?.toLowerCase().includes(term) ||
        t.departure_location?.toLowerCase().includes(term) ||
        t.arrival_location?.toLowerCase().includes(term) ||
        t.booking_reference?.toLowerCase().includes(term) ||
        t.flight_number?.toLowerCase().includes(term) ||
        t.vehicle_number?.toLowerCase().includes(term)
      );
    });
    // Sort by departure date ascending
    return filtered.sort((a, b) => new Date(a.departure_date as string).getTime() - new Date(b.departure_date as string).getTime());
  }, [transportation, searchTerm]);

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
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-full">
          <Plane className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Transportation</h3>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search transportation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-4">
        {filteredSorted.map((transport) => {
          const Icon = getTransportationIcon(transport.type);
          const typeLabel = getTransportationTypeLabel(transport.type);
          const st = getStatus(transport.departure_date as string, transport.arrival_date as string);
          const chip = getStatusChip(st as any);
          const expenseChip = getExpenseStatusChip(expenseStatus[transport.id] || false);
          
          return (
            <div key={transport.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 truncate">{transport.provider}</h4>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${chip.className}`}>{chip.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${expenseChip.className} flex items-center gap-1`}>
                        {expenseChip.icon && <expenseChip.icon className="h-3 w-3" />}
                        {expenseChip.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{typeLabel}</p>
                  {transport.booking_reference && (
                    <p className="text-xs text-gray-400">#{transport.booking_reference}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <Navigation className="h-3.5 w-3.5 text-gray-500" />
                  <span className="font-medium">From:</span>
                  <span className="truncate">{transport.departure_location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <MapPin className="h-3.5 w-3.5 text-gray-500" />
                  <span className="font-medium">To:</span>
                  <span className="truncate">{transport.arrival_location}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  {formatDate(transport.departure_date)}
                  {transport.departure_time && <span className="ml-1 text-gray-500">{formatTime(transport.departure_time)}</span>}
                  <span className="mx-1 text-gray-400">–</span>
                  {formatDate(transport.arrival_date)}
                  {transport.arrival_time && <span className="ml-1 text-gray-500">{formatTime(transport.arrival_time)}</span>}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenInMaps(transport.departure_location)}
                    className="p-0 text-gray-500"
                  >
                    <MapPinned className="h-4 w-4" />
                    Navigate
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEditingTransportation(transport)} 
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400" 
                    aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setDeletingTransportation(transport)} 
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50" 
                    aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Route</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Departure</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Arrival</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Expense</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((transport) => {
                const Icon = getTransportationIcon(transport.type);
                const typeLabel = getTransportationTypeLabel(transport.type);
                const st = getStatus(transport.departure_date as string, transport.arrival_date as string);
                const chip = getStatusChip(st as any);
                
                return (
                  <tr key={transport.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-gray-600 mt-1">
                              <div className="p-1.5 bg-blue-100 rounded-lg">
                                <Icon className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-900">{transport.provider}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${chip.className}`}>{chip.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1.5">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                              {typeLabel}
                            </span>
                            {transport.booking_reference && (
                              <span className="text-gray-500">#{transport.booking_reference}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Navigation className="h-3 w-3 text-gray-500" />
                          <span className="truncate">{transport.departure_location}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="truncate">{transport.arrival_location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{formatDate(transport.departure_date)}</div>
                        {transport.departure_time && (
                          <div className="text-gray-500">{formatTime(transport.departure_time)}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{formatDate(transport.arrival_date)}</div>
                        {transport.arrival_time && (
                          <div className="text-gray-500">{formatTime(transport.arrival_time)}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const expenseChip = getExpenseStatusChip(expenseStatus[transport.id] || false);
                        return (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${expenseChip.className} flex items-center gap-1 w-fit`}>
                            {expenseChip.icon && <expenseChip.icon className="h-3 w-3" />}
                            {expenseChip.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenInMaps(transport.departure_location)}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400"
                        >
                          <MapPinned className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingTransportation(transport)} 
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setDeletingTransportation(transport)} 
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50">
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
