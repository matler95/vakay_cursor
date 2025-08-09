// src/app/(app)/dashboard/profile/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Database } from '@/types/database.types';

export async function updatePassword(prevState: any, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z.object({
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { message: validatedFields.error.flatten().fieldErrors.password?.[0] || validatedFields.error.flatten().fieldErrors.confirmPassword?.[0] || 'Invalid data.' };
  }

  const { password } = validatedFields.data;

  // First, update the user's password in the auth schema
  const { data: { user }, error: updateUserError } = await supabase.auth.updateUser({ password });

  if (updateUserError) {
    return { message: `Could not update password: ${updateUserError.message}` };
  }

  // --- NEW: If successful, update the flag in our profiles table ---
  if (user) {
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ has_set_password: true })
      .eq('id', user.id);

    if (updateProfileError) {
      return { message: `Could not update profile: ${updateProfileError.message}` };
    }

    // --- NEW: Check for pending invitations and add to trips ---
    const userEmail = user.email;
    if (userEmail) {
      const { data: pendingInvites } = await supabase
        .from('pending_invitations')
        .select('id, trip_id, role')
        .eq('email', userEmail);
      if (pendingInvites && pendingInvites.length > 0) {
        for (const invite of pendingInvites) {
          await supabase
            .from('trip_participants')
            .insert({
              trip_id: invite.trip_id,
              user_id: user.id,
              role: invite.role || 'traveler',
            });
          await supabase
            .from('pending_invitations')
            .delete()
            .eq('id', invite.id);
        }
      }
    }
  }

  // --- NEW: Redirect to the dashboard after success ---
  redirect('/dashboard');
}

// --- NEW: Update display name in profiles ---
export async function updateProfileName(formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z.object({
    full_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(80),
  });

  const validated = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    return { message: validated.error.flatten().fieldErrors.full_name?.[0] || 'Invalid name.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: validated.data.full_name })
    .eq('id', user.id);

  if (error) {
    return { message: `Could not update name: ${error.message}` };
  }

  revalidatePath('/dashboard/profile');
  return { message: 'Name updated!' };
}

// --- NEW: Complete account setup (password + optional name) for onboarding ---
export async function completeAccountSetup(prevState: any, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z.object({
    full_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(80),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

  const validated = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    const err = validated.error.flatten().fieldErrors;
    return { message: err.full_name?.[0] || err.password?.[0] || err.confirmPassword?.[0] || 'Invalid data.' };
  }

  const { full_name, password } = validated.data;

  const { data: { user }, error: updateUserError } = await supabase.auth.updateUser({ password });
  if (updateUserError) {
    return { message: `Could not update password: ${updateUserError.message}` };
  }

  if (!user) return { message: 'Not authenticated.' };

  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ full_name, has_set_password: true })
    .eq('id', user.id);
  if (profileErr) {
    return { message: `Could not update profile: ${profileErr.message}` };
  }

  // Add to trips from pending invitations
  const userEmail = user.email;
  if (userEmail) {
    const { data: pendingInvites } = await supabase
      .from('pending_invitations')
      .select('id, trip_id, role')
      .eq('email', userEmail);
    if (pendingInvites && pendingInvites.length > 0) {
      for (const invite of pendingInvites) {
        await supabase
          .from('trip_participants')
          .insert({ trip_id: invite.trip_id, user_id: user.id, role: invite.role || 'traveler' });
        await supabase
          .from('pending_invitations')
          .delete()
          .eq('id', invite.id);
      }
    }
  }

  redirect('/dashboard');
}

// --- NEW: Permanently delete account (requires typing "delete") ---
export async function deleteAccount(formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const schema = z.object({ confirm: z.literal('delete') });
  const validated = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    return { message: 'Type "delete" to confirm.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  // End the current session
  await supabase.auth.signOut();

  // Use service role to delete the auth user (cascades to trip_participants via FK)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { message: `Failed to delete account: ${error.message}` };
  }

  // Redirect to home
  redirect('/');
}