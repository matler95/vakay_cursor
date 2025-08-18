// src/app/trip/[tripId]/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { z } from 'zod';
import { Database } from '@/types/database.types';

type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];

// Schema for validating itinerary day data
const itineraryDaySchema = z.object({
  date: z.string(),
  trip_id: z.string(),
  location_1_id: z.number().nullable(),
  location_2_id: z.number().nullable(),
  notes: z.string().nullable(),
  summary: z.string().nullable(),
});

const saveItinerarySchema = z.object({
  tripId: z.string(),
  itineraryDays: z.array(itineraryDaySchema),
});

export async function saveItineraryChanges(prevState: { message: string }, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'You must be logged in to save itinerary changes.' };
  }

  // Parse and validate the form data
  const tripId = formData.get('tripId');
  const itineraryDaysJson = formData.get('itineraryDays');
  
  if (!tripId || !itineraryDaysJson || typeof tripId !== 'string' || typeof itineraryDaysJson !== 'string') {
    return { message: 'Missing required data.' };
  }

  const tripIdStr = tripId as string;
  const itineraryDaysJsonStr = itineraryDaysJson as string;

  // Check if user has access to this trip
  const { count } = await supabase
    .from('trip_participants')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', tripIdStr)
    .eq('user_id', user.id);

  if (count === 0) {
    return { message: 'You do not have permission to edit this trip.' };
  }

  let itineraryDays: ItineraryDay[];
  try {
    itineraryDays = JSON.parse(itineraryDaysJsonStr);
  } catch {
    return { message: 'Invalid itinerary data format.' };
  }

  // Validate the data structure
  const validation = saveItinerarySchema.safeParse({
    tripId: tripIdStr,
    itineraryDays,
  });

  if (!validation.success) {
    return { message: 'Invalid itinerary data.' };
  }

  try {
    // Start a transaction-like operation
    const { error: upsertError } = await supabase
      .from('itinerary_days')
      .upsert(
        itineraryDays.map(day => ({
          trip_id: day.trip_id,
          date: day.date,
          location_1_id: day.location_1_id,
          location_2_id: day.location_2_id,
          notes: day.notes,
          summary: day.summary,
        })),
        {
          onConflict: 'trip_id,date',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      console.error('Save itinerary error:', upsertError);
      return { message: `Failed to save itinerary: ${upsertError.message}` };
    }

    // Revalidate the trip page to show updated data
    revalidatePath(`/trip/${tripIdStr}`);
    
  } catch (error) {
    console.error('Unexpected error saving itinerary:', error);
    return { message: 'An unexpected error occurred while saving the itinerary.' };
  }
}

// Helper function to delete itinerary days (for cleanup)
export async function deleteItineraryDay(tripId: string, date: string) {
  const supabase = createServerActionClient<Database>({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'You must be logged in to delete itinerary days.' };
  }

  const { error } = await supabase
    .from('itinerary_days')
    .delete()
    .eq('trip_id', tripId)
    .eq('date', date);

  if (error) {
    console.error('Delete itinerary day error:', error);
    return { message: `Failed to delete itinerary day: ${error.message}` };
  }

  revalidatePath(`/trip/${tripId}`);
  return { message: 'Itinerary day deleted successfully!' };
}

// Location management functions
export async function addLocation(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z.object({
    trip_id: z.string().uuid(),
    name: z.string().min(1, { message: 'Location name cannot be empty.' }),
    description: z.string().optional(),
    color: z.string(),
  });

  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: 'Invalid data.' };
  }
  
  const { error } = await supabase.from('locations').insert({
    ...validatedFields.data,
    description: validatedFields.data.description || null
  });

  if (error) {
    return { message: `Failed to add location: ${error.message}` };
  }

  revalidatePath(`/trip/${validatedFields.data.trip_id}`);
  return { message: 'Location added!' };
}


