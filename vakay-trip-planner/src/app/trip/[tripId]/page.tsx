'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Database } from '@/types/database.types';
import { TripPageClient } from './_components/TripPageClient';

interface TripPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripPage({ params }: TripPageProps) {
  const { tripId } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) notFound();

  // Check if user is a participant
  const { count } = await supabase
    .from('trip_participants')
    .select('user_id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('user_id', user.id);
  if (!count) notFound();

  // Fetch all trip data upfront in parallel
  const [
    { data: trip },
    { data: itineraryDays },
    { data: locations },
    { data: participantRows },
    { data: accommodations },
    { data: transportation },
    { data: usefulLinks },
    { data: expenses },
    { data: expenseCategories },
    { data: participantRole }
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase.from('itinerary_days').select('*').eq('trip_id', tripId),
    supabase.from('locations').select('*').eq('trip_id', tripId).order('name'),
    supabase.from('trip_participants').select('user_id, role').eq('trip_id', tripId),
    supabase.from('accommodations').select('*').eq('trip_id', tripId).order('check_in_date', { ascending: true }),
    supabase.from('transportation').select('*').eq('trip_id', tripId).order('departure_date', { ascending: true }),
    supabase.from('useful_links').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    supabase.from('expenses').select(`
      *,
      expense_categories (
        id,
        name,
        icon,
        color
      )
    `).eq('trip_id', tripId).order('created_at', { ascending: false }),
    supabase.from('expense_categories').select('*').order('name'),
    supabase.from('trip_participants').select('role').eq('trip_id', tripId).eq('user_id', user.id).single()
  ]);

  if (!trip) notFound();

  // Build participants with profiles
  let participants: { role: string | null; profiles: { id: string; full_name: string | null } }[] = [];
  if (participantRows && participantRows.length > 0) {
    const userIds = participantRows.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
    participants = participantRows.map(p => ({
      role: p.role,
      profiles: { id: p.user_id, full_name: profileMap.get(p.user_id) ?? null },
    }));
  }
  
  // Ensure participants is always an array
  if (!participants || participants.length === 0) {
    participants = [];
  }

  // Build expense status maps
  const accommodationExpenseStatus: Record<string, boolean> = {};
  if (accommodations && accommodations.length > 0) {
    for (const accommodation of accommodations) {
      const expectedDescription = `${accommodation.name} ${accommodation.address}`;
      const { data: existingExpense } = await supabase
        .from('expenses')
        .select('id')
        .eq('trip_id', tripId)
        .eq('description', expectedDescription)
        .single();
      accommodationExpenseStatus[accommodation.id] = !!existingExpense;
    }
  }

  const transportationExpenseStatus: Record<string, boolean> = {};
  if (transportation && transportation.length > 0) {
    for (const transport of transportation) {
      const formatLocationDisplay = (location: string, type: string) => {
        if (type === 'flight') {
          const airportCodeMatch = location.match(/^([A-Z]{3})/);
          if (airportCodeMatch) {
            return airportCodeMatch[1];
          }
          return location;
        }
        return location;
      };

      const expectedDescription = `${transport.provider} ${formatLocationDisplay(transport.departure_location, transport.type)} → ${formatLocationDisplay(transport.arrival_location, transport.type)}`;
      const { data: existingExpense } = await supabase
        .from('expenses')
        .select('id')
        .eq('trip_id', tripId)
        .eq('description', expectedDescription)
        .single();
      
      transportationExpenseStatus[transport.id] = !!existingExpense;
    }
  }

  return (
    <TripPageClient
      trip={trip}
      itineraryDays={itineraryDays || []}
      locations={locations || []}
      participants={participants || []}
      participantRole={participantRole}
      accommodations={accommodations || []}
      transportation={transportation || []}
      usefulLinks={usefulLinks || []}
      expenses={expenses || []}
      expenseCategories={expenseCategories || []}
      accommodationExpenseStatus={accommodationExpenseStatus || {}}
      transportationExpenseStatus={transportationExpenseStatus || {}}
      currentUserId={user.id}
    />
  );
}