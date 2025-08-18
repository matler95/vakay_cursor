'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { Plane, Train, Bus, Car, Ship, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CURRENCIES } from '@/lib/currency';
import { 
  FormModal, 
  StandardInput, 
  StandardTextarea, 
  StandardDateInput, 
  StandardTimeInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';

type Transportation = Database['public']['Tables']['transportation']['Row'];

type ParticipantOption = { id: string; name: string };

interface EditTransportationModalProps {
  transportation: Transportation;
  isOpen: boolean;
  onClose: () => void;
  onTransportationUpdated: () => void;
}

const transportationTypes = [
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'car_rental', label: 'Car Rental', icon: Car },
  { value: 'ferry', label: 'Ferry', icon: Ship },
];

export function EditTransportationModal({
  transportation,
  isOpen,
  onClose,
  onTransportationUpdated,
}: EditTransportationModalProps) {
  const supabase = createClientComponentClient<Database>();
  const [formData, setFormData] = useState({
    type: transportation.type || 'flight',
    provider: transportation.provider || '',
    departure_location: transportation.departure_location || '',
    arrival_location: transportation.arrival_location || '',
    departure_date: transportation.departure_date || '',
    arrival_date: transportation.arrival_date || '',
    departure_time: transportation.departure_time || '',
    arrival_time: transportation.arrival_time || '',
    flight_number: transportation.flight_number || '',
    terminal: transportation.terminal || '',
    gate: transportation.gate || '',
    seat: transportation.seat || '',
    vehicle_number: transportation.vehicle_number || '',
    carriage_coach: transportation.carriage_coach || '',
    pickup_location: transportation.pickup_location || '',
    dropoff_location: transportation.dropoff_location || '',
    booking_reference: transportation.booking_reference || '',
    notes: transportation.notes || '',
  });

  const [participantOptions, setParticipantOptions] = useState<ParticipantOption[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Expense-related state
  const [expenseEnabled, setExpenseEnabled] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('paid');
  const [mainCurrency, setMainCurrency] = useState('USD');
  const [hasExistingExpense, setHasExistingExpense] = useState(false);

  // Airport autocomplete state - removed unused functionality

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      // Load participants for the trip
      const { data: tripRow } = await supabase
        .from('transportation')
        .select('trip_id')
        .eq('id', transportation.id)
        .single();

      if (!tripRow) return;
      const { data: tp } = await supabase
        .from('trip_participants')
        .select('user_id')
        .eq('trip_id', tripRow.trip_id);
      const ids = (tp || []).map(p => p.user_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ids);
        setParticipantOptions((profiles || []).map(p => ({ id: p.id, name: p.full_name || 'Unknown' })));
      }
      // Load selected participants for this transportation - removed due to missing table

      // Check if transportation already has an expense
      const { data: trip } = await supabase
        .from('trips')
        .select('main_currency')
        .eq('id', tripRow.trip_id)
        .single();
      const mc = trip?.main_currency || 'USD';
      setMainCurrency(mc);
      setExpenseCurrency(mc);

      // Check for existing expense by matching description pattern
      const formatLocationDisplay = (location: string, type: string) => {
        if (type === 'flight') {
          // Extract airport code from location string
          // Expected format: "WAW - Warsaw Chopin Airport, Warsaw" or just "WAW"
          const airportCodeMatch = location.match(/^([A-Z]{3})/);
          if (airportCodeMatch) {
            return airportCodeMatch[1]; // Return just the airport code (e.g., "WAW")
          }
          // Fallback: if no airport code found, return the original location
          return location;
        }
        // For non-flight transportation, return the original location
        return location;
      };

      const expectedDescription = `${transportation.provider} ${formatLocationDisplay(transportation.departure_location, transportation.type)} → ${formatLocationDisplay(transportation.arrival_location, transportation.type)}`;
      const { data: existingExpense } = await supabase
        .from('expenses')
        .select('id, amount, currency, payment_status')
        .eq('trip_id', tripRow.trip_id)
        .eq('description', expectedDescription)
        .single();

      if (existingExpense) {
        setHasExistingExpense(true);
        setExpenseAmount(existingExpense.amount.toString());
        setExpenseCurrency(existingExpense.currency);
        setPaymentStatus(existingExpense.payment_status as 'pending' | 'paid' || 'paid');
      }
    };
    load();
  }, [isOpen, supabase, transportation.id, transportation.provider, transportation.departure_location, transportation.arrival_location]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/transportation/${transportation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          participants: Array.from(selectedParticipants),
          expense: expenseEnabled && !hasExistingExpense
            ? { amount: expenseAmount ? parseFloat(expenseAmount) : null, currency: expenseCurrency, payment_status: paymentStatus }
            : null,
        }),
      });

      if (response.ok) {
        onTransportationUpdated();
        onClose();
      } else {
        console.error('Failed to update transportation');
      }
    } catch (error) {
      console.error('Error updating transportation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));




  };







  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Transportation"
      description="Update transportation details for your trip."
      size="xl"
      onSubmit={handleSubmit}
      submitText="Update Transportation"
      cancelText="Cancel"
      loading={isSubmitting}
    >
      <div className="space-y-6">
        <FormSection title="Basic Information">
          <FormRow cols={2}>
            <FormField label="Type">
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transportationTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormField>

            <StandardInput
              label="Provider Name"
              name="provider"
              placeholder="e.g., Delta Airlines, Amtrak, Hertz"
              value={formData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              required
            />
          </FormRow>
        </FormSection>

        <FormSection title="Departure Details">
          <FormField label="Departure Location" required>
            <div className="relative">
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.departure_location}
                onChange={(e) => handleInputChange('departure_location', e.target.value)}
                placeholder="e.g., JFK Airport, New York"
                required
              />
            </div>
          </FormField>

          <FormRow cols={2}>
            <StandardDateInput
              label="Departure Date"
              name="departure_date"
              value={formData.departure_date}
              onChange={(e) => handleInputChange('departure_date', e.target.value)}
              required
            />
            
            <StandardTimeInput
              label="Departure Time"
              name="departure_time"
              value={formData.departure_time}
              onChange={(e) => handleInputChange('departure_time', e.target.value)}
            />
          </FormRow>
        </FormSection>

        <FormSection title="Arrival Details">
          <FormField label="Arrival Location" required>
            <div className="relative">
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.arrival_location}
                onChange={(e) => handleInputChange('arrival_location', e.target.value)}
                placeholder="e.g., LAX Airport, Los Angeles"
                required
              />
            </div>
          </FormField>

          <FormRow cols={2}>
            <StandardDateInput
              label="Arrival Date"
              name="arrival_date"
              value={formData.arrival_date}
              onChange={(e) => handleInputChange('arrival_date', e.target.value)}
              required
            />
            
            <StandardTimeInput
              label="Arrival Time"
              name="arrival_time"
              value={formData.arrival_time}
              onChange={(e) => handleInputChange('arrival_time', e.target.value)}
            />
          </FormRow>
        </FormSection>

        {/* Flight-specific fields */}
        {formData.type === 'flight' && (
          <FormSection title="Flight Details">
            <FormRow cols={2}>
              <StandardInput
                label="Flight Number"
                name="flight_number"
                placeholder="e.g., DL1234"
                value={formData.flight_number}
                onChange={(e) => handleInputChange('flight_number', e.target.value)}
              />
              
              <StandardInput
                label="Terminal"
                name="terminal"
                placeholder="e.g., Terminal 1"
                value={formData.terminal}
                onChange={(e) => handleInputChange('terminal', e.target.value)}
              />
            </FormRow>

            <FormRow cols={2}>
              <StandardInput
                label="Gate"
                name="gate"
                placeholder="e.g., A12"
                value={formData.gate}
                onChange={(e) => handleInputChange('gate', e.target.value)}
              />
              
              <StandardInput
                label="Seat"
                name="seat"
                placeholder="e.g., 12A"
                value={formData.seat}
                onChange={(e) => handleInputChange('seat', e.target.value)}
              />
            </FormRow>
          </FormSection>
        )}

        {/* Expense Section - Only show if no existing expense */}
        {!hasExistingExpense && (
          <FormSection title="Expense">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Add as Expense</span>
              </div>
              <Button
                type="button"
                variant={expenseEnabled ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setExpenseEnabled(prev => !prev)}
              >
                {expenseEnabled ? 'Remove Expense' : 'Add as Expense'}
              </Button>
            </div>

            {expenseEnabled && (
              <div className="space-y-4">
                <FormRow cols={3}>
                  <StandardInput
                    label="Amount"
                    name="expense_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                  
                  <FormField label="Currency">
                    <Select value={expenseCurrency} onValueChange={setExpenseCurrency}>
                      <SelectTrigger className="h-10">
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
                    {expenseCurrency !== mainCurrency && (
                      <p className="text-xs text-gray-500 mt-1">
                        Will be converted to {mainCurrency} (trip currency)
                      </p>
                    )}
                  </FormField>

                  <FormField label="Payment Status">
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="payment_status_radio"
                          checked={paymentStatus === 'paid'}
                          onChange={() => setPaymentStatus('paid')}
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
                          className="text-orange-600"
                        />
                        <span className="text-orange-600">Pending</span>
                      </label>
                    </div>
                  </FormField>
                </FormRow>

                {/* Participants Selection - Only show when adding expense */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Participants</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {participantOptions.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedParticipants.has(p.id)}
                          onChange={() => toggleParticipant(p.id)}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                    {participantOptions.length === 0 && (
                      <p className="text-sm text-gray-500">No participants found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </FormSection>
        )}

        {/* Show existing expense info if it exists */}
        {hasExistingExpense && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">Already added as expense</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              This transportation is already tracked as an expense. You can manage it from the Expenses section.
            </p>
          </div>
        )}

      </div>
    </FormModal>
  );
}

