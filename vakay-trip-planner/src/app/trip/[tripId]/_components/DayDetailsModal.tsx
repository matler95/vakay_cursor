'use client';

/**
 * DayDetailsModal Component
 * 
 * A native-like modal that displays comprehensive information about a specific day
 * including locations, transfers, transportation, accommodation, and editable notes.
 * 
 * Features:
 * - Swipe navigation between days
 * - Integration with transportation and accommodation tabs
 * - Editable notes section
 * - Native-like mobile experience
 * - Responsive design for iPhone 13
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronLeft, ChevronRight, MapPin, Plane, Train, Bus, Car, Ship, Building, Edit3, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Transportation = Database['public']['Tables']['transportation']['Row'];
type Accommodation = Database['public']['Tables']['accommodations']['Row'];

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  transportation: Transportation[];
  accommodations: Accommodation[];
  currentDate: string;
  onUpdateDay: (dateStr: string, updatedValues: Partial<ItineraryDay>) => void;
}

export function DayDetailsModal({
  isOpen,
  onClose,
  trip,
  itineraryDays,
  locations,
  transportation,
  accommodations,
  currentDate,
  onUpdateDay
}: DayDetailsModalProps) {
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  // Get all trip dates
  const tripDates = useMemo(() => {
    if (!trip.start_date || !trip.end_date) return [];
    
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const dates: Date[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    return dates;
  }, [trip.start_date, trip.end_date]);

  // Find current date index
  useEffect(() => {
    if (currentDate && tripDates.length > 0) {
      const index = tripDates.findIndex(date => 
        date.toISOString().split('T')[0] === currentDate
      );
      if (index !== -1) {
        setCurrentDateIndex(index);
      }
    }
  }, [currentDate, tripDates]);

  // Get current day data
  const currentDayData = useMemo(() => {
    if (tripDates.length === 0) return null;
    const dateStr = tripDates[currentDateIndex].toISOString().split('T')[0];
    return itineraryDays.find(day => day.date === dateStr);
  }, [currentDateIndex, tripDates, itineraryDays]);

  // Get current date string
  const currentDateStr = useMemo(() => {
    if (tripDates.length === 0) return '';
    return tripDates[currentDateIndex].toISOString().split('T')[0];
  }, [currentDateIndex, tripDates]);

  // Initialize notes when day changes
  useEffect(() => {
    if (currentDayData) {
      setNotes(currentDayData.notes || '');
      setHasChanges(false);
    }
  }, [currentDayData]);

  // Get transportation for current day
  const dayTransportation = useMemo(() => {
    if (!currentDateStr) return [];
    
    return transportation.filter(t => {
      const departureDate = t.departure_date;
      const arrivalDate = t.arrival_date;
      return departureDate === currentDateStr || arrivalDate === currentDateStr;
    });
  }, [currentDateStr, transportation]);

  // Get accommodation for current day
  const dayAccommodation = useMemo(() => {
    if (!currentDateStr) return null;
    
    return accommodations.find(a => {
      const checkIn = new Date(a.check_in_date);
      const checkOut = new Date(a.check_out_date);
      const current = new Date(currentDateStr);
      return current >= checkIn && current < checkOut;
    });
  }, [currentDateStr, accommodations]);

  // Navigation functions
  const goToPreviousDay = useCallback(() => {
    if (currentDateIndex > 0) {
      setCurrentDateIndex(prev => prev - 1);
    }
  }, [currentDateIndex]);

  const goToNextDay = useCallback(() => {
    if (currentDateIndex < tripDates.length - 1) {
      setCurrentDateIndex(prev => prev + 1);
    }
  }, [currentDateIndex, tripDates.length]);

  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    touchEndRef.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    
    if (touchStartRef.current && touchEndRef.current) {
      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      
      // Check if it's a horizontal swipe (more horizontal than vertical)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right - go to previous day
          goToPreviousDay();
        } else {
          // Swipe left - go to next day
          goToNextDay();
        }
      }
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [goToPreviousDay, goToNextDay]);

  // Handle notes editing
  const handleSaveNotes = useCallback(() => {
    if (currentDateStr && notes !== currentDayData?.notes) {
      onUpdateDay(currentDateStr, { notes });
      setHasChanges(false);
    }
    setIsEditingNotes(false);
  }, [currentDateStr, notes, currentDayData?.notes, onUpdateDay]);

  const handleCancelNotes = useCallback(() => {
    setNotes(currentDayData?.notes || '');
    setIsEditingNotes(false);
    setHasChanges(false);
  }, [currentDayData?.notes]);

  // Handle notes change
  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    setHasChanges(value !== (currentDayData?.notes || ''));
  }, [currentDayData?.notes]);

  // Get location by ID
  const getLocationById = useCallback((id: number | null) => {
    if (!id) return null;
    return locations.find(loc => loc.id === id);
  }, [locations]);

  // Get transportation icon
  const getTransportationIcon = useCallback((type: string) => {
    switch (type) {
      case 'flight': return Plane;
      case 'train': return Train;
      case 'bus': return Bus;
      case 'car_rental': return Car;
      case 'ferry': return Ship;
      default: return Plane;
    }
  }, []);

  // Format date
  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  if (!isOpen || tripDates.length === 0) return null;

  const currentDateObj = tripDates[currentDateIndex];
  const location1 = getLocationById(currentDayData?.location_1_id || null);
  const location2 = getLocationById(currentDayData?.location_2_id || null);

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm bg-white/30 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl w-full max-w-md h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
                 {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
           <div className="flex items-center gap-2 flex-1">
             <Button
               onClick={goToPreviousDay}
               disabled={currentDateIndex === 0}
               variant="ghost"
               size="sm"
               className="p-1.5 disabled:opacity-50 flex-shrink-0"
             >
               <ChevronLeft className="h-4 w-4" />
             </Button>
             
             <div className="text-center flex-1 min-w-0">
               <h2 className="text-lg font-semibold text-gray-900 truncate">
                 {formatDate(currentDateObj)}
               </h2>
               <p className="text-sm text-gray-600 truncate">
                 Day {currentDateIndex + 1} of {tripDates.length}
               </p>
             </div>
             
             <Button
               onClick={goToNextDay}
               disabled={currentDateIndex === tripDates.length - 1}
               variant="ghost"
               size="sm"
               className="p-1.5 disabled:opacity-50 flex-shrink-0"
             >
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
           
           <Button
             onClick={onClose}
             variant="ghost"
             size="sm"
             className="p-1.5 flex-shrink-0 ml-2"
           >
             <X className="h-4 w-4" />
           </Button>
         </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Location Section - Inline Layout */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Locations
            </h3>
            
            <div className="flex items-center gap-2">
              {location1 ? (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: location1.color || '#6B7280' }}
                    />
                    <span className="text-sm font-medium text-blue-900 truncate">
                      {location1.name}
                    </span>
                  </div>
                  {location1.description && (
                    <p className="text-xs text-blue-700 line-clamp-2">{location1.description}</p>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic flex-1 text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  No location assigned
                </div>
              )}
              
              {location2 && (
                <>
                  <div className="flex-shrink-0 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: location2.color || '#6B7280' }}
                      />
                      <span className="text-sm font-medium text-purple-900 truncate">
                        {location2.name}
                      </span>
                    </div>
                    {location2.description && (
                      <p className="text-xs text-purple-700 line-clamp-2">{location2.description}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Transportation Section */}
          {dayTransportation.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Plane className="h-4 w-4 text-green-600" />
                Transportation
              </h3>
              
              {dayTransportation.map((transport) => {
                const Icon = getTransportationIcon(transport.type);
                const isDeparture = transport.departure_date === currentDateStr;
                const isArrival = transport.arrival_date === currentDateStr;
                
                return (
                  <div key={transport.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900 capitalize">
                        {transport.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-green-700">
                        {transport.provider}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-green-800">
                      {isDeparture && (
                        <div>
                          <span className="font-medium">Departure:</span> {transport.departure_location}
                          {transport.departure_time && ` at ${transport.departure_time}`}
                        </div>
                      )}
                      {isArrival && (
                        <div>
                          <span className="font-medium">Arrival:</span> {transport.arrival_location}
                          {transport.arrival_time && ` at ${transport.arrival_time}`}
                        </div>
                      )}
                      {transport.booking_reference && (
                        <div>
                          <span className="font-medium">Booking:</span> {transport.booking_reference}
                        </div>
                      )}
                      {transport.notes && (
                        <div className="text-green-700">{transport.notes}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Accommodation Section */}
          {dayAccommodation && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-orange-600" />
                Accommodation
              </h3>
              
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-orange-900">
                    {dayAccommodation.name}
                  </h4>
                  <p className="text-xs text-orange-700">{dayAccommodation.address}</p>
                </div>
                
                <div className="space-y-1 text-xs text-orange-800">
                  {dayAccommodation.check_in_time && (
                    <div>
                      <span className="font-medium">Check-in:</span> {dayAccommodation.check_in_time}
                    </div>
                  )}
                  {dayAccommodation.check_out_time && (
                    <div>
                      <span className="font-medium">Check-out:</span> {dayAccommodation.check_out_time}
                    </div>
                  )}
                  {dayAccommodation.booking_confirmation && (
                    <div>
                      <span className="font-medium">Confirmation:</span> {dayAccommodation.booking_confirmation}
                    </div>
                  )}
                  {dayAccommodation.contact_phone && (
                    <div>
                      <span className="font-medium">Contact:</span> {dayAccommodation.contact_phone}
                    </div>
                  )}
                  {dayAccommodation.notes && (
                    <div className="text-orange-700">{dayAccommodation.notes}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes Section - Limited Character Count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Notes</h3>
              {!isEditingNotes ? (
                <Button
                  onClick={() => setIsEditingNotes(true)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 h-8"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button
                    onClick={handleSaveNotes}
                    variant="ghost"
                    size="sm"
                    className="p-1.5 h-8 text-green-600 hover:text-green-700"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={handleCancelNotes}
                    variant="ghost"
                    size="sm"
                    className="p-1.5 h-8 text-gray-600 hover:text-gray-700"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add notes for this day..."
                  className="min-h-[80px] max-h-[80px] resize-none"
                  autoFocus
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 text-right">
                  {notes.length}/200 characters
                </div>
              </div>
            ) : (
              <div className="min-h-[80px] max-h-[80px] p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-y-auto">
                {notes ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No notes added yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Swipe indicator */}
        <div className="p-4 text-center border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <p className="text-xs text-gray-500">
            Swipe left/right to navigate between days
          </p>
        </div>
      </div>
    </div>
  );
}
