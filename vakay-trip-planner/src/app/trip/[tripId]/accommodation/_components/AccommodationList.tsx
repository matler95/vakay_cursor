// Accommodation list component
'use client';

import { Bed, MapPin, Calendar, FileText, Copy, ExternalLink, Edit, Trash2, Search, MapPinned, BedDoubleIcon, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import { EditAccommodationModal } from './EditAccommodationModal';
import { DeleteAccommodationModal } from './DeleteAccommodationModal';
import { Database } from '@/types/database.types';


type Accommodation = Database['public']['Tables']['accommodations']['Row'];

interface AccommodationListProps {
  accommodations: Accommodation[];
  tripId: string;
  expenseStatus: Record<string, boolean>;
  onCopyAddress: (text: string) => void;
  onOpenInMaps: (address: string) => void;
}

export function AccommodationList({ 
  accommodations, 
  tripId,
  expenseStatus,
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
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Bed className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No accommodations yet</h3>
        <p className="text-gray-500 mb-4">Add your first accommodation to start planning your stay</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3">
      </div>

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

      {/* Mobile cards */}
      <div className="sm:hidden space-y-4">
        {filteredSorted.map((a) => {
          const st = getStatus(a.check_in_date as string, a.check_out_date as string);
          const chip = getStatusChip(st as any);
          const expenseChip = getExpenseStatusChip(expenseStatus[a.id] || false);
          return (
            <div key={a.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{a.name}</h4>
                  <p className="text-sm text-gray-500 truncate">{a.address}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${chip.className}`}>{chip.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${expenseChip.className} flex items-center gap-1`}>
                    {expenseChip.icon && <expenseChip.icon className="h-3 w-3" />}
                    {expenseChip.label}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  {formatDate(a.check_in_date)}
                  {a.check_in_time && <span className="ml-1 text-gray-500">{formatTime(a.check_in_time)}</span>}
                  <span className="mx-1 text-gray-400">–</span>
                  {formatDate(a.check_out_date)}
                  {a.check_out_time && <span className="ml-1 text-gray-500">{formatTime(a.check_out_time)}</span>}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                 <div className="flex gap-2">
                   {Boolean((a as any).booking_url) && (
                     <Button 
                     variant="ghost" 
                     size="sm" onClick={() => window.open((a as any).booking_url as string, '_blank')} 
                     className=" p-0 text-gray-500" 
                     >
                       <ExternalLink className="h-4 w-4" />
                       Details
                     </Button>
                   )}
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => onOpenInMaps(a.address)}
                     className="p-0 text-gray-500"
                   >
                     <MapPinned className="h-4 w-4" />
                     Navigate
                   </Button>

                 </div>
                <div className="flex gap-2">
                  <Button variant="ghost" 
                  size="sm" 
                  onClick={() => setEditingAccommodation(a)} 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400" 
                  aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setDeletingAccommodation(a)} 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50" 
                  >
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
                <th className="text-left py-3 px-4 font-medium text-gray-700">Dates</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Expense</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSorted.map((a) => {
                const st = getStatus(a.check_in_date as string, a.check_out_date as string);
                const chip = getStatusChip(st as any);
                return (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                            <div
                            onClick={() => {window.open((a as any).booking_url as string, '_blank')}}
                            className="flex items-center gap-1  text-gray-600 mt-1 max-w-[520px] truncate cursor-pointer hover:text-blue-600"
                            >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="font-medium text-gray-900 truncate max-w-[360px]">{a.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${chip.className}`}>{chip.label}</span>
                          </div>
                          <div
                            onClick={() => onOpenInMaps(a.address)}
                            className="flex items-center gap-1 text-sm text-gray-500 mt-1.5 cursor-pointer hover:text-blue-600"
                          >
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{a.address}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        {formatDate(a.check_in_date)}
                        {a.check_in_time && (<span className="ml-1 text-gray-500">{formatTime(a.check_in_time)}</span>)}
                        <span className="mx-1 text-gray-400">–</span>
                        {formatDate(a.check_out_date)}
                        {a.check_out_time && (<span className="ml-1 text-gray-500">{formatTime(a.check_out_time)}</span>)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const expenseChip = getExpenseStatusChip(expenseStatus[a.id] || false);
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
                         onClick={() => setEditingAccommodation(a)} 
                         className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400">
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button 
                         variant="ghost" 
                         size="sm" 
                         onClick={() => setDeletingAccommodation(a)} 
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
