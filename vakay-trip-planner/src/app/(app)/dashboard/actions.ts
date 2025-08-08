// src/app/(app)/dashboard/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Database} from '@/types/database.types';

export async function createTrip(prevState: { message: string }, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  const { data: { user }, error: authError, } = await supabase.auth.getUser();
  // ---- ADD THESE TWO LINES ----
  console.log('--- Checking Auth in createTrip Action ---');
  console.log('USER:', user);
  console.log('AUTH ERROR:', authError);
  // -----------------------------

  if (!user) {
    return { message: 'You must be logged in to create a trip.' };
  }

  const schema = z.object({
    name: z.string().min(3, { message: 'Trip name must be at least 3 characters.' }),
    destination: z.string().min(2, { message: 'Destination is required.' }),
    start_date: z.string().date(),
    end_date: z.string().date(),
  });

  const validatedFields = schema.safeParse({
    name: formData.get('name'),
    destination: formData.get('destination'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
  });

  if (!validatedFields.success) {
    return {
      message:
        validatedFields.error.flatten().fieldErrors.name?.[0] ||
        validatedFields.error.flatten().fieldErrors.destination?.[0] ||
        'Invalid data provided.',
    };
  }
  
  const { name, destination, start_date, end_date } = validatedFields.data;

  // 1. Insert the new trip into the 'trips' table
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({ name, destination, start_date, end_date })
    .select('id')
    .single();

  if (tripError || !trip) {
    return { message: `Failed to create trip: ${tripError?.message || 'Unknown error'}` };
  }

  // 2. Make the creator an admin in the 'trip_participants' table
  const { error: participantError } = await supabase
    .from('trip_participants')
    .insert({
      trip_id: trip.id,
      user_id: user.id,
      role: 'admin',
    });

  if (participantError) {
    return { message: `Failed to add creator as admin: ${participantError.message}` };
  }

  revalidatePath('/dashboard');
  redirect(`/trip/${trip.id}`); // We will build this page later
}

// --- ADD THIS NEW FUNCTION ---
export async function deleteTrip(tripId: string) {
  const supabase = createServerActionClient({ cookies });
  
  // RLS policy ensures only an admin can perform this delete.
  // The ON DELETE CASCADE rule in our database will automatically delete
  // all related locations, participants, and itinerary days.
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) {
    console.error('Delete Trip Error:', error);
    // In a real app, you'd want to return an error message.
    return;
  }

  // Refresh the dashboard to show the trip has been removed.
  revalidatePath('/dashboard');
}
