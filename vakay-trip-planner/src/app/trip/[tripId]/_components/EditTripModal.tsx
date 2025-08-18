'use client';

import { Database } from '@/types/database.types';
import { useState } from 'react';
import { updateTripDetails } from '../actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCIES } from '@/lib/currency';
import { 
  FormModal, 
  StandardInput, 
  StandardDateInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type Trip = Database['public']['Tables']['trips']['Row'];

interface EditTripModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: () => void;
}

export function EditTripModal({ trip, isOpen, onClose, onTripUpdated }: EditTripModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await updateTripDetails(
        trip.id,
        formData.get('name') as string,
        formData.get('destination') as string || undefined,
        formData.get('start_date') as string,
        formData.get('end_date') as string,
        formData.get('main_currency') as string
      );
      
      if (result.status === 'success') {
        onTripUpdated();
        onClose();
      } else {
        setError(result.message || 'Failed to update trip');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    setIsSubmitting(true);
    const form = document.querySelector('form');
    if (form) form.requestSubmit();
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trip Details"
      description="Update your trip information and settings."
      size="md"
      onSubmit={handleFormSubmit}
      submitText="Save Changes"
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="trip_id" value={trip.id} />
        
        <FormSection title="Basic Information">
          <StandardInput
            label="Trip Name"
            name="name"
            defaultValue={trip.name}
            required
          />

          <StandardInput
            label="Destination"
            name="destination"
            defaultValue={trip.destination || ''}
            placeholder="e.g., Rome, Italy"
          />
        </FormSection>

        <FormSection title="Dates">
          <FormRow cols={2}>
            <StandardDateInput
              label="Start Date"
              name="start_date"
              defaultValue={trip.start_date || ''}
              required
            />
            
            <StandardDateInput
              label="End Date"
              name="end_date"
              defaultValue={trip.end_date || ''}
              required
            />
          </FormRow>
        </FormSection>

        <FormSection title="Settings">
          <FormField label="Main Currency">
            <Select name="main_currency" defaultValue={trip.main_currency || 'USD'}>
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

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </FormModal>
  );
}
