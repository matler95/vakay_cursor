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
  trip: Database['public']['Tables']['trips']['Row'];
  usefulLinks: Database['public']['Tables']['useful_links']['Row'][];
  userRole: string | null;
  currentUserId: string;
  onDataRefresh: () => Promise<void>;
}

export function UsefulLinksView({ 
  trip, 
  usefulLinks, 
  userRole, 
  currentUserId,
  onDataRefresh
}: UsefulLinksViewProps) {
  const [isAddUsefulLinkModalOpen, setIsAddUsefulLinkModalOpen] = useState(false);

  const refreshData = async () => {
    await onDataRefresh();
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
      <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 py-3 border-b border-gray-200 shadow-sm">
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
