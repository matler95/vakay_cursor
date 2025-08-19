'use client';

import { Database } from '@/types/database.types';
import { ItineraryView } from './ItineraryView';
import { LocationManager } from './LocationManager';
import { ParticipantManager, type Participant } from './ParticipantManager';
import { EditTripInline } from './EditTripInline';
import { Calendar, MapPin, MapPinPlus, UserRoundPlus, Bed, Plane, Link as LinkIcon, DollarSign, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AddLocationModal } from './AddLocationModal';
import { AddParticipantModal } from './AddParticipantModal';
import { AccommodationView } from '../accommodation/_components/AccommodationView';
import { TransportationView } from '../transportation/_components/TransportationView';
import { UsefulLinksView } from '../links/_components/UsefulLinksView';
import { ExpenseView } from '../expense/_components/ExpenseView';
import { FloatingBottomNav } from './FloatingBottomNav';
import { deleteExpense, addExpense, updateExpense, updateExpenseStatus, updateTripMainCurrency } from '../expense/actions';
import { 
  StandardPageLayout, 
  PageHeader, 
  ContentSection 
} from '@/components/ui';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Trip = Database['public']['Tables']['trips']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Accommodation = Database['public']['Tables']['accommodations']['Row'];
type Transportation = Database['public']['Tables']['transportation']['Row'];
type UsefulLink = Database['public']['Tables']['useful_links']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'] & {
  expense_categories: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
};
type ExpenseCategory = Database['public']['Tables']['expense_categories']['Row'];

