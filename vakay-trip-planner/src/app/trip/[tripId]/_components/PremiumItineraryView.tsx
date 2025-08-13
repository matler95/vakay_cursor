'use client';

import { getDatesInRange } from '@/lib/dateUtils';
import { Database } from '@/types/database.types';
import { PremiumCalendarView } from './PremiumCalendarView';
import { PremiumListView } from './PremiumListView';
import { PremiumDayCard } from './PremiumDayCard';
import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, CheckCircle, AlertCircle, X, Calendar, List, Grid3X3, Save, RotateCcw, Edit3, MapPin } from 'lucide-react';
import { BulkActionPanel } from './BulkActionPanel';
import { saveItineraryChanges } from '../actions';
import { useActionState } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface PremiumItineraryViewProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  isEditing: boolean;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function PremiumItineraryView({ 
  trip, 
  itineraryDays, 
  locations, 
  isEditing, 
  setIsEditing 
}: PremiumItineraryViewProps) {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [draftItinerary, setDraftItinerary] = useState<Map<string, ItineraryDay>>(new Map());
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(saveItineraryChanges, { message: '' });
  const [showMessage, setShowMessage] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'grid'>('calendar');
  const [activeTab, setActiveTab] = useState('itinerary');

  useEffect(() => {
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
  }, [itineraryDays]);

  // Set default view mode based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setViewMode('calendar');
      } else if (window.innerWidth >= 768) { // md breakpoint
        setViewMode('grid');
      } else {
        setViewMode('list');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-dismiss status messages after 5 seconds
  useEffect(() => {
    if (state.message) {
      setShowMessage(true);
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.message]);

  const handleSelectDate = (dateStr: string) => {
    const newSelectedDates = new Set(selectedDates);
    if (newSelectedDates.has(dateStr)) {
      newSelectedDates.delete(dateStr);
    } else {
      newSelectedDates.add(dateStr);
    }
    setSelectedDates(newSelectedDates);
  };

  const handleUpdateDraft = (dateStr: string, updatedValues: Partial<ItineraryDay>) => {
    setDraftItinerary(prevDraft => {
      const newDraft = new Map(prevDraft);
      const currentDay = newDraft.get(dateStr) || { 
        date: dateStr, 
        trip_id: trip.id, 
        id: -1,
        location_1_id: null, 
        location_2_id: null, 
        notes: null, 
        summary: null
      };
      newDraft.set(dateStr, { ...currentDay, ...updatedValues });
      return newDraft;
    });
  };

  const handleBulkUpdate = (updates: Partial<ItineraryDay>) => {
    setDraftItinerary(prevDraft => {
      const newDraft = new Map(prevDraft);
      selectedDates.forEach(dateStr => {
        const currentDay = newDraft.get(dateStr) || {
          date: dateStr, 
          trip_id: trip.id, 
          id: -1,
          location_1_id: null, 
          location_2_id: null, 
          notes: null, 
          summary: null
        };
        newDraft.set(dateStr, { ...currentDay, ...updates });
      });
      return newDraft;
    });
  };

  const handleClearSelection = () => {
    setSelectedDates(new Set());
  };

  const handleCancel = () => {
    const initialMap = new Map(itineraryDays.map(day => [day.date, day]));
    setDraftItinerary(initialMap);
    setSelectedDates(new Set());
    setIsEditing(false);
    setShowMessage(false);
  };
  
  const handleSave = () => {
    const itineraryDaysArray = Array.from(draftItinerary.values())
      .filter(day => day && day.date)
      .map(day => ({
        ...day,
        trip_id: trip.id,
      }));

    const formData = new FormData();
    formData.append('tripId', trip.id);
    formData.append('itineraryDays', JSON.stringify(itineraryDaysArray));

    startTransition(() => {
      formAction(formData);
      setSelectedDates(new Set());
      setIsEditing(false);
    });
  };

  if (!trip.start_date || !trip.end_date) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Trip Dates</h3>
            <p className="text-gray-500">Please set a start and end date for this trip to view the itinerary.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tripDates = getDatesInRange(new Date(trip.start_date), new Date(trip.end_date));
  const plannedDays = Array.from(draftItinerary.values()).filter(day => day.location_1_id || day.notes).length;
  const completionPercentage = Math.round((plannedDays / tripDates.length) * 100);

  return (
    <div className="space-y-6">
      {/* Simplified Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-xl">Trip Itinerary</CardTitle>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{tripDates.length} days</span>
                <span>•</span>
                <span>{plannedDays} planned</span>
                <span>•</span>
                <span>{completionPercentage}% complete</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Edit Actions */}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isPending}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Plan
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit trip itinerary</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Status Message */}
      {state.message && showMessage && (
        <div className={`rounded-lg p-4 transition-all duration-300 ${
          state.message.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.message.includes('successfully') ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span className="font-medium">{state.message}</span>
            </div>
            <button
              onClick={() => setShowMessage(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="itinerary" className="mt-6">
          {/* Calendar First - Immediate Access */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Calendar View</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">View:</span>
                <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('calendar')}
                          className={`h-8 px-3 rounded-md transition-all duration-200 ${
                            viewMode === 'calendar' 
                              ? 'shadow-sm bg-white border border-gray-200' 
                              : 'hover:bg-white/80'
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Calendar view</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'grid' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('grid')}
                          className={`h-8 px-3 rounded-md transition-all duration-200 ${
                            viewMode === 'grid' 
                              ? 'shadow-sm bg-white border border-gray-200' 
                              : 'hover:bg-white/80'
                          }`}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Grid view</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className={`h-8 px-3 rounded-md transition-all duration-200 ${
                            viewMode === 'list' 
                              ? 'shadow-sm bg-white border border-gray-200' 
                              : 'hover:bg-white/80'
                          }`}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Timeline view</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Instructions - Only when editing */}
          {isEditing && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Edit Mode Active</h4>
                  <p className="text-sm text-blue-700">
                    Click day cards to select them for bulk editing, or edit individual days directly. 
                    Use the bulk actions panel below for multiple days.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-medium">
                    {selectedDates.size} selected
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Content */}
          {viewMode === 'calendar' ? (
            <PremiumCalendarView
              tripDates={tripDates}
              draftItinerary={draftItinerary}
              locations={locations}
              isEditing={isEditing}
              selectedDates={selectedDates}
              onSelectDate={handleSelectDate}
              onUpdateDraft={handleUpdateDraft}
            />
          ) : viewMode === 'list' ? (
            <PremiumListView
              tripDates={tripDates}
              draftItinerary={draftItinerary}
              locations={locations}
              isEditing={isEditing}
              selectedDates={selectedDates}
              onSelectDate={handleSelectDate}
              onUpdateDraft={handleUpdateDraft}
            />
          ) : (
            /* Grid View - Clean cards in a grid */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tripDates.map((date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayData = draftItinerary.get(dateStr);
                  return (
                    <PremiumDayCard
                      key={dateStr}
                      date={date}
                      dayData={dayData}
                      locations={locations}
                      isEditing={isEditing}
                      isSelected={selectedDates.has(dateStr)}
                      selectionCount={selectedDates.size}
                      onSelectDate={() => handleSelectDate(dateStr)}
                      onUpdateDraft={handleUpdateDraft}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="locations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>Manage trip locations and destinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <MapPin className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Locations Management</p>
                <p className="text-sm">Location management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="participants" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>Manage trip participants and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-lg font-medium">Participants Management</p>
                <p className="text-sm">Participant management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Trip Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{completionPercentage}%</div>
                <p className="text-xs text-gray-500 mt-1">{plannedDays} of {tripDates.length} days planned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Locations Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {new Set(Array.from(draftItinerary.values()).map(day => day.location_1_id).filter(Boolean)).size}
                </div>
                <p className="text-xs text-gray-500 mt-1">unique locations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Transfer Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {Array.from(draftItinerary.values()).filter(day => day.location_2_id).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">days with transfers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Bulk Action Panel */}
      {isEditing && selectedDates.size > 1 && (
        <BulkActionPanel
          selectedCount={selectedDates.size}
          locations={locations}
          onBulkUpdate={handleBulkUpdate}
          onClearSelection={handleClearSelection}
        />
      )}

      {/* Floating Quick Actions */}
      {isEditing && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col gap-4">
            {/* Quick Save Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSave}
                    disabled={isPending}
                    className="group relative h-14 w-14 rounded-full shadow-2xl hover:shadow-3xl 
                             transition-all duration-300 hover:scale-110 bg-gradient-to-r from-blue-600 to-blue-700
                             hover:from-blue-700 hover:to-blue-800 border-0"
                    size="icon"
                  >
                    {isPending ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    ) : (
                      <>
                        <Save className="h-6 w-6 text-white transition-transform duration-200 group-hover:scale-110" />
                        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-gray-900 text-white border-0">
                  <p className="font-medium">Save Changes</p>
                  <p className="text-xs text-gray-300 mt-1">Ctrl+S</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Quick Cancel Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="group relative h-14 w-14 rounded-full shadow-xl hover:shadow-2xl 
                             transition-all duration-300 hover:scale-110 bg-white/90 backdrop-blur-sm
                             hover:bg-white border-gray-200 hover:border-gray-300"
                    size="icon"
                  >
                    <RotateCcw className="h-6 w-6 text-gray-600 transition-transform duration-200 group-hover:scale-110 group-hover:text-gray-800" />
                    <div className="absolute inset-0 rounded-full bg-gray-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-gray-900 text-white border-0">
                  <p className="font-medium">Cancel Changes</p>
                  <p className="text-xs text-gray-300 mt-1">Discard all edits</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Selection Counter */}
            {selectedDates.size > 0 && (
              <div className="flex items-center justify-center">
                <div className="bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-full shadow-lg">
                  {selectedDates.size} selected
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
