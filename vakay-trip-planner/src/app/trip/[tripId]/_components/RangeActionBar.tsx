'use client';

import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight, FileText, X, Calendar, Route, Sparkles, Expand, Copy, Lightbulb, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';

type Location = Database['public']['Tables']['locations']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];

interface RangeActionBarProps {
  selectedDates: string[];
  locations: Location[];
  draftItinerary: Map<string, ItineraryDay>;
  tripDates: Date[];
  onAssignLocation: (locationId: number | null) => void;
  onMarkTransfer: (originId: number, destinationId: number) => void;
  onAddNotes: () => void;
  onClearRange: () => void;
  onClose: () => void;
}

export function RangeActionBar({
  selectedDates,
  locations,
  draftItinerary,
  tripDates,
  onAssignLocation,
  onMarkTransfer,
  onAddNotes,
  onClearRange,
  onClose
}: RangeActionBarProps) {
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferOrigin, setTransferOrigin] = useState<string>('');
  const [transferDestination, setTransferDestination] = useState<string>('');
  const [showSmartActions, setShowSmartActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Smart defaults: suggest locations based on neighboring days
  useEffect(() => {
    if (showTransferForm && selectedDates.length > 0) {
      const firstDate = selectedDates[0];
      const lastDate = selectedDates[selectedDates.length - 1];
      
      // Try to find previous day's location as origin
      const prevDate = new Date(firstDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      const prevDay = draftItinerary.get(prevDateStr);
      
      if (prevDay?.location_1_id) {
        setTransferOrigin(prevDay.location_1_id.toString());
      }
      
      // Try to find next day's location as destination
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      const nextDay = draftItinerary.get(nextDateStr);
      
      if (nextDay?.location_1_id) {
        setTransferDestination(nextDay.location_1_id.toString());
      }
    }
  }, [showTransferForm, selectedDates, draftItinerary]);

  // Smart actions: find next unassigned day and suggest extending
  const getNextUnassignedDay = () => {
    const lastSelectedDate = new Date(selectedDates[selectedDates.length - 1]);
    let currentDate = new Date(lastSelectedDate);
    
    for (let i = 1; i <= 7; i++) { // Look ahead up to 7 days
      currentDate.setDate(currentDate.getDate() + 1);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = draftItinerary.get(dateStr);
      
      if (!dayData?.location_1_id) {
        return dateStr;
      }
    }
    return null;
  };

  // Helper function to check if a date is within trip dates
  const isTripDay = (date: Date) => {
    return tripDates.some(tripDate => 
      tripDate.getDate() === date.getDate() &&
      tripDate.getMonth() === date.getMonth() &&
      tripDate.getFullYear() === date.getFullYear()
    );
  };

  // Find similar stay patterns for templates
  const findSimilarStays = () => {
    if (selectedDates.length < 2) return null;
    
    const currentLocation = draftItinerary.get(selectedDates[0])?.location_1_id;
    if (!currentLocation) return null;
    
    // Look for other blocks with the same location and similar duration
    const similarStays: Array<{ start: string; end: string; duration: number }> = [];
    
    tripDates.forEach((date, index) => {
      if (index === 0) return;
      
      const dateStr = date.toISOString().split('T')[0];
      const dayData = draftItinerary.get(dateStr);
      
      if (dayData?.location_1_id === currentLocation) {
        // Find the start of this stay
        let stayStart = dateStr;
        for (let i = index - 1; i >= 0; i--) {
          const prevDate = tripDates[i];
          const prevDateStr = prevDate.toISOString().split('T')[0];
          const prevDay = draftItinerary.get(prevDateStr);
          
          if (prevDay?.location_1_id === currentLocation) {
            stayStart = prevDateStr;
          } else {
            break;
          }
        }
        
        // Find the end of this stay
        let stayEnd = dateStr;
        for (let i = index + 1; i < tripDates.length; i++) {
          const nextDate = tripDates[i];
          const nextDateStr = nextDate.toISOString().split('T')[0];
          const nextDay = draftItinerary.get(nextDateStr);
          
          if (nextDay?.location_1_id === currentLocation) {
            stayEnd = nextDateStr;
          } else {
            break;
          }
        }
        
        const duration = Math.ceil((new Date(stayEnd).getTime() - new Date(stayStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        similarStays.push({ start: stayStart, end: stayEnd, duration });
      }
    });
    
    return similarStays.length > 0 ? similarStays[0] : null;
  };

  const handleLocationChange = (value: string) => {
    if (value === 'clear') {
      onAssignLocation(null);
    } else {
      onAssignLocation(Number(value));
    }
  };

  const handleTransferSubmit = () => {
    if (transferOrigin && transferDestination) {
      onMarkTransfer(Number(transferOrigin), Number(transferDestination));
      setShowTransferForm(false);
      setTransferOrigin('');
      setTransferDestination('');
    }
  };

  // Smart action: extend to next unassigned day
  const handleExtendToNext = () => {
    const nextUnassigned = getNextUnassignedDay();
    if (nextUnassigned) {
      const currentLocation = draftItinerary.get(selectedDates[0])?.location_1_id;
      if (currentLocation) {
        // Find all dates from last selected to next unassigned
        const lastSelected = new Date(selectedDates[selectedDates.length - 1]);
        const nextDate = new Date(nextUnassigned);
        const datesToFill: string[] = [];
        
        for (let d = new Date(lastSelected); d <= nextDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          if (isTripDay(d)) {
            datesToFill.push(dateStr);
          }
        }
        
        datesToFill.forEach(dateStr => {
          onAssignLocation(currentLocation);
        });
      }
    }
  };

  const formatDateRange = () => {
    if (selectedDates.length === 0) return '';
    
    const startDate = new Date(selectedDates[0]);
    const endDate = new Date(selectedDates[selectedDates.length - 1]);
    
    if (selectedDates.length === 1) {
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const nextUnassignedDay = getNextUnassignedDay();
  const similarStay = findSimilarStays();

  // Mobile-optimized positioning and styling
  const containerClasses = isMobile 
    ? "fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out"
    : "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50";

  const contentClasses = isMobile
    ? "bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 px-4 py-6 max-h-[80vh] overflow-y-auto"
    : "bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 max-w-[calc(100vw-2rem)]";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {/* Mobile Drag Handle */}
        {isMobile && (
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-900">
                {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''} selected
              </span>
              <Badge variant="outline" className="text-xs">
                {formatDateRange()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSmartActions(!showSmartActions)}
              className={`h-8 px-2 text-xs ${showSmartActions ? 'bg-blue-100 text-blue-700' : ''}`}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Smart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Smart Actions Panel */}
        {showSmartActions && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Smart Suggestions</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
              {/* Extend to next unassigned day */}
              {nextUnassignedDay && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtendToNext}
                  className="h-8 px-3 text-xs bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 w-full sm:w-auto"
                >
                  <Expand className="h-3 w-3 mr-1" />
                  Extend to {new Date(nextUnassignedDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Button>
              )}
              
              {/* Similar stay template */}
              {similarStay && (
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <Copy className="h-3 w-3" />
                  <span>Similar stay: {similarStay.duration} days</span>
                </div>
              )}
              
              {/* Auto-suggest transfer if locations are different */}
              {selectedDates.length === 1 && (() => {
                const currentDay = draftItinerary.get(selectedDates[0]);
                const prevDate = new Date(selectedDates[0]);
                prevDate.setDate(prevDate.getDate() - 1);
                const prevDateStr = prevDate.toISOString().split('T')[0];
                const prevDay = draftItinerary.get(prevDateStr);
                
                if (currentDay?.location_1_id && prevDay?.location_1_id && 
                    currentDay.location_1_id !== prevDay.location_1_id) {
                  return (
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                      <Route className="h-3 w-3" />
                      <span>Transfer day suggested</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Transfer Form */}
        {showTransferForm && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Route className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Create Transfer Day</span>
              {transferOrigin && transferDestination && (
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <Sparkles className="h-3 w-3" />
                  <span>Smart suggestions applied</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <MapPin className="h-3 w-3 text-purple-600" />
                <Select value={transferOrigin} onValueChange={setTransferOrigin}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                    <SelectValue placeholder="From..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full border border-gray-300" 
                            style={{ backgroundColor: loc.color }}
                          ></div>
                          {loc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <ArrowRight className="h-4 w-4 text-purple-500 hidden sm:block" />
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <MapPin className="h-3 w-3 text-purple-600" />
                <Select value={transferDestination} onValueChange={setTransferDestination}>
                  <SelectTrigger className="w-full sm:w-[140px] h-8 text-xs">
                    <SelectValue placeholder="To..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full border border-gray-300" 
                            style={{ backgroundColor: loc.color }}
                          ></div>
                          {loc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  onClick={handleTransferSubmit}
                  disabled={!transferOrigin || !transferDestination}
                  className="h-8 px-3 text-xs bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferForm(false)}
                  className="h-8 px-3 text-xs flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Assign Location */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <Select onValueChange={handleLocationChange}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Assign location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear location</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300" 
                        style={{ backgroundColor: loc.color }}
                      ></div>
                      {loc.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons - Stack vertically on mobile */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Mark Transfer */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransferForm(!showTransferForm)}
              className={`h-9 px-3 flex items-center gap-2 w-full sm:w-auto ${
                showTransferForm ? 'bg-purple-100 border-purple-300 text-purple-700' : ''
              }`}
            >
              <Route className="h-4 w-4" />
              {showTransferForm ? 'Cancel Transfer' : 'Mark Transfer'}
            </Button>

            {/* Add Notes */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAddNotes}
              className="h-9 px-3 flex items-center gap-2 w-full sm:w-auto"
            >
              <FileText className="h-4 w-4" />
              Notes
            </Button>

            {/* Clear Range */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearRange}
              className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Mobile Close Hint */}
        {isMobile && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Swipe down or tap X to close
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
