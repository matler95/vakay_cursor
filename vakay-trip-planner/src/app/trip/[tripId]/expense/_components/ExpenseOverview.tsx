// Expense overview showing expenses per participant
'use client';

import { Database } from '@/types/database.types';
import { Users, DollarSign, CreditCard, Clock, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { useState } from 'react';

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

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-1 overflow-x-auto">
        {/* Total Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs font-medium text-gray-600">Total</h3>
            </div>
            <p className="text-sm font-bold text-gray-900 leading-tight text-center">
              {formatCurrency(totalExpenses, safeMainCurrency)}
            </p>
          </div>
        </div>

        {/* Paid Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-4 w-4 text-green-600" />
              <h3 className="text-xs font-medium text-gray-600">Paid</h3>
            </div>
            <p className="text-sm font-bold text-green-700 leading-tight text-center">
              {formatCurrency(paidExpenses, safeMainCurrency)}
            </p>
          </div>
        </div>

        {/* Pending Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <h3 className="text-xs font-medium text-gray-600">Pending</h3>
            </div>
            <p className="text-sm font-bold text-orange-700 leading-tight text-center">
              {formatCurrency(pendingExpenses, safeMainCurrency)}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses per Participant - Expandable Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsParticipantSectionExpanded(!isParticipantSectionExpanded)}
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-900">Expenses per Participant</h2>
          </div>
          {isParticipantSectionExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </div>

        {isParticipantSectionExpanded && (
          <div className="px-4 pb-4">
            {participantExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No expenses recorded yet</p>
            ) : (
              <div className="space-y-3">
                {participantExpenses.map(({ participant, totalAmount, expenseCount }, index) => {
                  const uniqueKey = participant.user_id || `participant-${index}`;
                  
                  return (
                    <div key={uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {(participant.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {participant.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expenseCount} expense{expenseCount !== 1 ? 's' : ''}
                            {participant.role === 'admin' && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Admin
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatCurrency(totalAmount, safeMainCurrency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
