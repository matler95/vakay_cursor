// src/app/set-password/page.tsx
'use client';
import { useActionState } from 'react';
import { completeAccountSetup } from '../(app)/dashboard/profile/actions';

export default function SetPasswordPage() {
  const [state, formAction] = useActionState(completeAccountSetup, { message: '' });

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Complete Your Account</h1>
        <p className="mb-6 text-gray-600">Set a display name and create a password to start using the app.</p>
        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-900">Display Name</label>
            <input id="full_name" name="full_name" type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., Alex Johnson" />
          </div>
          <div>
            <label htmlFor="password-new" className="block text-sm font-medium text-gray-900">New Password</label>
            <input id="password-new" name="password" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-900">Confirm New Password</label>
            <input id="password-confirm" name="confirmPassword" type="password" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div className="flex justify-end items-center gap-4">
            {state.message && <p className="text-sm text-gray-600">{state.message}</p>}
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Save and Continue</button>
          </div>
        </form>
      </div>
    </div>
  );
}
