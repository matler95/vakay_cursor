// src/app/(app)/dashboard/profile/_components/UpdatePasswordForm.tsx
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updatePassword } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
      {pending ? 'Saving...' : 'Update Password'}
    </button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, { message: '' });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password-new" className="block text-sm font-medium leading-6 text-gray-900">New Password</label>
        <input id="password-new" name="password" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
      </div>
      <div>
        <label htmlFor="password-confirm" className="block text-sm font-medium leading-6 text-gray-900">Confirm New Password</label>
        <input id="password-confirm" name="confirmPassword" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
      </div>
      <div className="flex justify-end items-center gap-4">
        {state.message && <p className="text-sm text-gray-600">{state.message}</p>}
        <SubmitButton />
      </div>
    </form>
  );
}