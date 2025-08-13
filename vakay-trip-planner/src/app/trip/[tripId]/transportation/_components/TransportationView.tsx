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
  trip: Trip;
  transportation: Transportation[];
  expenseStatus: Record<string, boolean>;
  userRole: string | null;
  currentUserId: string;
}

export function TransportationView({ 
  trip, 
  transportation, 
  expenseStatus,
  userRole, 
  currentUserId 
}: TransportationViewProps) {
  const [isAddTransportationModalOpen, setIsAddTransportationModalOpen] = useState(false);

  const refreshData = () => {
    window.location.reload();
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
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Transportation
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your trip transportation and travel details
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
                  Add Transportation
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new transportation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Transportation Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plane className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{transportation.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plane className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Flights</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTransportationTypeCount('flight')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Train className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Trains</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTransportationTypeCount('train')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Next Trip</p>
              <p className="text-lg font-semibold text-gray-900">
                {getNextTransportation() ? (
                  new Date(getNextTransportation()!.departure_date).toLocaleDateString('en-US', { 
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

      {/* Transportation List */}
      <div className="bg-white rounded-xl shadow">
        <TransportationList 
          transportation={transportation}
          tripId={trip.id}
          expenseStatus={expenseStatus}
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
