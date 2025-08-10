// Modal for admin currency settings
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Settings, DollarSign } from 'lucide-react';
// Server action will be passed as prop
import { CURRENCIES, formatCurrency } from '@/lib/currency';

type Trip = Database['public']['Tables']['trips']['Row'];

interface CurrencySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onSettingsUpdated: () => void;
  updateTripMainCurrencyAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function CurrencySettingsModal({ 
  isOpen, 
  onClose, 
  trip, 
  onSettingsUpdated,
  updateTripMainCurrencyAction
}: CurrencySettingsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(trip.main_currency || 'USD');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('trip_id', trip.id);
    formData.append('main_currency', selectedCurrency);

    try {
      const result = await updateTripMainCurrencyAction(null, formData);
      if (result.message?.includes('success')) {
        onSettingsUpdated();
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

  const currentCurrency = CURRENCIES.find(c => c.code === (trip.main_currency || 'USD'));
  const selectedCurrencyInfo = CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">Currency Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Main Trip Currency</h3>
                <p className="text-sm text-blue-700 mt-1">
                  All expenses will be converted to this currency for consistent tracking. 
                  This affects how totals and reports are calculated.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Currency */}
          <div>
            <Label>Current Main Currency</Label>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentCurrency?.symbol}</span>
                <div>
                  <p className="font-medium">{currentCurrency?.code}</p>
                  <p className="text-sm text-gray-600">{currentCurrency?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* New Currency Selection */}
          <div>
            <Label htmlFor="main_currency">New Main Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger disabled={isSubmitting} className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg">{currency.symbol}</span>
                      <div>
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-gray-500 ml-2">- {currency.name}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedCurrency !== (trip.main_currency || 'USD') && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Changing the main currency will affect how expense totals are displayed. 
                  Existing expenses will keep their original amounts but will be shown converted to {selectedCurrencyInfo?.name}.
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {selectedCurrency !== (trip.main_currency || 'USD') && (
            <div>
              <Label>Preview</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedCurrencyInfo?.symbol}</span>
                  <div>
                    <p className="font-medium">{selectedCurrencyInfo?.code}</p>
                    <p className="text-sm text-gray-600">{selectedCurrencyInfo?.name}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Example: {formatCurrency(100, selectedCurrency)}
                </p>
              </div>
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
              disabled={isSubmitting || selectedCurrency === (trip.main_currency || 'USD')}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Update Currency
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
