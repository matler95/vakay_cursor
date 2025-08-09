// src/app/set-password/page.tsx
'use client';
import { useActionState, useState } from 'react';
import { completeAccountSetup } from '../(app)/dashboard/profile/actions';
import { Eye, EyeOff } from 'lucide-react';

export default function SetPasswordPage() {
  const [state, formAction] = useActionState(completeAccountSetup, { message: '' });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = async (formData: FormData) => {
    formData.set('full_name', fullName);
    formData.set('password', password);
    formData.set('confirmPassword', confirm);
    await formAction(formData);
  };

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Complete Your Account</h1>
        <p className="mb-6 text-gray-600">Set a display name and create a password to start using the app.</p>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-900">Display Name</label>
            <input id="full_name" name="full_name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="e.g., Alex Johnson" />
          </div>
          <div>
            <label htmlFor="password-new" className="block text-sm font-medium text-gray-900">New Password</label>
            <div className="relative mt-1">
              <input id="password-new" name="password" type={showNew ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="block w-full rounded-md border-gray-300 shadow-sm pr-10" />
              <button type="button" aria-label={showNew ? 'Hide password' : 'Show password'} onClick={() => setShowNew((v) => !v)} className="absolute inset-y-0 right-2 my-auto rounded p-1 text-gray-500 hover:text-gray-700">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Min 8 chars, at least one uppercase and one number or special character.</p>
          </div>
          <div>
            <label htmlFor="password-confirm" className="block text-sm font-medium text-gray-900">Confirm New Password</label>
            <div className="relative mt-1">
              <input id="password-confirm" name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="block w-full rounded-md border-gray-300 shadow-sm pr-10" />
              <button type="button" aria-label={showConfirm ? 'Hide password' : 'Show password'} onClick={() => setShowConfirm((v) => !v)} className="absolute inset-y-0 right-2 my-auto rounded p-1 text-gray-500 hover:text-gray-700">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {state.message && <p className="text-sm text-gray-600">{state.message}</p>}
          <div className="flex justify-end items-center gap-4">
            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Save and Continue</button>
          </div>
        </form>
      </div>
    </div>
  );
}
