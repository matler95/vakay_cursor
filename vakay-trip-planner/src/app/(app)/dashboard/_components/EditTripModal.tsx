// src/app/(app)/dashboard/_components/EditTripModal.tsx
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { EditTripForm } from '@/app/trip/[tripId]/_components/EditTripForm';

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
      <button onClick={() => setIsOpen(true)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
        Edit
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            {/* --- MODIFIED: Pass both onCancel and onSuccess --- */}
            <EditTripForm trip={trip} onCancel={handleClose} onSuccess={handleClose} />
          </div>
        </div>
      )}
    </>
  );
}
