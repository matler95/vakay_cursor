// src/app/(app)/dashboard/profile/_components/UpdatePasswordForm.tsx
'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updatePassword } from '../actions';
import { Eye, EyeOff } from 'lucide-react';

function DefaultSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
      {pending ? 'Saving...' : 'Update Password'}
    </button>
  );
}

type UpdatePasswordFormProps = {
  renderActions?: (pending: boolean) => React.ReactNode;
};

export function UpdatePasswordForm({ renderActions }: UpdatePasswordFormProps) {
  const [state, formAction] = useActionState(updatePassword, { message: '' });
  const { pending } = useFormStatus();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // We wrap formAction to inject controlled inputs without clearing values on error
  const handleSubmit = async (formData: FormData) => {
    formData.set('password', password);
    formData.set('confirmPassword', confirm);
    await formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password-new" className="block text-sm font-medium leading-6 text-gray-900">New Password</label>
        <div className="relative mt-1">
          <input id="password-new" name="password" value={password} onChange={(e) => setPassword(e.target.value)} type={showNew ? 'text' : 'password'} required className="block w-full rounded-md border-gray-300 shadow-sm pr-10" />
          <button type="button" aria-label={showNew ? 'Hide password' : 'Show password'} onClick={() => setShowNew((v) => !v)} className="absolute inset-y-0 right-2 my-auto rounded p-1 text-gray-500 hover:text-gray-700">
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Min 8 chars, at least one uppercase and one number or special character.</p>
      </div>
      <div>
        <label htmlFor="password-confirm" className="block text-sm font-medium leading-6 text-gray-900">Confirm New Password</label>
        <div className="relative mt-1">
          <input id="password-confirm" name="confirmPassword" value={confirm} onChange={(e) => setConfirm(e.target.value)} type={showConfirm ? 'text' : 'password'} required className="block w-full rounded-md border-gray-300 shadow-sm pr-10" />
          <button type="button" aria-label={showConfirm ? 'Hide password' : 'Show password'} onClick={() => setShowConfirm((v) => !v)} className="absolute inset-y-0 right-2 my-auto rounded p-1 text-gray-500 hover:text-gray-700">
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {state.message && <p className="text-sm text-gray-600">{state.message}</p>}
      {renderActions ? (
        <div className="mt-4">{renderActions(pending)}</div>
      ) : (
        <div className="flex justify-end items-center gap-4">
          <DefaultSubmitButton />
        </div>
      )}
    </form>
  );
}