// src/app/(app)/dashboard/_components/TripList.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { deleteTrip } from '../actions';
import { EditTripModal } from './EditTripModal';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
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

  if (trips.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        You haven't created any trips yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loadingTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center">
            <Lottie animationData={flightAnimation} loop style={{ width: 96, height: 96 }} />
            <span className="mt-4 text-lg text-white font-semibold">Loading trip...</span>
          </div>
        </div>
      )}
      {trips.map((trip) => (
        <Card key={trip.id} className="group relative transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle
                  onClick={() => handleTripClick(trip.id)}
                  className="cursor-pointer hover:underline"
                >
                  {trip.name}
                </CardTitle>
                {trip.start_date && trip.end_date && (
                  <CardDescription>
                    {new Date(trip.start_date).toLocaleDateString()} -{' '}
                    {new Date(trip.end_date).toLocaleDateString()}
                  </CardDescription>
                )}
              </div>

              {trip.user_role === 'admin' && (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <EditTripModal trip={trip} userRole={trip.user_role} />
                  <form id={`delete-form-${trip.id}`} action={deleteTrip.bind(null, trip.id)}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setPendingDeleteId(trip.id)}
                          aria-label="Delete trip"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete trip</p>
                      </TooltipContent>
                    </Tooltip>
                  </form>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      ))}

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Trip</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this trip? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setPendingDeleteId(null)} disabled={submitting}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={onConfirmDelete} disabled={submitting}>{submitting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}