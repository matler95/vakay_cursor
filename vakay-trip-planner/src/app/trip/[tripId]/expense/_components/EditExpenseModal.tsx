// Modal for editing expenses
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Edit } from 'lucide-react';
// Server action will be passed as prop
import { CURRENCIES } from '@/lib/currency';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  expense_categories: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
};

type Category = Database['public']['Tables']['expense_categories']['Row'];

type TripParticipant = {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
  };
};

interface EditExpenseModalProps {
  expense: Expense;
  categories: Category[];
  tripParticipants: TripParticipant[];
  onClose: () => void;
  onUpdated: () => void;
  updateExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function EditExpenseModal({ 
  expense, 
  categories, 
  tripParticipants, 
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    formData.append('expense_id', expense.id.toString());
    formData.append('trip_id', expense.trip_id);
    formData.append('original_currency', selectedCurrency);
    formData.append('payment_status', paymentStatus);

    try {
      const result = await updateExpenseAction(null, formData);
      if (result.message?.includes('success')) {
        onUpdated();
      } else {
        setMessage(result.message || 'An error occurred');
      }
    } catch (error) {
      setMessage('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Edit Expense</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g., Hotel room, Dinner, Transportation"
              defaultValue={expense.description}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="original_amount">Amount *</Label>
              <Input
                id="original_amount"
                name="original_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={expense.original_amount?.toString()}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger disabled={isSubmitting}>
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
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <Label>Payment Status *</Label>
            <div className="flex gap-4 mt-2">
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
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <Select name="category_id" defaultValue={expense.category_id?.toString()}>
              <SelectTrigger disabled={isSubmitting}>
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
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., Paris, France"
              defaultValue={expense.location || ''}
              disabled={isSubmitting}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Additional details..."
              rows={3}
              defaultValue={expense.notes || ''}
              disabled={isSubmitting}
            />
          </div>

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
            <p className={`text-sm ${message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Expense
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
