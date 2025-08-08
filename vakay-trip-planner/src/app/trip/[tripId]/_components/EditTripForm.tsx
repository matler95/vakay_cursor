// src/app/trip/[tripId]/_components/EditTripForm.tsx
'use client';

import { Database } from '@/types/database.types';
import { useEffect } from 'react'; // Make sure useEffect is imported
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateTripDetails } from '../actions';

type Trip = Database['public']['Tables']['trips']['Row'];

interface EditTripFormProps {
  trip: Trip;
  onCancel: () => void;
  onSuccess: () => void; // <-- Add new onSuccess prop
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

// This component is now just the form itself.
export function EditTripForm({ trip, onCancel, onSuccess }: EditTripFormProps) {
  // The state now expects a 'status' field
  const [state, formAction] = useActionState(updateTripDetails, { message: '', status: '' });

  // --- NEW: useEffect to handle auto-closing ---
  useEffect(() => {
    if (state.status === 'success') {
      // Wait a moment so the user can see the success message, then close.
      const timer = setTimeout(() => {
        onSuccess();
      }, 1000); // 1 second delay
      
      // Cleanup the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [state, onSuccess]);

  return (
    <div>
      <h2 className="text-xl font-semibold">Edit Trip Details</h2>
      <form action={formAction} className="mt-4 space-y-4">
        <input type="hidden" name="trip_id" value={trip.id} />
        
        <div>
          <label htmlFor="name-edit" className="block text-sm font-medium">Trip Name</label>
          <input type="text" id="name-edit" name="name" required defaultValue={trip.name} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>

        <div>
          <label htmlFor="destination-edit" className="block text-sm font-medium">Destination</label>
          <input type="text" id="destination-edit" name="destination" defaultValue={trip.destination || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date-edit" className="block text-sm font-medium">Start Date</label>
            <input type="date" id="start_date-edit" name="start_date" required defaultValue={trip.start_date || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label htmlFor="end_date-edit" className="block text-sm font-medium">End Date</label>
            <input type="date" id="end_date-edit" name="end_date" required defaultValue={trip.end_date || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          {/* Show a message based on the status */}
          {state.message && (
             <p className={`text-sm ${state.status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{state.message}</p>
          )}
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-gray-700">Cancel</button>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
