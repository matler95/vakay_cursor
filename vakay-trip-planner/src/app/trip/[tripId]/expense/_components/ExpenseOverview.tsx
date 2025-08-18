// Expense overview showing expenses per participant
'use client';

import { Database } from '@/types/database.types';
import { Users, DollarSign, CreditCard, Clock, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

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

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="flex gap-1 overflow-x-auto">
        {/* Total Expenses */}
        <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-200 flex-1 min-w-0">
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
        <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-200 flex-1 min-w-0">
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
        <div className="bg-white rounded-lg shadow-sm p-2 border border-gray-200 flex-1 min-w-0">
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

      {/* Expenses per Participant */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-full">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Expenses per Participant</h3>
        </div>

        {participantExpenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No expenses recorded yet</p>
        ) : (
          <div className="space-y-4">
            {participantExpenses.map(({ participant, totalAmount, paidAmount, pendingAmount, expenseCount }, index) => {
              // Ensure we have a unique key
              const uniqueKey = participant.user_id || `participant-${index}`;
              
              return (
                <div key={uniqueKey} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {/* <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(participant.profiles.full_name || 'Unknown').charAt(0).toUpperCase()}
                  </div> */}
                  <div>
                    <p className="font-medium text-gray-900">
                      {participant.profiles?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {expenseCount} expense{expenseCount !== 1 ? 's' : ''}
                      {participant.role === 'admin' && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Admin
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(totalAmount, safeMainCurrency)}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-sm text-green-600">
                      Paid: {formatCurrency(paidAmount, safeMainCurrency)}
                    </span>
                    {pendingAmount > 0 && (
                      <span className="text-sm text-orange-600">
                        Pending: {formatCurrency(pendingAmount, safeMainCurrency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
