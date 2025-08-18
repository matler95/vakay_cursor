// src/app/(app)/dashboard/_components/TripList.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { deleteTrip } from '../actions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plane, Edit } from 'lucide-react'; // Edit icon imported
import { useState } from 'react';
import { 
  StandardList, 
  CompactRow, 
  DeleteButton, 
  EditButton, // EditButton imported
  ConfirmationModal,
  LoadingState,
  EmptyState
} from '@/components/ui';
import { EditTripModal } from './EditTripModal'; // EditTripModal imported
import { DeleteTripModal } from './DeleteTripModal'; // DeleteTripModal imported

type TripWithRole = Database['public']['Tables']['trips']['Row'] & {
  user_role: string | null;
};

interface TripListProps {
  trips: TripWithRole[];
}

export function TripList({ trips }: TripListProps) {
  const router = useRouter();
  const [editingTrip, setEditingTrip] = useState<TripWithRole | null>(null); // State for edit modal
  const [deletingTrip, setDeletingTrip] = useState<TripWithRole | null>(null); // State for delete modal
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);

  const handleTripUpdated = () => {
    window.location.reload(); // Refresh page after update
  };

  const handleTripDeleted = () => {
    window.location.reload(); // Refresh page after deletion
  };

  const handleTripClick = (tripId: string) => {
    setLoadingTripId(tripId); // Show loading immediately
    router.push(`/trip/${tripId}`);
  };

  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Plane}
        title="No trips yet"
        description="You haven't created any trips yet. Start planning your next adventure!"
      />
    );
  }

  return (
    <div className="space-y-4">
      <StandardList>
        {trips.map((trip) => {
          const isLoading = loadingTripId === trip.id;
          return (
            <CompactRow
              key={trip.id}
              leftIcon={isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              ) : (
                <Plane className="h-5 w-5 text-blue-500" />
              )}
              clickable={!isLoading}
              onClick={() => !isLoading && handleTripClick(trip.id)}
              actions={
                trip.user_role === 'admin' ? (
                  <div className="flex items-center gap-1">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <EditButton
                            onClick={() => setEditingTrip(trip)}
                            tooltip="Edit trip"
                            disabled={isLoading}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit trip</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DeleteButton
                            onClick={() => setDeletingTrip(trip)}
                            tooltip="Delete trip"
                            disabled={isLoading}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete trip</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ) : undefined
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium truncate ${isLoading ? 'text-gray-400' : 'text-gray-900'}`}>
                      {trip.name}
                    </h3>
                    {trip.start_date && trip.end_date && (
                      <p className={`text-sm truncate ${isLoading ? 'text-gray-300' : 'text-gray-600'}`}>
                        {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CompactRow>
          );
        })}
      </StandardList>

      {/* Edit Trip Modal */}
      {editingTrip && (
        <EditTripModal
          trip={editingTrip}
          isOpen={!!editingTrip}
          onClose={() => setEditingTrip(null)}
          onTripUpdated={handleTripUpdated}
        />
      )}

      {/* Delete Trip Modal */}
      {deletingTrip && (
        <DeleteTripModal
          trip={deletingTrip}
          isOpen={!!deletingTrip}
          onClose={() => setDeletingTrip(null)}
          onDeleted={handleTripDeleted}
        />
      )}
    </div>
  );
}