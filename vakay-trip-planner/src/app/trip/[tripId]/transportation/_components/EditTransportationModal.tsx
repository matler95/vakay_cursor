'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';
import { X, Plane, Train, Bus, Car, Ship, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CURRENCIES } from '@/lib/currency';

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
      // Load selected participants for this transportation
      const { data: tps } = await supabase
        .from('transportation_participants' as any)
        .select('participant_user_id')
        .eq('transportation_id', transportation.id);
      setSelectedParticipants(new Set((tps || []).map((r: any) => r.participant_user_id)));

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
      const expectedDescription = `${transportation.provider} ${transportation.departure_location} → ${transportation.arrival_location}`;
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Transportation</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transportation Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Transportation Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
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
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="provider"> Name </Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => handleInputChange('provider', e.target.value)}
              placeholder="e.g., Delta Airlines, Amtrak, Hertz"
              required
            />
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_location">Departure Location</Label>
              <Input
                id="departure_location"
                value={formData.departure_location}
                onChange={(e) => handleInputChange('departure_location', e.target.value)}
                placeholder="e.g., JFK Airport, New York"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival_location">Arrival Location</Label>
              <Input
                id="arrival_location"
                value={formData.arrival_location}
                onChange={(e) => handleInputChange('arrival_location', e.target.value)}
                placeholder="e.g., LAX Airport, Los Angeles"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_date">Departure Date</Label>
              <Input
                id="departure_date"
                type="date"
                value={formData.departure_date}
                onChange={(e) => handleInputChange('departure_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival_date">Arrival Date</Label>
              <Input
                id="arrival_date"
                type="date"
                value={formData.arrival_date}
                onChange={(e) => handleInputChange('arrival_date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure_time">Departure Time (Optional)</Label>
              <Input
                id="departure_time"
                type="time"
                value={formData.departure_time}
                onChange={(e) => handleInputChange('departure_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrival_time">Arrival Time (Optional)</Label>
              <Input
                id="arrival_time"
                type="time"
                value={formData.arrival_time}
                onChange={(e) => handleInputChange('arrival_time', e.target.value)}
              />
            </div>
          </div>




          {/* Expense Section - Only show if no existing expense */}
          {!hasExistingExpense && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <Label>Add as Expense</Label>
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
                  {/* Amount/Currency/Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Amount</Label>
                      <Input value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select value={expenseCurrency} onValueChange={setExpenseCurrency}>
                        <SelectTrigger>
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
                    </div>
                    <div>
                      <Label>Payment Status *</Label>
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
                    </div>
                  </div>

                  {/* Participants Selection - Only show when adding expense */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <Label>Participants</Label>
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
            </div>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional details, special instructions, etc."
              rows={3}
            />
          </div>

          {/* Actions */}
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
              {isSubmitting ? 'Updating...' : 'Update Transportation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

