'use client';

import { useEffect, useState } from 'react';
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

interface AddTransportationModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onTransportationAdded: () => void;
}

const transportationTypes = [
  { value: 'flight', label: 'Flight', icon: Plane },
  { value: 'train', label: 'Train', icon: Train },
  { value: 'bus', label: 'Bus', icon: Bus },
  { value: 'car_rental', label: 'Car Rental', icon: Car },
  { value: 'ferry', label: 'Ferry', icon: Ship },
];

export function AddTransportationModal({
  tripId,
  isOpen,
  onClose,
  onTransportationAdded,
}: AddTransportationModalProps) {
  const supabase = createClientComponentClient<Database>();

  const [formData, setFormData] = useState({
    type: 'flight',
    provider: '',
    departure_location: '',
    arrival_location: '',
    departure_date: '',
    arrival_date: '',
    departure_time: '',
    arrival_time: '',
    flight_number: '',
    terminal: '',
    gate: '',
    seat: '',
    vehicle_number: '',
    carriage_coach: '',
    pickup_location: '',
    dropoff_location: '',
    booking_reference: '',
    notes: '',
  });

  const [participantOptions, setParticipantOptions] = useState<ParticipantOption[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  const [expenseEnabled, setExpenseEnabled] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('paid');
  const [mainCurrency, setMainCurrency] = useState('USD');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadParticipants = async () => {
      const { data: tp } = await supabase
        .from('trip_participants')
        .select('user_id')
        .eq('trip_id', tripId);
      if (!tp || tp.length === 0) return;
      const userIds = tp.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      const options = (profiles || []).map(p => ({ id: p.id, name: p.full_name || 'Unknown' }));
      setParticipantOptions(options);
    };
    const loadMainCurrency = async () => {
      const { data: trip } = await supabase
        .from('trips')
        .select('main_currency')
        .eq('id', tripId)
        .single();
      const mc = trip?.main_currency || 'USD';
      setMainCurrency(mc);
      const lastCurrency = localStorage.getItem('lastUsedCurrency');
      if (lastCurrency && CURRENCIES.find(c => c.code === lastCurrency)) {
        setExpenseCurrency(lastCurrency);
      } else {
        setExpenseCurrency(mc);
      }
    };
    loadParticipants();
    loadMainCurrency();
  }, [isOpen, supabase, tripId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/transportation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trip_id: tripId,
          ...formData,
          participants: Array.from(selectedParticipants),
          expense: expenseEnabled
            ? { amount: expenseAmount ? parseFloat(expenseAmount) : null, currency: expenseCurrency, payment_status: paymentStatus }
            : null,
        }),
      });

      if (response.ok) {
        try { localStorage.setItem('lastUsedCurrency', expenseCurrency); } catch {}
        onTransportationAdded();
      } else {
        console.error('Failed to add transportation');
      }
    } catch (error) {
      console.error('Error adding transportation:', error);
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

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Transportation</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
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

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider/Company</Label>
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



          {/* Participants Selection and Expense Section */}
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

                {/* Participants */}
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


          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
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
              {isSubmitting ? 'Adding...' : 'Add Transportation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
