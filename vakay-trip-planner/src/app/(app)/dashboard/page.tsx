// src/app/(app)/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/types/database.types';

import { CreateTripForm } from './_components/CreateTripForm';
import { TripList } from './_components/TripList';

export default async function Dashboard() {
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect('/'); }

  // --- MODIFIED: Fetch trips AND the user's role for each trip ---
  const { data: tripsData } = await supabase
    .from('trip_participants')
    .select('role, trips(*)') // Select the role from this table, and all trip data
    .eq('user_id', user.id);
  
  // Combine the role and trip data into a single object for easier use
  const trips = tripsData?.map(item => ({
    ...(item.trips as Trip), // Spread all properties of the trip object
    user_role: item.role, // Add the user_role property
  })) ?? [];

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Your Trips</h2>
        <p className="text-gray-500">Select a trip to view its itinerary or create a new one.</p>
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <div className="order-2 md:order-1">
          {/* Pass the new, combined trip data to the list */}
          <TripList trips={trips as any} />
        </div>

        <div className="order-1 md:order-2 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">Create a New Trip</h3>
          <CreateTripForm />
        </div>
      </div>
    </div>
  );
}

// Add the Trip type definition here for clarity
type Trip = Database['public']['Tables']['trips']['Row'];