export async function updateLocation(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z.object({
    location_id: z.string().transform(val => parseInt(val)),
    trip_id: z.string().uuid(),
    name: z.string().min(1, { message: 'Location name cannot be empty.' }),
    description: z.string().optional(),
    color: z.string(),
  });

  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: 'Invalid data.' };
  }

  // Check if user has access to this trip
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: 'You must be logged in to update locations.' };
  }

  const { count } = await supabase
    .from('trip_participants')
    .select('*', { count: 'exact', head: true })
    .eq('trip_id', validatedFields.data.trip_id)
    .eq('user_id', user.id);

  if (count === 0) {
    return { message: 'You do not have permission to edit this trip.' };
  }

  const { error } = await supabase
    .from('locations')
    .update({
      name: validatedFields.data.name,
      description: validatedFields.data.description || null,
      color: validatedFields.data.color,
    })
    .eq('id', validatedFields.data.location_id)
    .eq('trip_id', validatedFields.data.trip_id);

  if (error) {
    return { message: `Failed to update location: ${error.message}` };
  }

  revalidatePath(`/trip/${validatedFields.data.trip_id}`);
  return { message: 'Location updated successfully!' };
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
export async function inviteUser(prevState: unknown, formData: FormData) {
  const tripId = formData.get('trip_id') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string || 'traveler';

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
  
  // Insert a pending invitation
  const { error: pendingError } = await supabase
    .from('pending_invitations')
    .insert({
      email,
      trip_id: tripId,
      role,
    });
  if (pendingError) {
    return { message: `Error creating pending invitation: ${pendingError.message}` };
  }

  // Use Supabase's built-in invitation system
  try {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        trip_id: tripId,
        role: role,
        invited_by: user.id
      }
    });
    if (error) {
      return { message: `Error sending invitation: ${error.message}` };
    }
  revalidatePath(`/trip/${tripId}`);
    return { message: `Invitation sent to ${email}! Check your email for the invitation link.` };
  } catch {
    return { message: 'Failed to send invitation. Please try again.' };
  }
}

export async function updateTripDetails(
  trip_id: string,
  name: string,
  destination: string | undefined,
  start_date: string,
  end_date: string,
  main_currency: string
) {
  const schema = z.object({
    trip_id: z.string().uuid(),
    name: z.string().min(3, { message: 'Trip name must be at least 3 characters.' }),
    destination: z.string().optional(),
    start_date: z.string().date(),
    end_date: z.string().date(),
    main_currency: z.string().min(3, { message: 'Main currency is required.' }),
  });

  const validatedFields = schema.safeParse({
    trip_id,
    name,
    destination,
    start_date,
    end_date,
    main_currency,
  });

  if (!validatedFields.success) {
    return { status: 'error', message: 'Invalid data provided.' };
  }
  
  // --- FIX: Separate the ID from the data we want to update ---
  const { trip_id: validatedTripId, ...updateData } = validatedFields.data;

  const supabase = createServerActionClient({ cookies });

  // Security check for admin role remains the same...
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', validatedTripId)
    .eq('user_id', user.id)
    .single();

  if (participant?.role !== 'admin') {
    return { status: 'error', message: 'You do not have permission to edit this trip.' };
  }
  
  // --- FIX: Use the separated data for the update ---
  const { error } = await supabase
    .from('trips')
    .update(updateData)
    .eq('id', validatedTripId);
  
  if (error) {
    return { status: 'error', message: `Failed to update trip: ${error.message}` };
  }
  
  revalidatePath(`/trip/${validatedTripId}`);
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

// --- ADD PARTICIPANT REMOVAL FUNCTIONS ---
export async function removeParticipant(participantId: string, tripId: string) {
  const supabase = createServerActionClient({ cookies });

  // Security check: Verify the user is an admin of this trip
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (participant?.role !== 'admin') {
    return { message: 'You do not have permission to remove participants from this trip.' };
  }

  // Remove the participant from the trip
  const { error } = await supabase
    .from('trip_participants')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', participantId);

  if (error) {
    console.error('Remove Participant Error:', error);
    return { message: `Failed to remove participant: ${error.message}` };
  }

  revalidatePath(`/trip/${tripId}`);
  return { message: 'Participant removed successfully!' };
}

export async function removeMultipleParticipants(participantIds: string[], tripId: string) {
  const supabase = createServerActionClient({ cookies });

  // Security check: Verify the user is an admin of this trip
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  const { data: participant } = await supabase
    .from('trip_participants')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (participant?.role !== 'admin') {
    return { message: 'You do not have permission to remove participants from this trip.' };
  }

  // Remove multiple participants from the trip
  const { error } = await supabase
    .from('trip_participants')
    .delete()
    .eq('trip_id', tripId)
    .in('user_id', participantIds);

  if (error) {
    console.error('Remove Multiple Participants Error:', error);
    return { message: `Failed to remove participants: ${error.message}` };
  }

  revalidatePath(`/trip/${tripId}`);
  return { message: `${participantIds.length} participant(s) removed successfully!` };
}
