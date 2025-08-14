// Main useful links view
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Plus, Link as LinkIcon, MapPin, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UsefulLinksList } from './UsefulLinksList';
import { AddUsefulLinkModal } from './AddUsefulLinkModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type UsefulLink = Database['public']['Tables']['useful_links']['Row'];
type Trip = Database['public']['Tables']['trips']['Row'];

interface UsefulLinksViewProps {
  trip: Trip;
  usefulLinks: UsefulLink[];
  userRole: string | null;
  currentUserId: string;
}

export function UsefulLinksView({ 
  trip, 
  usefulLinks, 
  userRole, 
  currentUserId 
}: UsefulLinksViewProps) {
  const [isAddUsefulLinkModalOpen, setIsAddUsefulLinkModalOpen] = useState(false);

  const refreshData = () => {
    window.location.reload();
  };

  const getCategoryCount = (category: string) => {
    return usefulLinks.filter(link => link.category === category).length;
  };

  const getFavoriteCount = () => {
    return usefulLinks.filter(link => link.is_favorite).length;
  };

  return (
    <div className="space-y-6">
      {/* Secondary Header - Useful Links */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Useful Links
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Store and organize your favorite links
          </p>
        </div>
        <div className="flex gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsAddUsefulLinkModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add new useful link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Useful Links Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LinkIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Links</p>
              <p className="text-2xl font-bold text-gray-900">{usefulLinks.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">{getFavoriteCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{getCategoryCount('restaurant')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <span className="text-lg">🏨</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Accommodations</p>
              <p className="text-2xl font-bold text-gray-900">{getCategoryCount('accommodation')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Useful Links List */}
      <div className="bg-white rounded-xl shadow">
        <UsefulLinksList 
          usefulLinks={usefulLinks}
          tripId={trip.id}
          onLinkUpdated={() => refreshData()}
        />
      </div>

      {/* Modals */}
      {isAddUsefulLinkModalOpen && (
        <AddUsefulLinkModal
          tripId={trip.id}
          isOpen={isAddUsefulLinkModalOpen}
          onClose={() => setIsAddUsefulLinkModalOpen(false)}
          onLinkAdded={() => {
            setIsAddUsefulLinkModalOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
