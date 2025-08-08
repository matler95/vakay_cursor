// src/app/(app)/dashboard/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
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
  }

  // --- NEW: Redirect to the dashboard after success ---
  redirect('/dashboard');
}