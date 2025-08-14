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
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your trip accommodations.
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
