// src/app/(app)/dashboard/_components/CreateTripModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTrip } from '../actions';
import { 
  FormModal, 
  StandardInput, 
  StandardDateInput,
  FormSection,
  FormRow,
  FormField
} from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currency';

// Submit button component that shows loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit" 
      className="flex-1" 
      disabled={pending}
    >
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

export function CreateTripModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTrip, { message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset submitting state when form action completes
  useEffect(() => {
    if (state?.message) {
      setIsSubmitting(false);
    }
  }, [state]);

  // Close modal on success
  if (state?.message && !state.message.toLowerCase().includes('error')) {
    setTimeout(() => {
      setOpen(false);
      window.location.reload();
    }, 1000);
  }

  const handleSubmit = () => {
    setIsSubmitting(true);
    const form = document.getElementById('create-trip-form') as HTMLFormElement | null;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="sm" 
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Create Trip</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create new trip</p>
        </TooltipContent>
      </Tooltip>

      <FormModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create New Trip"
        description="Plan your next adventure by creating a new trip."
        size="lg"
        onSubmit={handleSubmit}
        submitText="Create Trip"
        cancelText="Cancel"
        loading={isSubmitting}
      >
        <form id="create-trip-form" action={formAction} className="space-y-6">
          <FormSection title="Trip Information">
            <FormRow>
              <StandardInput
                label="Trip Name"
                name="name"
                type="text"
                placeholder="Enter trip name"
                required
              />
            </FormRow>

            <FormRow>
              <StandardInput
                label="Destination"
                name="destination"
                type="text"
                placeholder="Enter destination"
              />
            </FormRow>

            <FormRow>
              <StandardDateInput
                label="Start Date"
                name="start_date"
                required
              />
              <StandardDateInput
                label="End Date"
                name="end_date"
                required
              />
            </FormRow>

            <FormRow>
              <FormField label="Main Currency">
                <Select name="main_currency" defaultValue="USD">
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </FormRow>
          </FormSection>

          {/* Show server message if any */}
          {state?.message && (
            <div className={`text-sm p-3 rounded-md ${
              state.message.toLowerCase().includes('error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {state.message}
            </div>
          )}
        </form>
      </FormModal>
    </>
  );
}
