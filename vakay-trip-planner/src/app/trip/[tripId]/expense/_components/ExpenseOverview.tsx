// Expense overview showing expenses per participant
'use client';

import { Database } from '@/types/database.types';
import { Users, DollarSign, CreditCard, Clock, Check, ChevronDown, ChevronRight, BarChart3, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  expense_categories: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
};

type TripParticipant = {
  user_id: string;
  role: string;
  profiles: {
    id: string;
    full_name: string | null;
  };
};

interface ExpenseOverviewProps {
  expenses: Expense[];
  tripParticipants: TripParticipant[];
  mainCurrency: string;
}

export function ExpenseOverview({ expenses, tripParticipants, mainCurrency }: ExpenseOverviewProps) {
  const router = useRouter();
  // Ensure props are always arrays/valid values
  const safeExpenses = expenses || [];
  const safeTripParticipants = tripParticipants || [];
  const safeMainCurrency = mainCurrency || 'USD';
  
  // Calculate total expenses
  const totalExpenses = safeExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  // Calculate paid vs pending
  const paidExpenses = safeExpenses
    .filter(expense => expense.payment_status === 'paid')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  
  const pendingExpenses = safeExpenses
    .filter(expense => expense.payment_status === 'pending')
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Calculate expenses per participant
  const participantExpenses = safeTripParticipants
    .filter(participant => {
      // Validate participant structure
      return participant && 
        participant.user_id && 
        participant.profiles && 
        typeof participant.user_id === 'string' &&
        participant.user_id.length > 0;
    })
    .map(participant => {
      const userExpenses = safeExpenses.filter(expense => expense.user_id === participant.user_id);
      const totalAmount = userExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const paidAmount = userExpenses
        .filter(expense => expense.payment_status === 'paid')
        .reduce((sum, expense) => sum + Number(expense.amount), 0);
      const pendingAmount = userExpenses
        .filter(expense => expense.payment_status === 'pending')
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return {
        participant,
        totalAmount,
        paidAmount,
        pendingAmount,
        expenseCount: userExpenses.length,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [isParticipantSectionExpanded, setIsParticipantSectionExpanded] = useState(false);

  const handleViewAnalytics = () => {
    // Extract tripId from current URL
    const pathParts = window.location.pathname.split('/');
    const tripIdIndex = pathParts.findIndex(part => part === 'trip') + 1;
    const tripId = pathParts[tripIdIndex];
    router.push(`/trip/${tripId}/expense/analytics`);
  };

  return (
<div className="space-y-4">
  {/* Summary Cards */}
  <div className="grid grid-cols-2 gap-4">
    {/* Total Expenses */}
    <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex flex-col justify-center items-center">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="h-4 w-4 text-blue-600" />
        <h3 className="text-xs sm:text-xl font-medium text-gray-600">Total</h3>
      </div>
      <p className="text-sm sm:text-2xl font-bold text-gray-900 leading-tight text-center">
        {formatCurrency(totalExpenses, safeMainCurrency)}
      </p>
    </div>

    {/* Analytics Button */}
    <Button
      onClick={handleViewAnalytics}
      variant="ghost"
      className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex-1 min-w-0 h-full flex justify-center items-center hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-blue-600" />
        <h3 className="text-xs sm:text-xl font-medium text-gray-600">Analytics</h3>
        <ArrowRight className="h-4 w-4 text-blue-600" />
      </div>
    </Button>
  </div>
</div>
  );
}
