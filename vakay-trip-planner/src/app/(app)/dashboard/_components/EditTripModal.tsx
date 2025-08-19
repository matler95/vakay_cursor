'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { 
  FormModal, 
  StandardInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTripDetails } from '../../../trip/[tripId]/actions';
import { CURRENCIES } from '@/lib/currency';
import { validateTripDates } from '@/lib/dateValidation';

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
  const [startDate, setStartDate] = useState(trip.start_date || '');
  const [endDate, setEndDate] = useState(trip.end_date || '');
  const [dateError, setDateError] = useState('');

  // Update local state when trip prop changes
  useEffect(() => {
    setStartDate(trip.start_date || '');
    setEndDate(trip.end_date || '');
    setDateError('');
  }, [trip]);

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

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateTripDetails(
        trip.id,
        formData.get('name') as string,
        formData.get('destination') as string || undefined,
        startDate,
        endDate,
        formData.get('main_currency') as string
      );
      
      if (result && typeof result === 'object' && 'status' in result) {
        if (result.status === 'success') {
          onTripUpdated();
          onClose();
        } else {
          setError(result.message || 'Failed to update trip');
        }
      } else {
        setError('Failed to update trip');
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

  const handleClose = () => {
    onClose();
    setDateError('');
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Trip Details"
      description="Update your trip information and settings."
      size="lg"
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
            <DatePicker
              label="Start Date"
              name="start_date"
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="Select start date"
              required
              min={new Date().toISOString().split('T')[0]}
            />
            
            <DatePicker
              label="End Date"
              name="end_date"
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="Select end date"
              required
              min={startDate || new Date().toISOString().split('T')[0]}
              initialMonth={startDate} // Open on the month of the start date for better UX
            />
          </FormRow>
          
          {dateError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {dateError}
            </p>
          )}
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
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </p>
        )}
      </form>
    </FormModal>
  );
}
