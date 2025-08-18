// Modal for adding new expenses with currency and participant selection
'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, DollarSign, Users } from 'lucide-react';
import { CURRENCIES } from '@/lib/currency';
import { 
  FormModal, 
  StandardInput, 
  StandardTextarea, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type Category = Database['public']['Tables']['expense_categories']['Row'];

type TripParticipant = {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
  };
};

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  categories: Category[];
  tripParticipants: TripParticipant[];
  mainCurrency: string;
  onExpenseAdded: () => void;
  addExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function AddExpenseModal({ 
  isOpen, 
  onClose, 
  tripId, 
  categories, 
  tripParticipants, 
  mainCurrency,
  onExpenseAdded,
  addExpenseAction
}: AddExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const lastCurrency = localStorage.getItem('lastUsedCurrency');
    if (lastCurrency && CURRENCIES.find(c => c.code === lastCurrency)) {
      return lastCurrency;
    }
    return mainCurrency;
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('paid');

  // Get last used currency from localStorage
  useEffect(() => {
    const lastCurrency = localStorage.getItem('lastUsedCurrency');
    if (lastCurrency && CURRENCIES.find(c => c.code === lastCurrency)) {
      setSelectedCurrency(lastCurrency);
    }
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage('');

    // Add the additional fields to the FormData
    formData.append('trip_id', tripId);
    formData.append('original_currency', selectedCurrency);
    formData.append('payment_status', paymentStatus);

    // Add selected participants
    selectedParticipants.forEach(participantId => {
      formData.append(`participant_${participantId}`, 'on');
    });

    try {
      const result = await addExpenseAction(null, formData);
      if (result.message?.includes('success')) {
        // Save currency preference
        localStorage.setItem('lastUsedCurrency', selectedCurrency);
        setMessage('Expense added!');
        setTimeout(() => {
          onExpenseAdded();
          onClose();
          setMessage('');
        }, 1500);
      } else {
        setMessage(result.message || 'An error occurred');
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = () => {
    // Get the form element and create FormData from it
    const form = document.getElementById('add-expense-form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      handleSubmit(formData);
    }
  };

  const handleParticipantToggle = (participantId: string, checked: boolean) => {
    if (checked) {
      setSelectedParticipants(prev => [...prev, participantId]);
    } else {
      setSelectedParticipants(prev => prev.filter(id => id !== participantId));
    }
  };

  const toggleAllParticipants = () => {
    if (selectedParticipants.length === tripParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(tripParticipants.map(p => p.user_id));
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Expense"
      description="Create a new expense for your trip."
      size="xl"
      onSubmit={handleFormSubmit}
      submitText="Add Expense"
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <form id="add-expense-form" className="space-y-6">
        <FormSection title="Basic Information">
          <StandardInput
            label="Description"
            name="description"
            placeholder="e.g., Hotel room, Dinner, Transportation"
            required
            disabled={isSubmitting}
          />
        </FormSection>

        <FormSection title="Amount & Currency">
          <FormRow cols={2}>
            <StandardInput
              label="Amount"
              name="original_amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              disabled={isSubmitting}
            />
            
            <FormField label="Currency" required>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="h-10" disabled={isSubmitting}>
                  <SelectValue />
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
              {selectedCurrency !== mainCurrency && (
                <p className="text-xs text-gray-500 mt-1">
                  Will be converted to {mainCurrency} (trip currency)
                </p>
              )}
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Payment Status">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payment_status_radio"
                checked={paymentStatus === 'paid'}
                onChange={() => setPaymentStatus('paid')}
                disabled={isSubmitting}
                className="text-green-600"
              />
              <span className="text-green-600">Paid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payment_status_radio"
                checked={paymentStatus === 'pending'}
                onChange={() => setPaymentStatus('pending')}
                disabled={isSubmitting}
                className="text-orange-600"
              />
              <span className="text-orange-600">Pending</span>
            </label>
          </div>
        </FormSection>

        <FormSection title="Additional Details">
          <FormRow cols={2}>
            <FormField label="Category">
              <Select name="category_id">
                <SelectTrigger className="h-10" disabled={isSubmitting}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <StandardInput
              label="Location"
              name="location"
              placeholder="e.g., Paris, France"
              disabled={isSubmitting}
            />
          </FormRow>
        </FormSection>

        {/* Participants */}
        <FormSection title="Participants">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-sm font-medium">Select participants:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleAllParticipants}
                disabled={isSubmitting}
              >
                {selectedParticipants.length === tripParticipants.length ? 'Unselect All' : 'Select All'}
              </Button>
            </div>
            {tripParticipants.map((participant) => (
              <div key={participant.user_id} className="flex items-center gap-3">
                <Checkbox
                  id={`participant_${participant.user_id}`}
                  checked={selectedParticipants.includes(participant.user_id)}
                  onCheckedChange={(checked) => 
                    handleParticipantToggle(participant.user_id, checked as boolean)
                  }
                  disabled={isSubmitting}
                />
                <label
                  htmlFor={`participant_${participant.user_id}`}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {(participant.profiles.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>{participant.profiles.full_name || 'Unknown User'}</span>
                  {participant.role === 'admin' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </label>
              </div>
            ))}
            {selectedParticipants.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No participants selected. This expense will only be associated with you.
              </p>
            )}
          </div>
        </FormSection>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </form>
    </FormModal>
  );
}
