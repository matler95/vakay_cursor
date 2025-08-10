// Modal for adding new expenses with currency and participant selection
'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, DollarSign, Users } from 'lucide-react';
import { CURRENCIES } from '@/lib/currency';

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
  const [selectedCurrency, setSelectedCurrency] = useState(mainCurrency);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');

  // Get last used currency from localStorage
  useEffect(() => {
    const lastCurrency = localStorage.getItem('lastUsedCurrency');
    if (lastCurrency && CURRENCIES.find(c => c.code === lastCurrency)) {
      setSelectedCurrency(lastCurrency);
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
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
        onExpenseAdded();
        onClose();
      } else {
        setMessage(result.message || 'An error occurred');
      }
    } catch {
      setMessage('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Add New Expense</h2>
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
              {selectedCurrency !== mainCurrency && (
                <p className="text-xs text-gray-500 mt-1">
                  Will be converted to {mainCurrency} (trip currency)
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
            <Select name="category_id">
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

          {/* Participants */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-4 w-4 text-gray-500" />
              <Label>Participants involved in this expense</Label>
            </div>
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
            </div>
            {selectedParticipants.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No participants selected. This expense will only be associated with you.
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., Paris, France"
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
              disabled={isSubmitting}
            />
          </div>

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
                  Adding...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Expense
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
