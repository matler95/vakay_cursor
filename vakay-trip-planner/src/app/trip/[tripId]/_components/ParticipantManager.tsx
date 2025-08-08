// src/app/trip/[tripId]/_components/ParticipantManager.tsx
'use client';

import { Database } from '@/types/database.types';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { inviteUser } from '../actions';

export type Participant = {
  role: string | null;
  profiles: {
    id: string;
    full_name: string | null;
  };
}

interface ParticipantManagerProps {
  tripId: string;
  participants: Participant[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
      {pending ? 'Sending...' : 'Send Invite'}
    </button>
  );
}

export function ParticipantManager({ tripId, participants }: ParticipantManagerProps) {
  const [state, formAction] = useActionState(inviteUser, { message: '' });

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
      <h2 className="text-xl font-semibold">Travelers</h2>
      
      {/* List of current participants */}
      <ul className="mt-4 space-y-2">
        {participants.map((p) => (
          <li key={p.profiles?.id} className="flex items-center justify-between rounded-md border p-2">
            <span>{p.profiles?.full_name || 'New User'}</span>
            <span className="text-sm capitalize text-gray-500">{p.role}</span>
          </li>
        ))}
      </ul>

      {/* Invitation Form */}
      <form action={formAction} className="mt-6 border-t pt-6">
        <h3 className="font-semibold">Invite a Friend</h3>
        <input type="hidden" name="trip_id" value={tripId} />
        <div className="mt-2 flex items-end gap-4">
          <div className="flex-grow">
            <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
            <input type="email" name="email" id="email" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 sm:text-sm" />
          </div>
          <SubmitButton />
        </div>
        {state.message && <p className="mt-2 text-sm text-green-600">{state.message}</p>}
      </form>
    </div>
  );
}