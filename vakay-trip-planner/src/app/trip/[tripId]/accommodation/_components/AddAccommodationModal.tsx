'use client';

import { useEffect, useState } from 'react';
import { Database } from '@/types/database.types';
import { X, Bed, MapPin, Calendar, FileText, Phone, FileEdit, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CURRENCIES } from '@/lib/currency';

interface AddAccommodationModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccommodationAdded: () => void;
}

type ParticipantOption = { id: string; name: string };

export function AddAccommodationModal({
  tripId,
  isOpen,
  onClose,
  onAccommodationAdded
}: AddAccommodationModalProps) {
  const supabase = createClientComponentClient<Database>();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    trip_id: tripId,
    name: '',
    address: '',
    check_in_date: '',
    check_in_time: '',
    check_out_date: '',
    check_out_time: '',
    booking_confirmation: '',
    booking_url: '',
    contact_phone: '',
    notes: ''
  });
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');

  const [participantOptions, setParticipantOptions] = useState<ParticipantOption[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());

  const [expenseEnabled, setExpenseEnabled] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('paid');
  const [mainCurrency, setMainCurrency] = useState('USD');

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

  const handleFetchDetails = async () => {
    if (fetchingDetails || !formData.booking_url) return;
    setFetchingDetails(true);
    setFetchMessage('');
    try {
      let finalName: string | undefined;
      let finalAddress: string | undefined;
      let attempt = 0;
      while (attempt < 3 && !(finalName || finalAddress)) {
        attempt++;
        const resp = await fetch('/api/accommodation/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body: JSON.stringify({ url: formData.booking_url })
        });
        const data = await resp.json();
        if (data?.name && !finalName) finalName = data.name as string;
        if (data?.address_line && !finalAddress) finalAddress = data.address_line as string;
        if (!(finalName || finalAddress)) {
          // setFetchMessage(`Retrying... (${attempt})`);
          await new Promise(r => setTimeout(r, 350));
        }
      }

      if (finalName) {
        setFormData(prev => ({ ...prev, name: prev.name || finalName! }));
      }
      if (finalAddress) {
        setFormData(prev => ({ ...prev, address: prev.address || finalAddress! }));
      }

      if (!(finalName || finalAddress)) {
        setFetchMessage('Could not auto-detect details. Please fill manually.');
      } else {
        setFetchMessage('Details fetched. Please review and complete.');
        try { (document.getElementById('name') as HTMLInputElement)?.focus(); } catch {}
      }
    } catch {
      setFetchMessage('Failed to fetch details. Please fill manually.');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/accommodation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          participants: Array.from(selectedParticipants),
          expense: expenseEnabled
            ? { amount: expenseAmount ? parseFloat(expenseAmount) : null, currency: expenseCurrency, payment_status: paymentStatus }
            : null,
        }),
      });

      if (response.ok) {
        try { localStorage.setItem('lastUsedCurrency', expenseCurrency); } catch {}
        onAccommodationAdded();
      } else {
        console.error('Failed to add accommodation');
        alert('Failed to add accommodation. Please try again.');
      }
    } catch (error) {
      console.error('Error adding accommodation:', error);
      alert('Failed to add accommodation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bed className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add Accommodation</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Basic Information
            </h3>

            {/* Booking URL first */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
                <Label htmlFor="booking_url">Booking URL</Label>
                <Input
                  id="booking_url"
                  type="url"
                  value={formData.booking_url || ''}
                  onChange={(e) => handleInputChange('booking_url', e.target.value)}
                  placeholder="https://www.booking.com/..."
                />
              </div>
              <div>
                <Button type="button" onClick={handleFetchDetails} disabled={fetchingDetails || !formData.booking_url} className="w-full">
                  {fetchingDetails ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch details'
                  )}
                </Button>
              </div>
            </div>
            {fetchMessage && (
              <p className="text-sm text-gray-600">{fetchMessage}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Accommodation Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Hotel name, Airbnb, etc."
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Check-in/Check-out */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Check-in & Check-out
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="check_in_date">Check-in Date *</Label>
                <Input
                  id="check_in_date"
                  type="date"
                  value={formData.check_in_date}
                  onChange={(e) => handleInputChange('check_in_date', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="check_out_date">Check-out Date *</Label>
                <Input
                  id="check_out_date"
                  type="date"
                  value={formData.check_out_date}
                  onChange={(e) => handleInputChange('check_out_date', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Expense Section */}
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
            )}
          </div>

          {/* Participants */}
          {expenseEnabled && (
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
          )}

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Additional Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="booking_confirmation">Booking Confirmation</Label>
                <Input
                  id="booking_confirmation"
                  value={formData.booking_confirmation || ''}
                  onChange={(e) => handleInputChange('booking_confirmation', e.target.value)}
                  placeholder="Confirmation number"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes, special requests, etc."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                'Add Accommodation'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
