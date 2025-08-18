// src/app/(app)/dashboard/profile/_components/DeleteAccountModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StandardModal } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { useActionState } from 'react';
import { deleteAccount } from '../actions';
import { useFormStatus } from 'react-dom';

export function DeleteAccountModal() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [state, formAction] = useActionState(deleteAccount, { message: '' });

  function DeleteButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" variant="destructive" className="flex-1" disabled={pending || disabled}>
        {pending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : null}
        {pending ? 'Deleting...' : 'Delete'}
      </Button>
    );
  }

  return (
    <>
      <Button variant="destructive" size="sm" className="h-8" onClick={() => setOpen(true)}>
        Delete account
      </Button>

      <StandardModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Permanently delete account"
        description="This will remove your account and access to all trips. This action cannot be undone."
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={() => {
                // The form will handle the submission
                const form = document.getElementById('delete-account-form') as HTMLFormElement | null;
                form?.requestSubmit();
              }}
            >
              Delete
            </Button>
          </div>
        }
        showFooter
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 mt-0.5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">
              To confirm, type <span className="font-semibold">delete</span> in the box below.
            </p>
          </div>
          
          <form id="delete-account-form" action={formAction} className="space-y-4">
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                Type &quot;delete&quot; to confirm
              </label>
              <input
                id="confirm"
                type="text"
                name="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
              />
            </div>
            
            {state?.message && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {state.message}
              </p>
            )}
          </form>
        </div>
      </StandardModal>
    </>
  );
}
