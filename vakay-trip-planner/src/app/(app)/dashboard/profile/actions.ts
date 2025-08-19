// src/app/(app)/dashboard/profile/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';


// Common password schema: 8+ chars, 1 uppercase, 1 number OR special
const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters.' })
  .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter.' })
  .refine((val) => /[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val), { message: 'Password must contain at least one number or special character.' });

export async function updatePassword(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z
    .object({
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });

  const validatedFields = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const err = validatedFields.error.flatten().fieldErrors;
    return { message: err.password?.[0] || err.confirmPassword?.[0] || 'Invalid data.' };
  }

  const { password } = validatedFields.data;

  const { data: { user }, error: updateUserError } = await supabase.auth.updateUser({ password });

  if (updateUserError) {
    return { message: `Could not update password: ${updateUserError.message}` };
  }

  if (user) {
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ has_set_password: true })
      .eq('id', user.id);

    if (updateProfileError) {
      return { message: `Could not update profile: ${updateProfileError.message}` };
    }

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

  redirect('/dashboard');
}

// --- NEW: Update display name in profiles ---
export async function updateProfileName(prevState: unknown, formData: FormData) {
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
export async function completeAccountSetup(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  const schema = z
    .object({
      full_name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(80),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
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
export async function deleteAccount(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient({ cookies });
  const schema = z.object({ confirm: z.literal('delete') });
  const validated = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) {
    return { message: 'Type "delete" to confirm.' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated.' };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    console.log('Starting account deletion for user:', user.id);

    // Delete in order of dependencies (child tables first, then parent tables)
    
    // 1. Delete survey votes (depends on survey_options)
    console.log('Deleting survey votes...');
    await admin
      .from('survey_votes')
      .delete()
      .eq('user_id', user.id);

    // 2. Delete survey options (depends on accommodation_surveys)
    console.log('Deleting survey options...');
    const { data: userSurveys } = await admin
      .from('accommodation_surveys')
      .select('id')
      .eq('created_by', user.id);
    
    if (userSurveys && userSurveys.length > 0) {
      const surveyIds = userSurveys.map(s => s.id);
      await admin
        .from('survey_options')
        .delete()
        .in('survey_id', surveyIds);
    }

    // 3. Delete accommodation surveys
    console.log('Deleting accommodation surveys...');
    await admin
      .from('accommodation_surveys')
      .delete()
      .eq('created_by', user.id);

    // 4. Delete expenses
    console.log('Deleting expenses...');
    await admin
      .from('expenses')
      .delete()
      .eq('user_id', user.id);

    // 5. Delete expense categories (if user created them)
    console.log('Deleting expense categories...');
    await admin
      .from('expense_categories')
      .delete()
      .eq('user_id', user.id);

    // 6. Delete accommodations
    console.log('Deleting accommodations...');
    await admin
      .from('accommodations')
      .delete()
      .eq('user_id', user.id);

    // 7. Delete transportation
    console.log('Deleting transportation...');
    await admin
      .from('transportation')
      .delete()
      .eq('user_id', user.id);

    // 8. Delete itinerary days
    console.log('Deleting itinerary days...');
    await admin
      .from('itinerary_days')
      .delete()
      .eq('user_id', user.id);

    // 9. Delete locations
    console.log('Deleting locations...');
    await admin
      .from('locations')
      .delete()
      .eq('user_id', user.id);

    // 10. Delete useful links
    console.log('Deleting useful links...');
    await admin
      .from('useful_links')
      .delete()
      .eq('user_id', user.id);

    // 11. Delete trip participants
    console.log('Deleting trip participants...');
    await admin
      .from('trip_participants')
      .delete()
      .eq('user_id', user.id);

    // 12. Delete profile
    console.log('Deleting profile...');
    await admin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // 13. Finally, delete the user account
    console.log('Deleting user account...');
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Error deleting user account:', error);
      return { message: `Failed to delete account: ${error.message}` };
    }

    console.log('Account deletion completed successfully');
    
    // Sign out the current session
    await supabase.auth.signOut();

    redirect('/');
  } catch (error) {
    console.error('Error deleting account:', error);
    return { message: 'Database error deleting user. Please try again or contact support.' };
  }
}