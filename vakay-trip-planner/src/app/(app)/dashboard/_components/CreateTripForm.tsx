// src/app/(app)/dashboard/_components/CreateTripForm.tsx
'use client';

import { useActionState, useState } from 'react'; // Correct import
import { useFormStatus } from 'react-dom'; // Correct import
import { createTrip } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateTripDates } from '@/lib/dateValidation';

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    validateDates(date, endDate);
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    validateDates(startDate, date);
  };

  const validateDates = (start: string, end: string) => {
    if (start && end) {
      const validation = validateTripDates(start, end);
      if (!validation.isValid) {
        setDateError(validation.error!);
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    // Clear any previous errors
    setDateError('');
    
    // Validate dates before submission
    if (startDate && endDate) {
      const validation = validateTripDates(startDate, endDate);
      if (!validation.isValid) {
        setDateError(validation.error!);
        return;
      }
    }

    formData.set('start_date', startDate);
    formData.set('end_date', endDate);
    await formAction(formData);
  };

  const isFormValid = startDate && endDate && !dateError;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a New Trip</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Trip Name</Label>
            <Input id="name" name="name" placeholder="e.g., Summer in Italy" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input id="destination" name="destination" placeholder="e.g., Rome, Italy" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                placeholder="Select start date"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                placeholder="Select end date"
                required
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          {dateError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {dateError}
            </p>
          )}
          
          <SubmitButton />
          {state.message && <p className="text-sm text-red-500">{state.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}