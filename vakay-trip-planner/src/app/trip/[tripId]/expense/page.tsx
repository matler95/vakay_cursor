// Expense tracking page
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Database } from '@/types/database.types';
import { ExpenseView } from './_components/ExpenseView';
import { TripNavigation } from '../_components/TripNavigation';
import { addExpense, updateExpenseStatus, updateTripMainCurrency } from './actions';

export const dynamic = 'force-dynamic';

interface ExpensePageProps {
  params: Promise<{
    tripId: string;
  }>;
}

export default async function ExpensePage({ params }: ExpensePageProps) {
  const { tripId } = await params;
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch trip details
  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (!trip) {
    notFound();
  }

  // Fetch user's role in this trip
  const { data: participantRole } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!participantRole) {
    notFound();
  }

  // Fetch expenses with categories
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

  // Fetch expense categories
  const { data: categories } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name');

  // Fetch trip participants
  const { data: tripParticipants } = await supabase
    .from('trip_participants')
    .select(`
      user_id,
      role
    `)
    .eq('trip_id', tripId);

  // Get profile information for participants
  let participantsWithProfiles: Array<{
    user_id: string;
    role: string;
    profiles: {
      id: string;
      full_name: string | null;
    };
  }> = [];
  if (tripParticipants) {
    const userIds = tripParticipants.map(p => p.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    participantsWithProfiles = tripParticipants.map(participant => ({
      ...participant,
      profiles: profiles?.find(p => p.id === participant.user_id) || { id: participant.user_id, full_name: null }
    }));
  }

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Trip Navigation */}
      <TripNavigation tripId={trip.id} />

      <ExpenseView
        trip={trip}
        expenses={expenses || []}
        categories={categories || []}
        tripParticipants={participantsWithProfiles || []}
        userRole={participantRole?.role || null}
        currentUserId={user.id}
        addExpenseAction={addExpense}
        updateExpenseStatusAction={updateExpenseStatus}
        updateTripMainCurrencyAction={updateTripMainCurrency}
      />
    </div>
  );
}
