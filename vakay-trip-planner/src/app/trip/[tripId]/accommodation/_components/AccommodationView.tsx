// Main accommodation view
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Plus, MapPin, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccommodationList } from './AccommodationList';
import { AddAccommodationModal } from './AddAccommodationModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Accommodation = Database['public']['Tables']['accommodations']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'];

interface AccommodationViewProps {
  trip: Trip;
  accommodations: Accommodation[];
  expenseStatus: Record<string, boolean>;
  userRole: string | null;
  currentUserId: string;
}

export function AccommodationView({ 
  trip, 
  accommodations, 
  expenseStatus,
  userRole, 
  currentUserId 
}: AccommodationViewProps) {
  const [isAddAccommodationModalOpen, setIsAddAccommodationModalOpen] = useState(false);

  const refreshData = () => {
    window.location.reload();
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {}
    // Fallback for insecure contexts or older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {}
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Secondary Header - Accommodation */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Accommodation
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your trip accommodations and lodging details
          </p>
        </div>
        <div className="flex gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsAddAccommodationModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new accommodation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Accommodation Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            {/* <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div> */}
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stays</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{accommodations.length}</p>
                </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            {/* <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div> */}
            <div>
              <p className="text-sm font-medium text-gray-600">Nights</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-gray-900">
                  {accommodations.reduce((total, acc) => {
                    const checkIn = new Date(acc.check_in_date);
                    const checkOut = new Date(acc.check_out_date);
                    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                    return total + nights;
                  }, 0)}
                </p>
              </div>    
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            {/* <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div> */}
            <div>
              <p className="text-sm font-medium text-gray-600">Next Stay</p>
              <div className="flex items-center gap-2">
                {/* <MapPin className="h-5 w-5 text-purple-600" /> */}
                <p className="text-lg font-semibold text-gray-900">
                  {accommodations.length > 0 ? (
                    new Date(accommodations[0].check_in_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  ) : (
                    'None'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accommodation List */}
      <div className="bg-white rounded-xl shadow">
        <AccommodationList 
          accommodations={accommodations}
          tripId={trip.id}
          expenseStatus={expenseStatus}
          onCopyAddress={copyToClipboard}
          onOpenInMaps={openInMaps}
        />
      </div>

      {/* Modals */}
      {isAddAccommodationModalOpen && (
        <AddAccommodationModal
          tripId={trip.id}
          isOpen={isAddAccommodationModalOpen}
          onClose={() => setIsAddAccommodationModalOpen(false)}
          onAccommodationAdded={() => {
            setIsAddAccommodationModalOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
