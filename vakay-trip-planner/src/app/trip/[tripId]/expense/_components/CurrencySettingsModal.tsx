// Modal for admin currency settings
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, DollarSign } from 'lucide-react';
// Server action will be passed as prop
import { CURRENCIES, formatCurrency } from '@/lib/currency';
import { FormModal, FormSection } from '@/components/ui';

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

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage('');

    // Add the additional fields to the FormData
    formData.append('trip_id', trip.id);
    formData.append('main_currency', selectedCurrency);

    try {
      const result = await updateTripMainCurrencyAction(null, formData);
      if (result.message?.includes('success')) {
        setMessage('Main currency updated!');
        setTimeout(() => {
          onSettingsUpdated();
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
    const form = document.getElementById('currency-settings-form') as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      handleSubmit(formData);
    }
  };

  const currentCurrency = CURRENCIES.find(c => c.code === (trip.main_currency || 'USD'));
  const selectedCurrencyInfo = CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Currency Settings"
      description="Update the main currency for this trip. All expenses will be converted to this currency for consistent tracking."
      size="md"
      onSubmit={handleFormSubmit}
      submitText="Update Currency"
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <form id="currency-settings-form" className="space-y-6">
        <FormSection title="Current Currency">
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

          <div className="flex items-center gap-3 p-3 bg-white border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentCurrency?.symbol}</span>
              <div>
                <p className="font-medium">{currentCurrency?.code}</p>
                <p className="text-sm text-gray-600">{currentCurrency?.name}</p>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="New Currency">
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
