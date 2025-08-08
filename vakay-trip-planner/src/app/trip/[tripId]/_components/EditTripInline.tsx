// src/app/trip/[tripId]/_components/EditTripInline.tsx
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { EditTripForm } from './EditTripForm';

type Trip = Database['public']['Tables']['trips']['Row'];

interface EditTripInlineProps {
  trip: Trip;
  userRole: string | null;
}

export function EditTripInline({ trip, userRole }: EditTripInlineProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Only admins can see the edit functionality
  if (userRole !== 'admin') {
    return null;
  }

  if (isEditing) {
    // If we are editing, show the form and pass a function to close it
    return (
      <div className="my-6 rounded-lg border bg-white p-6 shadow-sm">
        <EditTripForm trip={trip} onCancel={() => setIsEditing(false)} onSuccess={() => setIsEditing(false)} />
      </div>
    );
  }

  // If not editing, just show the button
  return (
    <button onClick={() => setIsEditing(true)} className="text-sm text-indigo-600 hover:text-indigo-800">
      Edit Trip Details
    </button>
  );
}