interface TripPageClientProps {
  trip: Trip;
  itineraryDays: ItineraryDay[];
  locations: Location[];
  participants: Participant[];
  participantRole: { role: string } | null;
  accommodations: Accommodation[];
  transportation: Transportation[];
  usefulLinks: UsefulLink[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  accommodationExpenseStatus: Record<string, boolean>;
  transportationExpenseStatus: Record<string, boolean>;
  currentUserId: string;
}

type TabType = 'plan' | 'accommodation' | 'transportation' | 'links' | 'expenses';

export function TripPageClient({
  trip,
  itineraryDays,
  locations,
  participants,
  participantRole,
  accommodations,
  transportation,
  usefulLinks,
  expenses,
  expenseCategories,
  accommodationExpenseStatus,
  transportationExpenseStatus,
  currentUserId,
}: TripPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  
  // State for data that can be refreshed
  const [currentAccommodations, setCurrentAccommodations] = useState(accommodations);
  const [currentTransportation, setCurrentTransportation] = useState(transportation);
  const [currentUsefulLinks, setCurrentUsefulLinks] = useState(usefulLinks);
  const [currentExpenses, setCurrentExpenses] = useState(expenses);
  const [currentLocations, setCurrentLocations] = useState(locations);
  const [currentItineraryDays, setCurrentItineraryDays] = useState(itineraryDays);

  // Debug logging for locations state changes
  useEffect(() => {
    console.log('currentLocations state changed to:', currentLocations);
  }, [currentLocations]);

  // Refresh functions for different data types
  const refreshAccommodations = async () => {
    const supabase = createClientComponentClient<Database>();
    const { data } = await supabase
      .from('accommodations')
      .select('*')
      .eq('trip_id', trip.id)
      .order('check_in_date', { ascending: true });
    if (data) setCurrentAccommodations(data);
  };

  const refreshTransportation = async () => {
    const supabase = createClientComponentClient<Database>();
    const { data } = await supabase
      .from('transportation')
      .select('*')
      .eq('trip_id', trip.id)
      .order('departure_date', { ascending: true });
    if (data) setCurrentTransportation(data);
  };

  const refreshUsefulLinks = async () => {
    const supabase = createClientComponentClient<Database>();
    const { data } = await supabase
      .from('useful_links')
      .select('*')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: false });
    if (data) setCurrentUsefulLinks(data);
  };

  const refreshExpenses = async () => {
    const supabase = createClientComponentClient<Database>();
    const { data } = await supabase
      .from('expenses')
      .select(`
        *,
        expense_categories (
          id,
          name,
          icon,
          color
        )
      `)
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: false });
    if (data) setCurrentExpenses(data);
  };

  const refreshLocations = async () => {
    console.log('Refreshing locations...');
    const supabase = createClientComponentClient<Database>();
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('trip_id', trip.id)
      .order('name');
    console.log('Fetched locations:', data);
    if (data) {
      setCurrentLocations(data);
      console.log('Updated currentLocations state:', data);
    }
  };

  const refreshItineraryDays = async () => {
    const supabase = createClientComponentClient<Database>();
    const { data } = await supabase
      .from('itinerary_days')
      .select('*')
      .eq('trip_id', trip.id);
    if (data) setCurrentItineraryDays(data);
  };

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent, tabId: TabType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (activeTab !== tabId) {
        setActiveTab(tabId);
      }
    }
  };

  const startDate = trip?.start_date ? new Date(trip.start_date) : null;
  const endDate = trip?.end_date ? new Date(trip.end_date) : null;
  const totalDays = startDate && endDate
    ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;
  const dateRange = startDate && endDate
    ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '';

  const tabs = [
    { id: 'plan', name: 'Plan', icon: Calendar },
    { id: 'accommodation', name: 'Sleep', icon: Bed },
    { id: 'transportation', name: 'Travel', icon: Plane },
    { id: 'links', name: 'Links', icon: LinkIcon },
    { id: 'expenses', name: 'Budget', icon: DollarSign },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'plan':
        return (
          <>
            {/* Calendar Container */}
            <div >
              <ItineraryView
                trip={trip}
                itineraryDays={currentItineraryDays || []}
                locations={currentLocations || []}
                transportation={currentTransportation || []}
                accommodations={currentAccommodations || []}
                participants={participants || []}
                participantRole={participantRole?.role || null}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onDataRefresh={async () => {
                  console.log('ItineraryView onDataRefresh called');
                  await Promise.all([
                    refreshLocations(),
                    refreshTransportation(),
                    refreshAccommodations(),
                    refreshItineraryDays()
                  ]);
                  console.log('ItineraryView onDataRefresh completed');
                }}
              />
            </div>
          </>
        );

      case 'accommodation':
        return (
          <AccommodationView
            trip={trip}
            accommodations={currentAccommodations || []}
            expenseStatus={accommodationExpenseStatus || {}}
            userRole={participantRole?.role || null}
            currentUserId={currentUserId}
            onDataRefresh={refreshAccommodations}
          />
        );

      case 'transportation':
        return (
          <TransportationView
            trip={trip}
            transportation={currentTransportation || []}
            expenseStatus={transportationExpenseStatus || {}}
            userRole={participantRole?.role || null}
            currentUserId={currentUserId}
            onDataRefresh={refreshTransportation}
          />
        );

      case 'links':
        return (
          <UsefulLinksView
            trip={trip}
            usefulLinks={currentUsefulLinks || []}
            userRole={participantRole?.role || null}
            currentUserId={currentUserId}
            onDataRefresh={refreshUsefulLinks}
          />
        );

      case 'expenses':
        // Convert participants to the format expected by ExpenseView
        const tripParticipants = participants.map(p => ({
          user_id: p.profiles.id,
          role: p.role || 'traveler',
          profiles: p.profiles
        }));

        return (
          <ExpenseView
            trip={trip}
            expenses={currentExpenses || []}
            categories={expenseCategories || []}
            tripParticipants={tripParticipants}
            userRole={participantRole?.role || null}
            currentUserId={currentUserId}
            addExpenseAction={addExpense}
            updateExpenseStatusAction={updateExpenseStatus}
            updateExpenseAction={updateExpense}
            deleteExpenseAction={deleteExpense}
            updateTripMainCurrencyAction={updateTripMainCurrency}
            onDataRefresh={refreshExpenses}
          />
        );

      default:
        return null;
    }
  };

  return (
    <StandardPageLayout maxWidth="full" background="gray" padding="none">
      {/* Custom Trip Header - Preserving existing functionality */}
      <div className="mt-2 mb-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-3 sm:mb-6 rounded-xl sm:rounded-2xl shadow p-3 sm:p-6 bg-white">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div 
                className="cursor-pointer"
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className={`font-bold text-gray-900 transition-all duration-300 ${
                      isHeaderCollapsed ? 'text-lg' : 'text-xl'
                    }`}>
                      {trip.name}
                    </h1>
                    {!isHeaderCollapsed && (
                      <div className="mt-2 space-y-2">
                        {/* Dates on their own line */}
                        <div className="flex items-center gap-1 text-gray-600 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          {dateRange}
                        </div>
                        {/* Location and duration inline */}
                        <div className="flex flex-row items-center gap-3 text-gray-600 text-sm">
                          {trip.destination && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-pink-500" />
                              {trip.destination}
                            </span>
                          )}
                          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold px-2 py-1 rounded-full text-xs">
                            {totalDays} days
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!isHeaderCollapsed && (
                      <EditTripInline trip={trip} userRole={participantRole?.role || null} />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsHeaderCollapsed(!isHeaderCollapsed);
                      }}
                      className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                      aria-label={isHeaderCollapsed ? 'Expand header' : 'Collapse header'}
                    >
                      {isHeaderCollapsed ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex md:items-center md:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className={`font-extrabold text-gray-900 transition-all duration-300 ${
                    isHeaderCollapsed ? 'text-2xl' : 'text-3xl lg:text-4xl'
                  }`}>
                    {trip.name}
                  </h1>
                  <button
                    onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    aria-label={isHeaderCollapsed ? 'Expand header' : 'Collapse header'}
                  >
                    {isHeaderCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
                {!isHeaderCollapsed && (
                  <div className="flex flex-row items-center gap-4 text-gray-600 text-base mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      {dateRange}
                    </span>
                    {trip.destination && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-5 w-5 text-pink-500" />
                        {trip.destination}
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full text-sm">
                      {totalDays} days
                    </span>
                  </div>
                )}
              </div>
              {!isHeaderCollapsed && (
                <div className="flex-shrink-0">
                  <EditTripInline trip={trip} userRole={participantRole?.role || null} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ContentSection padding="none" shadow="none" border={false}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-20 md:pb-6">
          {/* Trip Navigation - Desktop Only */}
          <div className="border-b border-gray-200 mb-3 sm:mb-4 md:mb-6 relative">
            {/* Desktop: Full width tabs */}
            <nav className="hidden md:flex space-x-8" role="tablist" aria-label="Trip sections">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => {
                      if (activeTab !== tab.id) {
                        setActiveTab(tab.id as TabType);
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, tab.id as TabType)}
                    aria-selected={isActive}
                    aria-label={`${tab.name} tab`}
                    role="tab"
                    tabIndex={0}
                    className={`
                      flex items-center gap-2 py-3 px-3 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer rounded-t-lg relative
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isActive
                        ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                      }
                      transform hover:scale-105 active:scale-95
                    `}
                  >
                    <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                    <span>{tab.name}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                    {/* Subtle ripple effect */}
                    <div className="absolute inset-0 rounded-t-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content with Smooth Transitions */}
          <div 
            key={activeTab}
            className="transition-all duration-300 ease-in-out relative min-h-[400px] mb-4 md:mb-0"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            id={`panel-${activeTab}`}
          >
            <div className="animate-in fade-in-0 duration-200">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </ContentSection>

      {/* Floating Bottom Navigation for Mobile */}
      <FloatingBottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isEditing={isEditing}
      />

      {/* Modals */}
      {isAddParticipantModalOpen && (
        <div className="animate-in fade-in-0 duration-200">
          <AddParticipantModal
            tripId={trip.id}
            isOpen={isAddParticipantModalOpen}
            onClose={() => setIsAddParticipantModalOpen(false)}
            onParticipantAdded={async () => {
              setIsAddParticipantModalOpen(false);
              // Refresh itinerary days in case assignments changed; participants list is static for now
              await refreshItineraryDays();
            }}
          />
        </div>
      )}
    </StandardPageLayout>
  );
}


