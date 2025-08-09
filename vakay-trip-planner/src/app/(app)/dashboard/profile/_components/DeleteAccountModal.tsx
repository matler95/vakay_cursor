// src/app/(app)/dashboard/profile/_components/DeleteAccountModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Permanently delete account"
        description="This will remove your account and access to all trips. This action cannot be undone."
      >
        <div className="flex items-start gap-3 mb-2 text-red-700">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">To confirm, type <span className="font-semibold">delete</span> in the box below.</p>
        </div>
        <form action={formAction} className="space-y-4">
          <input
            type="text"
            name="confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            className="block w-full rounded-md border-gray-300 shadow-sm"
          />
          {state?.message && <p className="text-sm text-gray-600">{state.message}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <DeleteButton disabled={confirmText !== 'delete'} />
          </div>
        </form>
      </Modal>
    </>
  );
}
