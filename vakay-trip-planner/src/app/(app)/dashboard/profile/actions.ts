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

  // Check if we have the required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables for admin access');
    return { message: 'Server configuration error. Please contact support.' };
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    console.log('Starting account deletion for user:', user.id);
    console.log('User email:', user.email);
    console.log('Admin client configured:', !!admin);

    // First, let's check what data this user actually has
    console.log('Checking user data before deletion...');
    
    // Check expense participants
    const { data: expenseParticipants, error: epCheckError } = await admin
      .from('expense_participants')
      .select('id')
      .eq('participant_user_id', user.id);
    console.log('User has expense participants:', expenseParticipants?.length || 0);
    
    // Check survey votes
    const { data: surveyVotes, error: svCheckError } = await admin
      .from('survey_votes')
      .select('id')
      .eq('user_id', user.id);
    console.log('User has survey votes:', surveyVotes?.length || 0);
    
    // Check accommodation surveys
    const { data: userSurveys, error: surveysCheckError } = await admin
      .from('accommodation_surveys')
      .select('id')
      .eq('created_by', user.id);
    console.log('User has accommodation surveys:', userSurveys?.length || 0);
    
    // Check expenses
    const { data: userExpenses, error: expensesCheckError } = await admin
      .from('expenses')
      .select('id')
      .eq('user_id', user.id);
    console.log('User has expenses:', userExpenses?.length || 0);
    
    // Check trip participants
    const { data: userTripParticipants, error: tpCheckError } = await admin
      .from('trip_participants')
      .select('id')
      .eq('user_id', user.id);
    console.log('User has trip participants:', userTripParticipants?.length || 0);

    // Delete in order of dependencies (child tables first, then parent tables)
    // This order ensures we don't violate foreign key constraints
    
    // 1. Delete expense participants (depends on expenses)
    console.log('Deleting expense participants...');
    try {
      const { error: expenseParticipantsError } = await admin
        .from('expense_participants')
        .delete()
        .eq('participant_user_id', user.id);
      
      if (expenseParticipantsError) {
        console.error('Error deleting expense participants:', expenseParticipantsError);
        // Continue with deletion even if this fails
      }
    } catch (tableError) {
      console.error('Table expense_participants may not exist:', tableError);
      // Continue with deletion even if this table doesn't exist
    }

    // 2. Delete survey votes (depends on survey_options)
    console.log('Deleting survey votes...');
    try {
      const { error: surveyVotesError } = await admin
        .from('survey_votes')
        .delete()
        .eq('user_id', user.id);
      
      if (surveyVotesError) {
        console.error('Error deleting survey votes:', surveyVotesError);
        // Continue with deletion even if this fails
      }
    } catch (tableError) {
      console.error('Table survey_votes may not exist:', tableError);
      // Continue with deletion even if this table doesn't exist
    }

    // 3. Delete survey options (depends on accommodation_surveys)
    console.log('Deleting survey options...');
    try {
      if (userSurveys && userSurveys.length > 0) {
        const surveyIds = userSurveys.map(s => s.id);
        const { error: surveyOptionsError } = await admin
          .from('survey_options')
          .delete()
          .in('survey_id', surveyIds);
        
        if (surveyOptionsError) {
          console.error('Error deleting survey options:', surveyOptionsError);
          // Continue with deletion even if this fails
        }
      }
    } catch (tableError) {
      console.error('Table survey_options may not exist:', tableError);
      // Continue with deletion even if this table doesn't exist
    }

    // 4. Delete accommodation surveys
    console.log('Deleting accommodation surveys...');
    try {
      const { error: accommodationSurveysError } = await admin
        .from('accommodation_surveys')
        .delete()
        .eq('created_by', user.id);
      
      if (accommodationSurveysError) {
        console.error('Error deleting accommodation surveys:', accommodationSurveysError);
        // Continue with deletion even if this fails
      }
    } catch (tableError) {
      console.error('Table accommodation_surveys may not exist:', tableError);
      // Continue with deletion even if this table doesn't exist
    }

    // 5. Delete expenses
    console.log('Deleting expenses...');
    try {
      const { error: expensesError } = await admin
        .from('expenses')
        .delete()
        .eq('user_id', user.id);
      
      if (expensesError) {
        console.error('Error deleting expenses:', expensesError);
        // Continue with deletion even if this fails
      }
    } catch (tableError) {
      console.error('Table expenses may not exist:', tableError);
      // Continue with deletion even if this table doesn't exist
    }

    // 6. Delete trip participants
    console.log('Deleting trip participants...');
    try {
      const { error: tripParticipantsError } = await admin
        .from('trip_participants')
        .delete()
        .eq('user_id', user.id);
      
      if (tripParticipantsError) {
        console.error('Error deleting trip participants:', tripParticipantsError);
        // Continue with deletion even if this fails
      }
    } catch (tableError) {
      console.error('Table trip_participants may not exist:', tableError);
      // Continue with deletion even if this table doesn't exist
    }

    // 7. Delete profile
    console.log('Deleting profile...');
    try {
      const { error: profileError } = await admin
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        // Continue with deletion even if this fails
      }
    } catch (tableError) {
      console.error('Table profiles may not exist:', tableError);
      // Continue with deletion even if this table doesn't exist
    }

    // 8. Finally, delete the user account
    console.log('Deleting user account...');
    
    // Before deleting the user, let's double-check that all user data has been removed
    console.log('Verifying all user data has been removed...');
    
    const { data: remainingExpenseParticipants } = await admin
      .from('expense_participants')
      .select('id')
      .eq('participant_user_id', user.id);
    
    const { data: remainingSurveyVotes } = await admin
      .from('survey_votes')
      .select('id')
      .eq('user_id', user.id);
    
    const { data: remainingSurveys } = await admin
      .from('accommodation_surveys')
      .select('id')
      .eq('created_by', user.id);
    
    const { data: remainingExpenses } = await admin
      .from('expenses')
      .select('id')
      .eq('user_id', user.id);
    
    const { data: remainingTripParticipants } = await admin
      .from('trip_participants')
      .select('id')
      .eq('user_id', user.id);
    
    const { data: remainingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id);
    
    console.log('Remaining data check:', {
      expenseParticipants: remainingExpenseParticipants?.length || 0,
      surveyVotes: remainingSurveyVotes?.length || 0,
      surveys: remainingSurveys?.length || 0,
      expenses: remainingExpenses?.length || 0,
      tripParticipants: remainingTripParticipants?.length || 0,
      profile: remainingProfile?.length || 0
    });
    
    if (remainingExpenseParticipants?.length || remainingSurveyVotes?.length || 
        remainingSurveys?.length || remainingExpenses?.length || 
        remainingTripParticipants?.length || remainingProfile?.length) {
      console.error('Some user data still exists, cannot proceed with user deletion');
      return { message: 'Some user data could not be deleted. Please try again or contact support.' };
    }
    
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Error deleting user account:', error);
      return { message: `Failed to delete account: ${error.message}` };
    }

    console.log('Account deletion completed successfully');
    
    // Sign out the current session
    await supabase.auth.signOut();

    // Return success message instead of redirecting directly
    // The client-side code should handle the redirect after receiving success
    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
    // Check if this is a redirect error (which is actually success)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      console.log('Account deletion completed successfully - redirecting...');
      return { success: true, message: 'Account deleted successfully' };
    }
    
    console.error('Error deleting account:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Check if it's a specific database constraint error
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        console.error('Foreign key constraint violation detected');
        return { success: false, message: 'Cannot delete account due to remaining data references. Please try again or contact support.' };
      }
      if (error.message.includes('permission denied')) {
        console.error('Permission denied error detected');
        return { success: false, message: 'Permission denied. Please ensure you have the right to delete this account.' };
      }
      if (error.message.includes('does not exist')) {
        console.error('Table or column does not exist error detected');
        return { success: false, message: 'Database schema error. Please contact support.' };
      }
    }
    
    return { success: false, message: 'Database error deleting user. Please try again or contact support.' };
  }
}