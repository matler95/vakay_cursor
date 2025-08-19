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
  StandardTimePicker, 
  FormSection, 
  FormRow, 
  FormField 
} from '@/components/ui';
import { DatePicker } from '@/components/ui/date-picker';
import { validateTransportationDates } from '@/lib/dateValidation';

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
  const [dateError, setDateError] = useState('');
  const [tripDates, setTripDates] = useState<{ start_date: string | null; end_date: string | null }>({ start_date: null, end_date: null });
  
  // Expense-related state
  const [expenseEnabled, setExpenseEnabled] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('USD');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('paid');
  const [mainCurrency, setMainCurrency] = useState('USD');
  const [hasExistingExpense, setHasExistingExpense] = useState(false);

  // Airport autocomplete state
  const [departureAirports, setDepartureAirports] = useState<any[]>([]);
  const [arrivalAirports, setArrivalAirports] = useState<any[]>([]);
  const [showDepartureSuggestions, setShowDepartureSuggestions] = useState(false);
  const [showArrivalSuggestions, setShowArrivalSuggestions] = useState(false);
  const [highlightedDepartureIndex, setHighlightedDepartureIndex] = useState(-1);
  const [highlightedArrivalIndex, setHighlightedArrivalIndex] = useState(-1);

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
      
      // Load trip dates for validation
      const { data: tripData } = await supabase
        .from('trips')
        .select('start_date, end_date, main_currency')
        .eq('id', tripRow.trip_id)
        .single();
      
      setTripDates({
        start_date: tripData?.start_date || null,
        end_date: tripData?.end_date || null
      });
      
      setMainCurrency(tripData?.main_currency || 'USD');

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
  }, [isOpen, supabase, transportation.id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Clear any previous errors
    setDateError('');
    
    // Validate dates before submission
    if (formData.departure_date && formData.arrival_date) {
      const validation = validateTransportationDates(
        formData.departure_date, 
        formData.arrival_date,
        tripDates.start_date || undefined,
        tripDates.end_date || undefined
      );
      if (!validation.isValid) {
        setDateError(validation.error!);
        setIsSubmitting(false);
        return;
      }
    }

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

    // Validate dates when they change
    if (field === 'departure_date' || field === 'arrival_date') {
      const departure = field === 'departure_date' ? value : formData.departure_date;
      const arrival = field === 'arrival_date' ? value : formData.arrival_date;
      
      if (departure && arrival) {
        const validation = validateTransportationDates(departure, arrival, tripDates.start_date || undefined, tripDates.end_date || undefined);
        if (!validation.isValid) {
          setDateError(validation.error!);
        } else {
          setDateError('');
        }
      } else {
        setDateError('');
      }
    }

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
            <DatePicker
              label="Departure Date"
              value={formData.departure_date}
              onChange={(date) => handleInputChange('departure_date', date)}
              placeholder="Select departure date"
              required
              min={tripDates.start_date || undefined}
              max={tripDates.end_date || undefined}
            />
            
            <StandardTimePicker
              label="Departure Time"
              name="departure_time"
              value={formData.departure_time}
              onChange={(time) => handleInputChange('departure_time', time)}
              placeholder="Select departure time"
            />
          </FormRow>
          
          {dateError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {dateError}
            </p>
          )}

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
                              <span className="text-gray-900 truncate">
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
            <DatePicker
              label="Arrival Date"
              value={formData.arrival_date}
              onChange={(date) => handleInputChange('arrival_date', date)}
              placeholder="Select arrival date"
              required
              min={formData.departure_date || tripDates.start_date || undefined}
              max={tripDates.end_date || undefined}
            />
            
            <StandardTimePicker
              label="Arrival Time"
              name="arrival_time"
              value={formData.arrival_time}
              onChange={(time) => handleInputChange('arrival_time', time)}
              placeholder="Select arrival time"
            />
          </FormRow>
          
          {dateError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {dateError}
            </p>
          )}

        </FormSection>


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

