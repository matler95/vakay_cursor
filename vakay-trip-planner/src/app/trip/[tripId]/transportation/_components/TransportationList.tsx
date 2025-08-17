// Transportation list component
'use client';

import { Database } from '@/types/database.types';
import { Plane, Train, Bus, Car, Ship, MapPin, Calendar, Clock, FileText, Copy, ExternalLink, Edit, Trash2, Navigation, Search, MapPinned, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { EditTransportationModal } from './EditTransportationModal';
import { DeleteTransportationModal } from './DeleteTransportationModal';
import { 
  StandardList, 
  CompactRow, 
  EditButton, 
  DeleteButton,
  EmptyState
} from '@/components/ui';

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
      <EmptyState
        icon={Plane}
        title="No transportation yet"
        description="Add your first transportation to start planning your journey"
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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

      {/* Standardized List */}
      <StandardList>
        {filteredSorted.map((transport) => {
          const Icon = getTransportationIcon(transport.type);
          const typeLabel = getTransportationTypeLabel(transport.type);
          const st = getStatus(transport.departure_date as string, transport.arrival_date as string);
          const chip = getStatusChip(st as any);
          const expenseChip = getExpenseStatusChip(expenseStatus[transport.id] || false);
          
          return (
            <CompactRow
              key={transport.id}
              leftIcon={<Icon className="h-5 w-5 text-blue-500" />}
              clickable={false}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenInMaps(transport.departure_location)}
                    className="p-0 text-gray-500"
                  >
                    <MapPinned className="h-4 w-4" />
                    Navigate
                  </Button>
                  <EditButton 
                    onClick={() => setEditingTransportation(transport)}
                    tooltip="Edit transportation"
                  />
                  <DeleteButton 
                    onClick={() => setDeletingTransportation(transport)}
                    tooltip="Delete transportation"
                  />
                </div>
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">{transport.provider}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${chip.className}`}>
                    {chip.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${expenseChip.className} flex items-center gap-1`}>
                    {expenseChip.icon && <expenseChip.icon className="h-3 w-3" />}
                    {expenseChip.label}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-2">{typeLabel}</p>
                
                {transport.booking_reference && (
                  <p className="text-xs text-gray-400 mb-2">#{transport.booking_reference}</p>
                )}
                
                <div className="space-y-1 mb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <Navigation className="h-3.5 w-3.5 text-gray-500" />
                    <span className="font-medium">From:</span>
                    <span className="truncate">{formatLocationDisplay(transport.departure_location, transport.type)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span className="font-medium">To:</span>
                    <span className="truncate">{formatLocationDisplay(transport.arrival_location, transport.type)}</span>
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
              </div>
            </CompactRow>
          );
        })}
      </StandardList>

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
