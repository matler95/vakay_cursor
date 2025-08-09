// src/app/(app)/dashboard/_components/CreateTripForm.tsx
'use client';

import { useActionState } from 'react'; // Correct import
import { useFormStatus } from 'react-dom'; // Correct import
import { createTrip } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Creating...
        </>
      ) : (
        'Create Trip'
      )}
    </Button>
  );
}

export function CreateTripForm() {
  const [state, formAction] = useActionState(createTrip, { message: '' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Trip</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name</Label>
            <Input id="name" name="name" placeholder="e.g., Summer in Italy" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input id="destination" name="destination" placeholder="e.g., Rome, Italy" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input id="end_date" name="end_date" type="date" required />
            </div>
          </div>
          <SubmitButton />
          {state.message && <p className="text-sm text-red-500">{state.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}