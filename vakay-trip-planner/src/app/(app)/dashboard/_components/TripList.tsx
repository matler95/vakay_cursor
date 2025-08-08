// src/app/(app)/dashboard/_components/TripList.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { deleteTrip } from '../actions';
import { EditTripModal } from './EditTripModal';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type TripWithRole = Database['public']['Tables']['trips']['Row'] & {
  user_role: string | null;
};

interface TripListProps {
  trips: TripWithRole[];
}

export function TripList({ trips }: TripListProps) {
  const router = useRouter();

  if (trips.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        You haven't created any trips yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trips.map((trip) => (
        <Card key={trip.id} className="group relative transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle
                  onClick={() => router.push(`/trip/${trip.id}`)}
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
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <EditTripModal trip={trip} userRole={trip.user_role} />
                  
                  <form
                    action={deleteTrip.bind(null, trip.id)}
                    onSubmit={(e) => {
                      if (!confirm('Are you sure you want to delete this trip?')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}