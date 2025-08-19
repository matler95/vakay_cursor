// Main accommodation view
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { Plus, MapPin, Copy, ExternalLink, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { AccommodationList } from './AccommodationList';
import { AddAccommodationModal } from './AddAccommodationModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Accommodation = Database['public']['Tables']['accommodations']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'];

interface AccommodationViewProps {
  trip: Database['public']['Tables']['trips']['Row'];
  accommodations: Database['public']['Tables']['accommodations']['Row'][];
  expenseStatus: Record<string, boolean>;
  userRole: string | null;
  currentUserId: string;
  onDataRefresh: () => Promise<void>;
}

export function AccommodationView({ 
  trip, 
  accommodations, 
  expenseStatus,
  userRole, 
  currentUserId,
  onDataRefresh
}: AccommodationViewProps) {
  const router = useRouter();
  const [isAddAccommodationModalOpen, setIsAddAccommodationModalOpen] = useState(false);
  


  const refreshData = async () => {
    await onDataRefresh();
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

  const handleViewSurveys = () => {
    window.location.href = `/trip/${trip.id}/accommodation/surveys`;
  };

  return (
    <div className="space-y-6">
      {/* Secondary Header - Accommodation */}
      <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 py-3 border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center gap-4 mb-6">
      <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Accommodation
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your trip accommodations.
            </p>
          </div>
          
                     {/* Controls Section */}
           <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full sm:w-auto">
             {/* View Surveys Button */}
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleViewSurveys}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto"
                      size="sm"
                    >
                      <ClipboardList className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        View Surveys
                      </span>
                      <span className="sm:hidden">
                        Surveys
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Surveys</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

            {/* Add Accommodation Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsAddAccommodationModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    size="sm"
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
      </div>

      {/* Overview Section */}
      

      {/* Content */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow">
        <AccommodationList 
          accommodations={accommodations}
          tripId={trip.id}
          expenseStatus={expenseStatus}
          onAccommodationsChange={async () => {
            await refreshData();
          }}
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
