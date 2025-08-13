'use client';

import { Database } from '@/types/database.types';
import { ItineraryView } from './ItineraryView';
import { LocationManager } from './LocationManager';
import { ParticipantManager, type Participant } from './ParticipantManager';
import { EditTripInline } from './EditTripInline';
import { Calendar, MapPin, MapPinPlus, UserRoundPlus, Bed, Plane, Link as LinkIcon, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { AddLocationModal } from './AddLocationModal';
import { AddParticipantModal } from './AddParticipantModal';
import { AccommodationView } from '../accommodation/_components/AccommodationView';
import { TransportationView } from '../transportation/_components/TransportationView';
import { UsefulLinksView } from '../links/_components/UsefulLinksView';
import { ExpenseView } from '../expense/_components/ExpenseView';

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
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    { id: 'accommodation', name: 'Accommodation', icon: Bed },
    { id: 'transportation', name: 'Travel', icon: Plane },
    { id: 'links', name: 'Useful Links', icon: LinkIcon },
    { id: 'expenses', name: 'Expenses', icon: DollarSign },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'plan':
        return (
          <>
                         {/* Secondary Header - Trip Plan */}
             <div className="flex justify-between items-center gap-4 mb-6">
               <div>
                 <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Trip Plan</h2>
                 {isEditing ? (
                   <div className="text-gray-600 mt-1">
                     <strong>Edit Mode:</strong> Edit days individually or select multiple to update locations
                   </div>
                 ) : (
                   <p className="text-gray-600 mt-1">
                     Add locations and participants to start planning your trip
                   </p>
                 )}
               </div>

               <div className="flex gap-3">
                {/* Add Location Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => setIsAddLocationModalOpen(true)} variant="outline" size="sm" className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                        <MapPinPlus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add new locations</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Add Participant Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={() => setIsAddParticipantModalOpen(true)} variant="outline" size="sm" className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                        <UserRoundPlus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Invite participants</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

                         {/* Calendar Container */}
             <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl bg-white shadow p-3 sm:p-6">
               <ItineraryView
                 trip={trip}
                 itineraryDays={itineraryDays || []}
                 locations={locations || []}
                 isEditing={isEditing}
                 setIsEditing={setIsEditing}
               />
             </div>

                         {/* Locations & Participants Side-by-Side */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
               <div className="rounded-xl sm:rounded-2xl bg-white shadow p-4 sm:p-6 min-h-[250px] sm:min-h-[300px] flex flex-col">
                 <LocationManager tripId={trip.id} locations={locations || []} />
               </div>
               <div className="rounded-xl sm:rounded-2xl bg-white shadow p-4 sm:p-6 min-h-[250px] sm:min-h-[300px] flex flex-col">
                 <ParticipantManager tripId={trip.id} participants={participants || []} currentUserRole={participantRole?.role || null} />
               </div>
             </div>
          </>
        );

             case 'accommodation':
         return (
           <AccommodationView
             trip={trip}
             accommodations={accommodations || []}
             expenseStatus={accommodationExpenseStatus || {}}
             userRole={participantRole?.role || null}
             currentUserId={currentUserId}
           />
         );

             case 'transportation':
         return (
           <TransportationView
             trip={trip}
             transportation={transportation || []}
             expenseStatus={transportationExpenseStatus || {}}
             userRole={participantRole?.role || null}
             currentUserId={currentUserId}
           />
         );

             case 'links':
         return (
           <UsefulLinksView
             trip={trip}
             usefulLinks={usefulLinks || []}
             userRole={participantRole?.role || null}
             currentUserId={currentUserId}
           />
         );

             case 'expenses':
         return (
           <ExpenseView
             trip={trip}
             expenses={expenses || []}
             categories={expenseCategories || []}
             tripParticipants={participants || []}
             userRole={participantRole?.role || null}
             currentUserId={currentUserId}
             addExpenseAction={async () => ({ message: 'Not implemented' })}
             updateExpenseStatusAction={async () => ({ message: 'Not implemented' })}
             updateTripMainCurrencyAction={async () => ({ message: 'Not implemented' })}
             deleteExpenseAction={async () => ({ message: 'Not implemented' })}
             updateExpenseAction={async () => ({ message: 'Not implemented' })}
           />
         );

      default:
        return null;
    }
  };

  return (
         <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-4 sm:py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
             {/* Modern Trip Header */}
       <div className="mb-4 sm:mb-8 rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 bg-white">
         {/* Mobile Layout */}
         <div className="md:hidden">
           <div className="flex items-start justify-between gap-3 mb-3">
             <div className="flex-1 min-w-0">
               <h1 className="text-xl font-extrabold text-gray-900 truncate">
                 {trip.name}
               </h1>
             </div>
             <div className="flex-shrink-0">
               <EditTripInline trip={trip} userRole={participantRole?.role || null} />
             </div>
           </div>
           <div className="flex items-center gap-3 text-gray-600 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-blue-500" />
              {dateRange}
            </span>
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

                 {/* Desktop Layout */}
         <div className="hidden md:flex md:items-center md:justify-between gap-6">
           <div className="flex-1 min-w-0">
             <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
               {trip.name}
             </h1>
             <div className="flex flex-row items-center gap-4 text-gray-600 text-base">
               <span className="flex items-center gap-1">
                 <Calendar className="h-5 w-5 text-blue-500" />
                 {dateRange}
               </span>
               {trip.destination && (
                 <span className="flex items-center gap-1">
                   <MapPin className="h-5 w-5 text-pink-500" />
                 </span>
               )}
               <span className="flex items-center gap-1 bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full text-sm">
                 {totalDays} days
               </span>
             </div>
           </div>
           <div className="flex-shrink-0">
             <EditTripInline trip={trip} userRole={participantRole?.role || null} />
           </div>
         </div>
      </div>

             {/* Trip Navigation */}
       <div className="border-b border-gray-200 mb-6 relative">
        <nav className="-mb-px flex space-x-8" role="tablist" aria-label="Trip sections">
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
                <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {tab.name}
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
         className="transition-all duration-300 ease-in-out relative min-h-[400px]"
         role="tabpanel"
         aria-labelledby={`tab-${activeTab}`}
         id={`panel-${activeTab}`}
       >
         <div className="animate-in fade-in-0 duration-200">
           {renderTabContent()}
         </div>
       </div>

      {/* Modals */}
      {isAddLocationModalOpen && (
        <div className="animate-in fade-in-0 duration-200">
          <AddLocationModal
            tripId={trip.id}
            isOpen={isAddLocationModalOpen}
            onClose={() => setIsAddLocationModalOpen(false)}
            onLocationAdded={() => {
              setIsAddLocationModalOpen(false);
              window.location.reload();
            }}
          />
        </div>
      )}

      {isAddParticipantModalOpen && (
        <div className="animate-in fade-in-0 duration-200">
          <AddParticipantModal
            tripId={trip.id}
            isOpen={isAddParticipantModalOpen}
            onClose={() => setIsAddParticipantModalOpen(false)}
            onParticipantAdded={() => {
              setIsAddParticipantModalOpen(false);
              window.location.reload();
            }}
          />
        </div>
      )}
    </div>
  );
}


