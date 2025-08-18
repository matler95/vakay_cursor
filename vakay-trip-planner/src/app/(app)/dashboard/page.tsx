// src/app/(app)/dashboard/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/types/database.types';

import { TripList } from './_components/TripList';
import { CreateTripModal } from './_components/CreateTripModal';
import { StandardPageLayout } from '@/components/ui';
import { PageHeader } from '@/components/ui/design-system';

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
    <StandardPageLayout
      maxWidth="lg"
      background="gray"
    >
      <PageHeader
        title="Your Trips"
        description="Select a trip to view its itinerary or create a new one."
      >
        <CreateTripModal />
      </PageHeader>

      <TripList trips={trips} />
    </StandardPageLayout>
  );
}

// Add the Trip type definition here for clarity
type Trip = Database['public']['Tables']['trips']['Row'];
