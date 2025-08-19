// Accommodation list component
'use client';

import { Bed, MapPin, Calendar, FileText, Copy, ExternalLink, Edit, Trash2, Search, MapPinned, BedDoubleIcon, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import { EditAccommodationModal } from './EditAccommodationModal';
import { DeleteAccommodationModal } from './DeleteAccommodationModal';
import { Database } from '@/types/database.types';
import { 
  StandardList, 
  CompactRow, 
  EditButton, 
  DeleteButton,
  EmptyState
} from '@/components/ui';

type Accommodation = Database['public']['Tables']['accommodations']['Row'];

interface AccommodationListProps {
  accommodations: Accommodation[];
  tripId: string;
  expenseStatus: Record<string, boolean>;
  onAccommodationsChange?: (accommodations: Accommodation[]) => void;
  onCopyAddress: (text: string) => void;
  onOpenInMaps: (address: string) => void;
}

export function AccommodationList({ 
  accommodations, 
  tripId,
  expenseStatus,
  onAccommodationsChange,
  onCopyAddress, 
  onOpenInMaps 
}: AccommodationListProps) {
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null);
  const [deletingAccommodation, setDeletingAccommodation] = useState<Accommodation | null>(null);
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
    if (now < ci) return 'upcoming';
    if (now > co) return 'past';
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
    const filtered = accommodations.filter((a) => {
      if (!term) return true;
      return (
        a.name.toLowerCase().includes(term) ||
        a.address.toLowerCase().includes(term) ||
        (a as any).booking_confirmation?.toLowerCase?.().includes(term)
      );
    });
    // Always sort by check-in date ascending
    return filtered.sort((a, b) => new Date(a.check_in_date as string).getTime() - new Date(b.check_in_date as string).getTime());
  }, [accommodations, searchTerm]);

  if (accommodations.length === 0) {
    return (
      <EmptyState
        icon={Bed}
        title="No accommodations yet"
        description="Add your first accommodation to start planning your stay"
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      {/* Search only (align with expenses bar) */}
      <div className="mb-4">
        <div className="w-full sm:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Mobile-Optimized List */}
      <div className="space-y-4">
        {filteredSorted.map((a) => {
          const st = getStatus(a.check_in_date as string, a.check_out_date as string);
          const chip = getStatusChip(st as any);
          const expenseChip = getExpenseStatusChip(expenseStatus[a.id] || false);
          
          return (
            <div
              key={a.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Header with name and status */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold text-gray-900 text-base leading-tight mb-2">
                      {a.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${chip.className}`}>
                        {chip.label}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${expenseChip.className} flex items-center gap-1`}>
                        {expenseChip.icon && <expenseChip.icon className="h-3 w-3" />}
                        {expenseChip.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Bed className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{a.address}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    {formatDate(a.check_in_date)}
                    {a.check_in_time && <span className="ml-1 text-gray-500">{formatTime(a.check_in_time)}</span>}
                    <span className="mx-2 text-gray-400">–</span>
                    {formatDate(a.check_out_date)}
                    {a.check_out_time && <span className="ml-1 text-gray-500">{formatTime(a.check_out_time)}</span>}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({calculateNights(a.check_in_date as string, a.check_out_date as string)} nights)
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  {/* Left side: Details button */}
                  {Boolean((a as any).booking_url) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => window.open((a as any).booking_url as string, '_blank')} 
                      className="h-11"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500 sm:mr-2" />
                      <span className="hidden sm:inline">Details</span>
                    </Button>
                  )}

                  {/* Right side: Edit/Delete buttons */}
                  <div className="flex gap-2">
                    <EditButton
                      onClick={() => setEditingAccommodation(a)}
                      tooltip="Edit accommodation"
                    />
                    <DeleteButton
                      onClick={() => setDeletingAccommodation(a)}
                      tooltip="Delete accommodation"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {editingAccommodation && (
        <EditAccommodationModal
          accommodation={editingAccommodation}
          isOpen={!!editingAccommodation}
          onClose={() => setEditingAccommodation(null)}
          onAccommodationUpdated={() => {
            setEditingAccommodation(null);
            // Call the parent callback to refresh accommodations data
            if (onAccommodationsChange) {
              onAccommodationsChange(accommodations);
            }
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
            // Call the parent callback to refresh accommodations data
            if (onAccommodationsChange) {
              onAccommodationsChange(accommodations);
            }
          }}
        />
      )}
    </div>
  );
}
