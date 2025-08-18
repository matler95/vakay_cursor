// Modal for editing expenses
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
// Server action will be passed as prop
import { CURRENCIES } from '@/lib/currency';
import { 
  FormModal, 
  StandardInput, 
  StandardTextarea, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  expense_categories: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
};

type Category = Database['public']['Tables']['expense_categories']['Row'];

interface EditExpenseModalProps {
  expense: Expense;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  updateExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function EditExpenseModal({ 
  expense, 
  categories, 
  isOpen,
  onClose, 
  onUpdated,
  updateExpenseAction
}: EditExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(expense.original_currency || 'USD');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>(
    (expense.payment_status as 'pending' | 'paid') || 'pending'
  );

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage('');

    // Add the additional fields to the FormData
    formData.append('expense_id', expense.id.toString());
    formData.append('trip_id', expense.trip_id);
    formData.append('original_currency', selectedCurrency);
    formData.append('payment_status', paymentStatus);

    try {
      const result = await updateExpenseAction(null, formData);
      if (result.message?.includes('success')) {
        setMessage('Expense updated!');
        setTimeout(() => {
          onUpdated();
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
    const form = document.getElementById('edit-expense-form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      handleSubmit(formData);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Expense"
      description="Update the details of this expense."
      size="xl"
      onSubmit={handleFormSubmit}
      submitText="Update Expense"
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <form id="edit-expense-form" className="space-y-6">
        <FormSection title="Basic Information">
          <StandardInput
            label="Description"
            name="description"
            placeholder="e.g., Hotel room, Dinner, Transportation"
            defaultValue={expense.description}
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
              defaultValue={expense.original_amount?.toString()}
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
              {selectedCurrency !== expense.currency && (
                <p className="text-xs text-gray-500 mt-1">
                  Will be converted to {expense.currency} (trip currency)
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
              <Select name="category_id" defaultValue={expense.category_id?.toString()}>
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
              defaultValue={expense.location || ''}
              disabled={isSubmitting}
            />
          </FormRow>
        </FormSection>

        {/* Current Exchange Rate Info */}
        {expense.original_currency !== expense.currency && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Currency Conversion Info</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-blue-700">Original:</span> {expense.original_amount} {expense.original_currency}
              </p>
              <p>
                <span className="text-blue-700">Converted:</span> {expense.amount} {expense.currency}
              </p>
              <p>
                <span className="text-blue-700">Exchange Rate:</span> {expense.exchange_rate}
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Note: Exchange rates will be updated when you save changes.
            </p>
          </div>
        )}

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
