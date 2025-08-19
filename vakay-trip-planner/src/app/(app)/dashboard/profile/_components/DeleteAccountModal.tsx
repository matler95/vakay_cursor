// src/app/(app)/dashboard/profile/_components/DeleteAccountModal.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StandardModal } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { useActionState } from 'react';
import { deleteAccount } from '../actions';
import { useFormStatus } from 'react-dom';

export function DeleteAccountModal() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [state, formAction] = useActionState(deleteAccount, { message: '', success: false });
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle successful deletion and redirect
  useEffect(() => {
    if (state?.success) {
      console.log('Account deleted successfully, redirecting...');
      // Show success message briefly before redirecting
      setTimeout(() => {
        // Close the modal
        setOpen(false);
        // Redirect to home page
        window.location.href = '/';
      }, 2000);
    }
  }, [state?.success]);

  function DeleteButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" variant="destructive" className="flex-1" disabled={pending || disabled}>
        {pending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : null}
        {pending ? 'Deleting...' : 'Delete'}
      </Button>
    );
  }

  const handleConfirm = useCallback(async () => {
    if (confirmText.toLowerCase() === 'delete') {
      setIsDeleting(true);
      try {
        const form = document.getElementById('delete-account-form') as HTMLFormElement | null;
        if (form) {
          form.requestSubmit();
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        setIsDeleting(false);
      }
    }
  }, [confirmText]);

  const handleConfirmTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value);
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    // Focus the input after modal opens
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setConfirmText('');
    setIsDeleting(false);
  }, []);

  const isConfirmValid = confirmText.toLowerCase() === 'delete';

  return (
    <>
      <Button variant="destructive" size="sm" className="h-8" onClick={handleOpen}>
        Delete account
      </Button>

      <StandardModal
        isOpen={open}
        onClose={handleClose}
        title="Permanently delete account"
        description="This will remove your account and access to all trips. This action cannot be undone."
        size="lg"
        showFooter
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                `Delete ${!isConfirmValid && `(type "delete" to enable)`}`
              )}
            </Button>
          </div>
        }
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
                Type "delete" to confirm
              </label>
              <input
                ref={inputRef}
                id="confirm"
                type="text"
                name="confirm"
                value={confirmText}
                onChange={handleConfirmTextChange}
                placeholder="delete"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
                disabled={isDeleting}
              />
            </div>
            
            {state?.message && (
              <p className={`text-sm p-3 rounded-md border ${
                state.success 
                  ? 'text-green-600 bg-green-50 border-green-200' 
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                {state.message}
              </p>
            )}
          </form>
        </div>
      </StandardModal>
    </>
  );
}
