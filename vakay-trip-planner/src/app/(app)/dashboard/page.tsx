// src/app/(app)/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/types/database.types';

import { TripList } from './_components/TripList';
import { CreateTripModal } from './_components/CreateTripModal';

export default async function Dashboard() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/'); }

  const { data: tripsData } = await supabase
    .from('trip_participants')
    .select('role, trips(*)')
    .eq('user_id', user.id);
  
  const trips = tripsData?.map(item => ({
    ...(item.trips as Trip),
    user_role: item.role,
  })) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Trips</h2>
          <p className="text-gray-600">Select a trip to view its itinerary or create a new one.</p>
        </div>
        <CreateTripModal />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <TripList trips={trips} />
      </div>
    </div>
  );
}

// Add the Trip type definition here for clarity
type Trip = Database['public']['Tables']['trips']['Row'];
