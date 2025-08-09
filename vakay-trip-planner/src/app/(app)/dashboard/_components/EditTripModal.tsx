// src/app/(app)/dashboard/_components/EditTripModal.tsx
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { EditTripForm } from '@/app/trip/[tripId]/_components/EditTripForm';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

type Trip = Database['public']['Tables']['trips']['Row'];

interface EditTripModalProps {
  trip: Trip;
  userRole: string | null;
}

export function EditTripModal({ trip, userRole }: EditTripModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => setIsOpen(true)} size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-50">
            <Settings className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit trip</p>
        </TooltipContent>
      </Tooltip>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="relative w-full max-w-lg rounded-xl border border-gray-100 bg-white p-6 shadow-2xl">
            <EditTripForm trip={trip} onCancel={handleClose} onSuccess={handleClose} />
          </div>
        </div>
      )}
    </>
  );
}
