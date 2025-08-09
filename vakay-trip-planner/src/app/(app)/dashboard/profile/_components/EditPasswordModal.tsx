// src/app/(app)/dashboard/profile/_components/EditPasswordModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { KeyRound } from 'lucide-react';
import { UpdatePasswordForm } from './UpdatePasswordForm';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';

export function EditPasswordModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-50" onClick={() => setOpen(true)}>
            <KeyRound className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Update password</p>
        </TooltipContent>
      </Tooltip>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Update Password"
        description="Enter and confirm your new password."
      >
        <UpdatePasswordForm
          renderActions={(pending) => (
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? <Spinner size={18} className="mr-2" /> : null}
                {pending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        />
      </Modal>
    </>
  );
}
