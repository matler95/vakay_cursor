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

  const { data: participantCheck, count } = await supabase
    .from('trip_participants')
    .select('user_id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .eq('user_id', user.id);
  if (!count) notFound();

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();
  if (!trip) notFound();

  const { data: itineraryDays } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('trip_id', tripId);

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('trip_id', tripId)
    .order('name');

  const { data: participantRows } = await supabase
    .from('trip_participants')
    .select('user_id, role')
    .eq('trip_id', tripId);

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

  const { data: participantRole } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  return (
    <TripPageClient
      trip={trip}
      itineraryDays={itineraryDays || []}
      locations={locations || []}
      participants={participants}
      participantRole={participantRole}
    />
  );
}