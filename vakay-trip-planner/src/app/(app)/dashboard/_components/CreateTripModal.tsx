// src/app/(app)/dashboard/_components/CreateTripModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import { useActionState } from 'react';
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

export function CreateTripModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTrip, { message: '' });

  const handleSubmit = () => {
    // The form will be submitted via the form action
    // We just need to close the modal after submission
    setTimeout(() => {
      if (state.message && !state.message.includes('error')) {
        setOpen(false);
      }
    }, 1000);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
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
      >
        <form action={formAction} className="space-y-6">
          <FormSection title="Trip Details">
            <StandardInput
              label="Trip Name"
              name="name"
              placeholder="e.g., Summer in Italy"
              required
            />
            
            <StandardInput
              label="Destination"
              name="destination"
              placeholder="e.g., Rome, Italy"
              required
            />
          </FormSection>

          <FormSection title="Dates">
            <FormRow cols={2}>
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
          </FormSection>

          <FormSection title="Settings">
            <FormField label="Main Currency" required>
              <Select name="main_currency" defaultValue="USD">
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-gray-500">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FormSection>

          {state.message && (
            <div className={`p-3 rounded-lg text-sm ${
              state.message.includes('error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-red-200'
            }`}>
              {state.message}
            </div>
          )}
        </form>
      </FormModal>
    </>
  );
}
