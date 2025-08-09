// src/app/(app)/dashboard/profile/_components/EditDisplayNameModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil } from 'lucide-react';
import { useActionState } from 'react';
import { updateProfileName } from '../actions';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { useFormStatus } from 'react-dom';

interface EditDisplayNameModalProps {
  currentName: string | null;
}

export function EditDisplayNameModal({ currentName }: EditDisplayNameModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName || '');
  const [state, formAction] = useActionState(updateProfileName as any, { message: '' });
  const router = useRouter();

  useEffect(() => {
    if (state?.message && state.message.toLowerCase().includes('updated')) {
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  function SaveButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" className="flex-1" disabled={pending}>
        {pending ? <Spinner size={18} className="mr-2" /> : null}
        {pending ? 'Saving...' : 'Save'}
      </Button>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-50" onClick={() => setOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit display name</p>
        </TooltipContent>
      </Tooltip>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit Display Name"
        description="This name will be shown to other participants."
      >
        <form action={formAction} className="space-y-4" onSubmit={() => {}}>
          <input
            type="text"
            name="full_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="e.g., Alex Johnson"
          />
          {state.message && <p className="text-sm text-gray-600">{state.message}</p>}
          <div className="mt-4">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SaveButton />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
