'use client';

import { useEffect, useState } from 'react';
import { Database } from '@/types/database.types';
import { Bed, MapPin, Calendar, FileText, Phone, FileEdit, Users, DollarSign, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CURRENCIES } from '@/lib/currency';
import { 
  FormModal, 
  StandardInput, 
  StandardTextarea, 
  StandardUrlInput, 
  StandardPhoneInput, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { validateAccommodationDates } from '@/lib/dateValidation';

interface AddAccommodationModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  onAccommodationAdded: () => void;
  prefilledData?: {
    name?: string;
    address?: string;
    booking_url?: string;
  };
}

type ParticipantOption = { id: string; name: string };
type TripLocation = Database['public']['Tables']['locations']['Row'];

export function AddAccommodationModal({
  tripId,
  isOpen,
  onClose,
  onAccommodationAdded,
  prefilledData
}: AddAccommodationModalProps) {
  const supabase = createClientComponentClient<Database>();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    trip_id: tripId,
    name: '',
    address: '',
    check_in_date: '',
    check_out_date: '',
    booking_confirmation: '',
    booking_url: '',
    contact_phone: '',
    notes: '',
  });

  const [participantOptions, setParticipantOptions] = useState<ParticipantOption[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [tripLocations, setTripLocations] = useState<TripLocation[]>([]);
  const [tripDates, setTripDates] = useState<{ start_date: string | null; end_date: string | null }>({ start_date: null, end_date: null });

  const [expenseEnabled, setExpenseEnabled] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('paid');
  const [mainCurrency, setMainCurrency] = useState('USD');

  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<TripLocation[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);

  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    // Set prefilled data if available
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        name: prefilledData.name || prev.name,
        address: prefilledData.address || prev.address,
        booking_url: prefilledData.booking_url || prev.booking_url
      }));
    }
    
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
        .select('main_currency, start_date, end_date')
        .eq('id', tripId)
        .single();
      const mc = trip?.main_currency || 'USD';
      setMainCurrency(mc);
      setTripDates({
        start_date: trip?.start_date || null,
        end_date: trip?.end_date || null
      });
      const lastCurrency = localStorage.getItem('lastUsedCurrency');
      if (lastCurrency && CURRENCIES.find(c => c.code === lastCurrency)) {
        setExpenseCurrency(lastCurrency);
      } else {
        setExpenseCurrency(mc);
      }
    };
    const loadTripLocations = async () => {
      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('trip_id', tripId)
        .order('name');
      setTripLocations(locations || []);
    };
    loadParticipants();
    loadMainCurrency();
    loadTripLocations();
  }, [isOpen, supabase, tripId, prefilledData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle address field specifically for autocomplete
    if (field === 'address') {
      if (value.trim() === '') {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        return;
      }

      const filtered = tripLocations.filter(location =>
        location.name.toLowerCase().includes(value.toLowerCase()) ||
        (location.description && location.description.toLowerCase().includes(value.toLowerCase()))
      );
      
      setAddressSuggestions(filtered);
      setShowAddressSuggestions(filtered.length > 0);
      setHighlightedSuggestionIndex(-1);
    }

    // Validate dates when they change
    if (field === 'check_in_date' || field === 'check_out_date') {
      const checkIn = field === 'check_in_date' ? value : formData.check_in_date;
      const checkOut = field === 'check_out_date' ? value : formData.check_out_date;
      
      if (checkIn && checkOut) {
        const validation = validateAccommodationDates(checkIn, checkOut);
        if (!validation.isValid) {
          setDateError(validation.error!);
        } else {
          setDateError('');
        }
      } else {
        setDateError('');
      }
    }
  };

  const handleAddressSelect = (location: TripLocation) => {
    setFormData(prev => ({
      ...prev,
      address: location.name
    }));
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setHighlightedSuggestionIndex(-1);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (!showAddressSuggestions || addressSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedSuggestionIndex(prev => 
          prev < addressSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedSuggestionIndex >= 0) {
          handleAddressSelect(addressSuggestions[highlightedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowAddressSuggestions(false);
        setHighlightedSuggestionIndex(-1);
        break;
    }
  };

  const handleAddressFocus = () => {
    if (formData.address.trim() !== '' && addressSuggestions.length > 0) {
      setShowAddressSuggestions(true);
    }
  };

  const handleAddressBlur = () => {
    // Delay closing to allow click events on suggestions
    setTimeout(() => {
      setShowAddressSuggestions(false);
      setHighlightedSuggestionIndex(-1);
    }, 150);
  };

  const toggleParticipant = (id: string) => {
    setSelectedParticipants(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    // Clear any previous errors
    setDateError('');
    
    // Validate dates before submission
    if (formData.check_in_date && formData.check_out_date) {
      const validation = validateAccommodationDates(
        formData.check_in_date, 
        formData.check_out_date
      );
      if (!validation.isValid) {
        setDateError(validation.error!);
        setIsLoading(false);
        return;
      }
    }

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
        onClose();
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Accommodation"
      description="Add new accommodation details for your trip."
      size="xl"
      onSubmit={handleSubmit}
      submitText="Add Accommodation"
      cancelText="Cancel"
      loading={isLoading}
    >
      <div className="space-y-6">
        <FormSection title="Basic Information">
          <StandardUrlInput
            label="Booking URL"
            name="booking_url"
            placeholder="https://www.booking.com/..."
            value={formData.booking_url || ''}
            onChange={(e) => handleInputChange('booking_url', e.target.value)}
          />

          <FormRow cols={2}>
            <StandardInput
              label="Accommodation Name"
              name="name"
              placeholder="Hotel name, Airbnb, etc."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            
            <FormField label="Location" required>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <input
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-4"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  onFocus={handleAddressFocus}
                  onBlur={handleAddressBlur}
                  onKeyDown={handleAddressKeyDown}
                  placeholder="Search trip locations or enter address"
                  required
                />
              </div>
              
              {/* Address Suggestions Dropdown */}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="py-2">
                    {addressSuggestions.map((location, index) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => handleAddressSelect(location)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                          highlightedSuggestionIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <MapPin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {location.name}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Trip Location
                              </span>
                            </div>
                            {location.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {location.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </FormField>
          </FormRow>
        </FormSection>

        <FormSection title="Check-in & Check-out">
          <FormRow cols={2}>
            <DatePicker
              label="Check-in Date"
              value={formData.check_in_date}
              onChange={(date) => handleInputChange('check_in_date', date)}
              placeholder="Select check-in date"
              required
              min={tripDates.start_date || undefined}
              max={tripDates.end_date || undefined}
            />
            
            <DatePicker
              label="Check-out Date"
              value={formData.check_out_date}
              onChange={(date) => handleInputChange('check_out_date', date)}
              placeholder="Select check-out date"
              required
              min={formData.check_in_date || tripDates.start_date || undefined}
              max={tripDates.end_date || undefined}
            />
          </FormRow>


          
          {dateError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {dateError}
            </p>
          )}
        </FormSection>

        {/* Expense Section */}
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

              {/* Participants */}
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
      </div>
    </FormModal>
  );
}
