'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Database } from '@/types/database.types';
import { ExpenseAnalytics } from '../_components/ExpenseAnalytics';

interface AnalyticsPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { tripId } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });

  // Get user authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/');
  }

  // Check if user is a participant in this trip
  const { data: participantData } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!participantData) {
    notFound();
  }

  // Get trip details
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (!trip) {
    notFound();
  }

  // Get expenses with categories
  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  // Get trip participants with profiles
  const { data: participantRows } = await supabase
    .from('trip_participants')
    .select('user_id, role')
    .eq('trip_id', tripId);

  let tripParticipants: { user_id: string; role: string; profiles: { id: string; full_name: string | null } }[] = [];
  if (participantRows && participantRows.length > 0) {
    const userIds = participantRows.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));
    tripParticipants = participantRows.map(p => ({
      user_id: p.user_id,
      role: p.role,
      profiles: { id: p.user_id, full_name: profileMap.get(p.user_id) ?? null },
    }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ExpenseAnalytics
          expenses={expenses || []}
          tripParticipants={tripParticipants}
          mainCurrency={trip.main_currency || 'USD'}
          tripStartDate={trip.start_date}
          tripEndDate={trip.end_date}
        />
      </div>
    </div>
  );
}
