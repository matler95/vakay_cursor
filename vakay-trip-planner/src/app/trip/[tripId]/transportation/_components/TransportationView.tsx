// Main transportation view
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Plus, Plane, Train, Bus, Car, Ship, MapPin, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransportationList } from './TransportationList';
import { AddTransportationModal } from './AddTransportationModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Transportation = Database['public']['Tables']['transportation']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'];

interface TransportationViewProps {
  trip: Database['public']['Tables']['trips']['Row'];
  transportation: Database['public']['Tables']['transportation']['Row'][];
  expenseStatus: Record<string, boolean>;
  userRole: string | null;
  currentUserId: string;
  onDataRefresh: () => Promise<void>;
}

export function TransportationView({ 
  trip, 
  transportation, 
  expenseStatus,
  userRole, 
  currentUserId,
  onDataRefresh
}: TransportationViewProps) {
  const [isAddTransportationModalOpen, setIsAddTransportationModalOpen] = useState(false);

  const refreshData = async () => {
    await onDataRefresh();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openInMaps = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
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

  const getTransportationTypeCount = (type: string) => {
    return transportation.filter(t => t.type === type).length;
  };

  const getNextTransportation = () => {
    const now = new Date();
    const upcoming = transportation
      .filter(t => new Date(t.departure_date) >= now)
      .sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime());
    
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  return (
    <div className="space-y-6">
      {/* Secondary Header - Transportation */}
      <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 py-3 border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Transportation
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your trip transportation and details
            </p>
          </div>
          <div className="flex gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsAddTransportationModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add new transportation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>


      {/* Transportation List */}
      <div className="bg-white rounded-xl shadow">
        <TransportationList 
          transportation={transportation}
          tripId={trip.id}
          expenseStatus={expenseStatus}
          onTransportationChange={async () => {
            await refreshData();
          }}
          onCopyLocation={copyToClipboard}
          onOpenInMaps={openInMaps}
        />
      </div>

      {/* Modals */}
      {isAddTransportationModalOpen && (
        <AddTransportationModal
          tripId={trip.id}
          isOpen={isAddTransportationModalOpen}
          onClose={() => setIsAddTransportationModalOpen(false)}
          onTransportationAdded={() => {
            setIsAddTransportationModalOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
