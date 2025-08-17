// src/app/(app)/dashboard/_components/TripList.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { deleteTrip } from '../actions';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Plane } from 'lucide-react';
import { useState } from 'react';
import { 
  StandardList, 
  CompactRow, 
  DeleteButton, 
  ConfirmationModal,
  LoadingState,
  EmptyState
} from '@/components/ui';

import Lottie from 'lottie-react';
import flightAnimation from '@/../public/Flight.json';

type TripWithRole = Database['public']['Tables']['trips']['Row'] & {
  user_role: string | null;
};

interface TripListProps {
  trips: TripWithRole[];
}

export function TripList({ trips }: TripListProps) {
  const router = useRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTripId, setLoadingTripId] = useState<string | null>(null);

  const onConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setSubmitting(true);
    // Submit via form action programmatically
    const form = document.getElementById(`delete-form-${pendingDeleteId}`) as HTMLFormElement | null;
    form?.requestSubmit();
    setSubmitting(false);
    setPendingDeleteId(null);
  };

  const handleTripClick = (tripId: string) => {
    setLoadingTripId(tripId);
    router.push(`/trip/${tripId}`);
  };

  if (loadingTripId) {
    return (
      <LoadingState 
        message="Loading trip..." 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      />
    );
  }

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
        {trips.map((trip) => (
          <CompactRow
            key={trip.id}
            leftIcon={<Plane className="h-5 w-5 text-blue-500" />}
            clickable
            onClick={() => handleTripClick(trip.id)}
            actions={
              trip.user_role === 'admin' ? (
                <div className="flex items-center gap-1">
                  <form id={`delete-form-${trip.id}`} action={deleteTrip.bind(null, trip.id)}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DeleteButton
                          onClick={() => setPendingDeleteId(trip.id)}
                          tooltip="Delete trip"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete trip</p>
                      </TooltipContent>
                    </Tooltip>
                  </form>
                </div>
              ) : undefined
            }
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {trip.name}
                  </h3>
                  {trip.start_date && trip.end_date && (
                    <p className="text-sm text-gray-600 truncate">
                      {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CompactRow>
        ))}
      </StandardList>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        title="Delete Trip"
        description="Are you sure you want to delete this trip? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={onConfirmDelete}
        loading={submitting}
      />
    </div>
  );
}