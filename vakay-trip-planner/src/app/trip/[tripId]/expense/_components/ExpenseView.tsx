// Main expense tracking view
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpenseOverview } from './ExpenseOverview';
import { ExpensesList } from './ExpensesList';
import { AddExpenseModal } from './AddExpenseModal';
import { CurrencySettingsModal } from './CurrencySettingsModal';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  expense_categories: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
};

type Category = Database['public']['Tables']['expense_categories']['Row'];

type TripParticipant = {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
  };
};

type Trip = Database['public']['Tables']['trips']['Row'];

interface ExpenseViewProps {
  trip: Trip;
  expenses: Expense[];
  categories: Category[];
  tripParticipants: TripParticipant[];
  userRole: string | null;
  currentUserId: string;
  addExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
  updateExpenseStatusAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
  updateTripMainCurrencyAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
  deleteExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
  updateExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function ExpenseView({ 
  trip, 
  expenses, 
  categories, 
  tripParticipants, 
  userRole, 
  currentUserId, 
  addExpenseAction, 
  updateExpenseStatusAction, 
  updateTripMainCurrencyAction,
  deleteExpenseAction,
  updateExpenseAction
}: ExpenseViewProps) {
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isCurrencySettingsModalOpen, setIsCurrencySettingsModalOpen] = useState(false);

  const refreshData = () => {
    // This will be handled by Next.js revalidation from server actions
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Expense Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage trip expenses with multi-currency support
          </p>
        </div>
        <div className="flex gap-3">
          {userRole === 'admin' && (
            <Button
              onClick={() => setIsCurrencySettingsModalOpen(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Currency Settings</span>
            </Button>
          )}
          <Button
            onClick={() => setIsAddExpenseModalOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Expense Overview */}
      <ExpenseOverview 
        expenses={expenses}
        tripParticipants={tripParticipants}
        mainCurrency={trip.main_currency || 'USD'}
      />

      {/* Expenses List */}
      <ExpensesList
        expenses={expenses}
        categories={categories}
        tripParticipants={tripParticipants}
        tripId={trip.id}
        userRole={userRole}
        currentUserId={currentUserId}
        mainCurrency={trip.main_currency || 'USD'}
        onExpenseUpdated={refreshData}
        updateExpenseStatusAction={updateExpenseStatusAction}
        deleteExpenseAction={deleteExpenseAction}
        updateExpenseAction={updateExpenseAction}
      />

      {/* Modals */}
      {isAddExpenseModalOpen && (
        <AddExpenseModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => setIsAddExpenseModalOpen(false)}
          tripId={trip.id}
          categories={categories}
          tripParticipants={tripParticipants}
          mainCurrency={trip.main_currency || 'USD'}
          onExpenseAdded={refreshData}
          addExpenseAction={addExpenseAction}
        />
      )}

      {isCurrencySettingsModalOpen && userRole === 'admin' && (
        <CurrencySettingsModal
          isOpen={isCurrencySettingsModalOpen}
          onClose={() => setIsCurrencySettingsModalOpen(false)}
          trip={trip}
          onSettingsUpdated={refreshData}
          updateTripMainCurrencyAction={updateTripMainCurrencyAction}
        />
      )}
    </div>
  );
}
