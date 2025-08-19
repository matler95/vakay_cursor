'use client';

import { useEffect, useState } from 'react';
import { Database } from '@/types/database.types';
import { Plane, Train, Bus, Car, Ship, Users, DollarSign, Calendar, Clock } from 'lucide-react';
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

  // Airport autocomplete state
  const [departureAirports, setDepartureAirports] = useState<any[]>([]);
  const [arrivalAirports, setArrivalAirports] = useState<any[]>([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false);
  const [highlightedDepartureIndex, setHighlightedDepartureIndex] = useState(-1);
  const [highlightedArrivalIndex, setHighlightedArrivalIndex] = useState(-1);

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

  const handleSubmit = async () => {
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
        onClose();
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle airport autocomplete for flight type
    if (formData.type === 'flight') {
      if (field === 'departure_location') {
        handleAirportSearch(value, 'departure');
      } else if (field === 'arrival_location') {
        handleAirportSearch(value, 'arrival');
      }
    }

    // Clear airport suggestions when transportation type changes
    if (field === 'type') {
      setDepartureAirports([]);
      setArrivalAirports([]);
      setShowDepartureSuggestions(false);
      setShowArrivalSuggestions(false);
      setHighlightedDepartureIndex(-1);
      setHighlightedArrivalIndex(-1);
    }
  };

  const handleAirportSearch = async (query: string, type: 'departure' | 'arrival') => {
    if (query.trim().length < 2) {
      if (type === 'departure') {
        setDepartureAirports([]);
        setShowDepartureSuggestions(false);
      } else {
        setArrivalAirports([]);
        setShowArrivalSuggestions(false);
      }
      return;
    }

    try {
      const response = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        if (type === 'departure') {
          setDepartureAirports(data.airports || []);
          setShowDepartureSuggestions(data.airports && data.airports.length > 0);
          setHighlightedDepartureIndex(-1);
        } else {
          setArrivalAirports(data.airports || []);
          setShowArrivalSuggestions(data.airports && data.airports.length > 0);
          setHighlightedArrivalIndex(-1);
        }
      }
    } catch (error) {
      console.error('Error searching airports:', error);
    }
  };

  const handleAirportSelect = (airport: any, type: 'departure' | 'arrival') => {
    if (type === 'departure') {
      setFormData(prev => ({ ...prev, departure_location: airport.shortDisplay }));
      setShowDepartureSuggestions(false);
      setHighlightedDepartureIndex(-1);
    } else {
      setFormData(prev => ({ ...prev, arrival_location: airport.shortDisplay }));
      setShowArrivalSuggestions(false);
      setHighlightedArrivalIndex(-1);
    }
  };

  const handleAirportKeyDown = (e: React.KeyboardEvent, type: 'departure' | 'arrival') => {
    const airports = type === 'departure' ? departureAirports : arrivalAirports;
    const showSuggestions = type === 'departure' ? showDepartureSuggestions : showArrivalSuggestions;
    const highlightedIndex = type === 'departure' ? highlightedDepartureIndex : highlightedArrivalIndex;
    const setHighlightedIndex = type === 'departure' ? setHighlightedDepartureIndex : setHighlightedArrivalIndex;

    if (!showSuggestions || airports.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < airports.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleAirportSelect(airports[highlightedIndex], type);
        }
        break;
      case 'Escape':
        if (type === 'departure') {
          setShowDepartureSuggestions(false);
          setHighlightedDepartureIndex(-1);
        } else {
          setShowArrivalSuggestions(false);
          setHighlightedArrivalIndex(-1);
        }
        break;
    }
  };

  const handleAirportFocus = (type: 'departure' | 'arrival') => {
    if (type === 'departure') {
      if (formData.departure_location.trim() !== '' && departureAirports.length > 0) {
        setShowDepartureSuggestions(true);
      }
    } else {
      if (formData.arrival_location.trim() !== '' && arrivalAirports.length > 0) {
        setShowArrivalSuggestions(true);
      }
    }
  };

  const handleAirportBlur = (type: 'departure' | 'arrival') => {
    // Delay closing to allow click events on suggestions
    setTimeout(() => {
      if (type === 'departure') {
        setShowDepartureSuggestions(false);
        setHighlightedDepartureIndex(-1);
      } else {
        setShowArrivalSuggestions(false);
        setHighlightedArrivalIndex(-1);
      }
    }, 150);
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
      title="Add Transportation"
      description="Add new transportation details for your trip."
      size="xl"
      onSubmit={handleSubmit}
      submitText="Add Transportation"
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
                onFocus={() => handleAirportFocus('departure')}
                onBlur={() => handleAirportBlur('departure')}
                onKeyDown={(e) => handleAirportKeyDown(e, 'departure')}
                placeholder={formData.type === 'flight' ? "Search airports..." : "e.g., JFK Airport, New York"}
                required
              />
              
              {/* Departure Airport Suggestions Dropdown */}
              {showDepartureSuggestions && departureAirports.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="py-2">
                    {departureAirports.map((airport, index) => (
                      <button
                        key={airport.id}
                        type="button"
                        onClick={() => handleAirportSelect(airport, 'departure')}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                          highlightedDepartureIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <span className="text-lg">✈️</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {airport.display}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                onFocus={() => handleAirportFocus('arrival')}
                onBlur={() => handleAirportBlur('arrival')}
                onKeyDown={(e) => handleAirportKeyDown(e, 'arrival')}
                placeholder={formData.type === 'flight' ? "Search airports..." : "e.g., LAX Airport, Los Angeles"}
                required
              />
              
              {/* Arrival Airport Suggestions Dropdown */}
              {showArrivalSuggestions && arrivalAirports.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="py-2">
                    {arrivalAirports.map((airport, index) => (
                      <button
                        key={airport.id}
                        type="button"
                        onClick={() => handleAirportSelect(airport, 'arrival')}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                          highlightedArrivalIndex === index ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <span className="text-lg">✈️</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {airport.display}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
