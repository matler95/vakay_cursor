// src/app/trip/[tripId]/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// --- MODIFIED: The function now returns a 'status' in all paths ---
export async function saveItineraryDay(prevState: any, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z.object({
    trip_id: z.string().uuid(),
    date: z.string().date(),
    notes: z.string().optional(),
    location_1_id: z.string().optional(),
    location_2_id: z.string().optional(),
  });

  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { status: 'error', message: 'Invalid data.' };
  }

  const location1Id = validatedFields.data.location_1_id ? Number(validatedFields.data.location_1_id) : null;
  const location2Id = validatedFields.data.location_2_id ? Number(validatedFields.data.location_2_id) : null;
  const { trip_id, date, notes } = validatedFields.data;

  const { error } = await supabase.from('itinerary_days').upsert(
    { trip_id, date, notes, location_1_id: location1Id, location_2_id: location2Id },
    { onConflict: 'trip_id, date' }
  );

  if (error) {
    console.error('Upsert Error:', error);
    return { status: 'error', message: `Failed to save day: ${error.message}` };
  }

  revalidatePath(`/trip/${trip_id}`);
  return { status: 'success', message: 'Saved!' };
}



export async function addLocation(prevState: any, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z.object({
    trip_id: z.string().uuid(),
    name: z.string().min(1, { message: 'Location name cannot be empty.' }),
    color: z.string(),
  });

  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: 'Invalid data.' };
  }
  
  const { error } = await supabase.from('locations').insert(validatedFields.data);

  if (error) {
    return { message: `Failed to add location: ${error.message}` };
  }

  revalidatePath(`/trip/${validatedFields.data.trip_id}`);
  return { message: 'Location added!' };
}


export async function deleteLocation(locationId: number, tripId: string) {
  const supabase = createServerActionClient({ cookies });

  // The RLS policy we created ensures only valid users can perform this action.
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId);

  if (error) {
    console.error('Delete Error:', error);
    // In a real app, you might want to return an error message to the user.
    return;
  }

  // Refresh the data on the trip page.
  revalidatePath(`/trip/${tripId}`);
}


// --- ADD THIS NEW FUNCTION ---
export async function inviteUser(prevState: any, formData: FormData) {
  const tripId = formData.get('trip_id') as string;
  const email = formData.get('email') as string;

  // Create a regular client to check the current user's permissions
  const supabase = createServerActionClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  // Check if the current user is an admin of this trip
  const { data: participant } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (participant?.role !== 'admin') {
    return { message: 'You do not have permission to invite users.' };
  }
  
  // Create a special admin client to invite users
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Invite the user by email
  const { data: invitedUser, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

  if (inviteError) {
    return { message: `Error inviting user: ${inviteError.message}` };
  }

  // Add the invited user to the trip_participants table
  const { error: addError } = await supabase
    .from('trip_participants')
    .insert({
      trip_id: tripId,
      user_id: invitedUser.user.id,
      role: 'traveler', // Invited users are travelers by default
    });
  
  if (addError) {
    return { message: `Error adding user to trip: ${addError.message}` };
  }

  revalidatePath(`/trip/${tripId}`);
  return { message: `Invitation sent to ${email}!` };
}

export async function updateTripDetails(prevState: any, formData: FormData) {
  const schema = z.object({
    trip_id: z.string().uuid(),
    name: z.string().min(3, { message: 'Trip name must be at least 3 characters.' }),
    destination: z.string().optional(),
    start_date: z.string().date(),
    end_date: z.string().date(),
  });

  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { status: 'error', message: 'Invalid data provided.' };
  }
  
  // --- FIX: Separate the ID from the data we want to update ---
  const { trip_id, ...updateData } = validatedFields.data;

  const supabase = createServerActionClient({ cookies });

  // Security check for admin role remains the same...
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', trip_id)
    .eq('user_id', user.id)
    .single();

  if (participant?.role !== 'admin') {
    return { status: 'error', message: 'You do not have permission to edit this trip.' };
  }
  
  // --- FIX: Use the separated data for the update ---
  const { error } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', trip_id);
  
  if (error) {
    return { status: 'error', message: `Failed to update trip: ${error.message}` };
  }
  
  revalidatePath(`/trip/${trip_id}`);
  revalidatePath('/dashboard'); // Also revalidate the dashboard
  return { status: 'success', message: 'Trip details updated!' };
}

// --- ADD THIS NEW FUNCTION ---
export async function bulkUpdateDays(
  tripId: string,
  selectedDates: string[],
  formData: FormData
) {
  const supabase = createServerActionClient({ cookies });

  // 1. Get the location ID from the form
  const locationId = formData.get('location_id')
    ? Number(formData.get('location_id'))
    : null;

  // 2. Security Check: Verify the user is an admin of this trip
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Should be blocked by middleware, but good practice

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (participant?.role !== 'admin') {
    console.error('Permission denied: User is not an admin for this trip.');
    return;
  }

  // 3. Prepare the data for the bulk upsert
  const dataToUpsert = selectedDates.map((date) => ({
    trip_id: tripId,
    date: date,
    location_1_id: locationId,
    // Note: This action could be expanded to also set notes, transfers, etc.
  }));

  // 4. Perform the bulk operation
  if (dataToUpsert.length > 0) {
    const { error } = await supabase
      .from('itinerary_days')
      .upsert(dataToUpsert, { onConflict: 'trip_id, date' });
    
    if (error) {
      console.error('Bulk Upsert Error:', error);
      return;
    }
  }

  // 5. Revalidate the path to refresh the UI
  revalidatePath(`/trip/${tripId}`);
}
