'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  ArrowLeft,
  Download,
  Share2,
  Check,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StandardCard, SectionHeader } from '@/components/ui/design-system';
import { formatCurrency } from '@/lib/currency';
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

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

interface ExpenseAnalyticsProps {
  expenses: Expense[];
  tripParticipants: TripParticipant[];
  mainCurrency: string;
  tripStartDate?: string | null;
  tripEndDate?: string | null;
}

const CATEGORY_COLORS = {
  'Food & Dining': '#F97316',
  'Accommodation': '#8B5CF6',
  'Transportation': '#3B82F6',
  'Activities & Entertainment': '#EC4899',
  'Shopping': '#14B8A6',
  'Emergency/Medical': '#EF4444',
  'Miscellaneous': '#6B7280'
};

export function ExpenseAnalytics({ 
  expenses, 
  tripParticipants, 
  mainCurrency,
  tripStartDate,
  tripEndDate
}: ExpenseAnalyticsProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [participantFilter, setParticipantFilter] = useState<'total' | 'me' | string>('total');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleBackToExpenses = () => {
    // Extract tripId from current URL
    const pathParts = window.location.pathname.split('/');
    const tripIdIndex = pathParts.findIndex(part => part === 'trip') + 1;
    const tripId = pathParts[tripIdIndex];
    router.push(`/trip/${tripId}`);
  };

  // Get unique categories from expenses
  const availableCategories = useMemo(() => {
    return Array.from(new Set(expenses?.map(e => e.expense_categories?.name).filter(Boolean) || [])).filter((category): category is string => category !== undefined);
  }, [expenses]);

  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    if (category === 'all') {
      setCategoryFilter([]);
    } else {
      setCategoryFilter(prev => 
        prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate analytics data
  const filteredExpenses = useMemo(() => {
    const safeExpenses = expenses || [];
    
    // Apply participant and category filters only (not status filter)
    let filtered = safeExpenses;
    
    // 1. Apply participant filter first
    if (participantFilter === 'me') {
      const currentUserId = safeExpenses[0]?.user_id || '';
      filtered = filtered.filter(expense => expense.user_id === currentUserId);
    } else if (participantFilter !== 'total') {
      filtered = filtered.filter(expense => expense.user_id === participantFilter);
    }
    
    // 2. Apply category filter
    if (categoryFilter.length > 0) {
      filtered = filtered.filter(expense => 
        expense.expense_categories?.name && categoryFilter.includes(expense.expense_categories.name)
      );
    }
    
    return filtered;
  }, [expenses, participantFilter, categoryFilter]);

  // Apply status filter separately for status-specific calculations
  const statusFilteredExpenses = useMemo(() => {
    if (statusFilter === 'all') {
      return filteredExpenses;
    }
    return filteredExpenses.filter(expense => expense.payment_status === statusFilter);
  }, [filteredExpenses, statusFilter]);

  // Memoize trip duration calculation separately (only depends on trip dates)
  const tripDurationInfo = useMemo(() => {
    const msPerDay = 1000 * 60 * 60 * 24;
    let start = tripStartDate ? new Date(tripStartDate) : null;
    let end = tripEndDate ? new Date(tripEndDate) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    // Fallback to expense dates if trip dates are invalid
    if (!start || !end || end.getTime() < start.getTime()) {
      const expenseDates = expenses?.map(e => new Date(e.created_at || '')).filter(d => !isNaN(d.getTime())) || [];
      if (expenseDates.length > 0) {
        expenseDates.sort((a, b) => a.getTime() - b.getTime());
        start = expenseDates[0];
        end = expenseDates[expenseDates.length - 1];
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(0, 0, 0, 0);
      }
    }

    const tripDuration = start && end ? Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1 : 0;
    
    return { tripDuration, start, end, msPerDay };
  }, [tripStartDate, tripEndDate, expenses]);

  // Memoize analytics calculations (only depends on filtered expenses and trip duration)
  const analyticsData = useMemo(() => {
    const safeTripParticipants = tripParticipants || [];
    const currentUserId = expenses?.[0]?.user_id || '';
    
    // Total expenses (always paid + pending, regardless of status filter)
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    // Paid vs pending (from filtered expenses, not status-filtered)
    const paidExpenses = filteredExpenses
      .filter(expense => expense.payment_status === 'paid')
      .reduce((sum, expense) => sum + Number(expense.amount), 0);
    
    const pendingExpenses = filteredExpenses
      .filter(expense => expense.payment_status === 'pending')
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    const averagePerDay = tripDurationInfo.tripDuration > 0 ? totalExpenses / tripDurationInfo.tripDuration : 0;

    // Most expensive expense (from status-filtered expenses if status filter is applied)
    const mostExpensiveExpense = statusFilteredExpenses.reduce((max, expense) => 
      Number(expense.amount) > Number(max.amount) ? expense : max, 
      statusFilteredExpenses[0] || { amount: 0 }
    );

    // Category breakdown (from status-filtered expenses if status filter is applied)
    const categoryData = statusFilteredExpenses.reduce((acc, expense) => {
      const categoryName = expense.expense_categories?.name || 'Miscellaneous';
      if (!acc[categoryName]) {
        acc[categoryName] = { amount: 0, count: 0, expenses: [] };
      }
      acc[categoryName].amount += Number(expense.amount);
      acc[categoryName].count += 1;
      acc[categoryName].expenses.push(expense);
      return acc;
    }, {} as Record<string, { amount: number; count: number; expenses: Expense[] }>);

    // Convert to array and sort by amount
    const categoryBreakdown = Object.entries(categoryData)
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / totalExpenses) * 100,
        color: CATEGORY_COLORS[name as keyof typeof CATEGORY_COLORS] || '#6B7280',
        biggestExpense: Math.max(...data.expenses.map(e => Number(e.amount)))
      }))
      .sort((a, b) => b.amount - a.amount);

    // Participant analytics with average per day
    const participantAnalytics = safeTripParticipants.map(participant => {
      const userExpenses = expenses?.filter(expense => expense.user_id === participant.user_id) || [];
      const totalAmount = userExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
      const expenseCount = userExpenses.length;
      const averageAmount = expenseCount > 0 ? totalAmount / expenseCount : 0;
      const averagePerDay = tripDurationInfo.tripDuration > 0 ? totalAmount / tripDurationInfo.tripDuration : 0;
      
      // Most active category for this participant
      const userCategoryData = userExpenses.reduce((acc, expense) => {
        const categoryName = expense.expense_categories?.name || 'Miscellaneous';
        acc[categoryName] = (acc[categoryName] || 0) + Number(expense.amount);
        return acc;
      }, {} as Record<string, number>);
      
      const topCategory = Object.entries(userCategoryData)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      return {
        participant,
        totalAmount,
        expenseCount,
        averageAmount,
        averagePerDay,
        topCategory
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);

    // Expenses over trip duration (bucket by trip day index)
    const tripDurationData = Array.from({ length: Math.max(tripDurationInfo.tripDuration, 0) }, (_, index) => {
      if (!tripDurationInfo.start) return { day: index + 1, amount: 0, count: 0 };
      
      const dayStart = new Date(tripDurationInfo.start.getTime() + index * tripDurationInfo.msPerDay);
      const dayEnd = new Date(dayStart.getTime() + tripDurationInfo.msPerDay);
      const dayExpenses = statusFilteredExpenses.filter((expense) => {
        const d = new Date(expense.created_at || '');
        if (isNaN(d.getTime())) return false;
        return d >= dayStart && d < dayEnd;
      });
      return {
        day: index + 1,
        amount: dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
        count: dayExpenses.length,
      };
    });

    return {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      tripDuration: tripDurationInfo.tripDuration,
      averagePerDay,
      mostExpensiveExpense,
      categoryBreakdown,
      participantAnalytics,
      tripDurationData,
      totalExpenseCount: statusFilteredExpenses.length,
      currentUserId
    };
  }, [filteredExpenses, statusFilteredExpenses, tripParticipants, tripDurationInfo, expenses]);



  return (
    <div className="space-y-6">
      {/* Header with back button - Sticky */}
      <div className="sticky top-16 z-30 bg-gray-50 -mx-4 px-4 py-3 border-b border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBackToExpenses}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Expense Analytics
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Detailed insights into your trip spending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Filters - Non-sticky */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
        <div className="flex gap-2">
          <Button
            variant={participantFilter === 'total' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setParticipantFilter('total')}
            className="flex-1 sm:flex-none"
          >
            All Participants
          </Button>
          <Button
            variant={participantFilter === 'me' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setParticipantFilter('me')}
            className="flex-1 sm:flex-none"
          >
            Me Only
          </Button>
                    {/* Add a filter for specific participants if needed */}
          {tripParticipants.length > 2 && (
            <select
              value={participantFilter === 'total' || participantFilter === 'me' ? '' : participantFilter}
              onChange={(e) => setParticipantFilter(e.target.value || 'total')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">Select Participant</option>
              {tripParticipants.map((participant) => (
                <option key={participant.user_id} value={participant.user_id}>
                  {participant.profiles?.full_name || 'Unknown User'}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="flex-1 sm:flex-none"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('paid')}
            className="flex-1 sm:flex-none"
          >
            Paid
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className="flex-1 sm:flex-none"
          >
            Pending
          </Button>
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 min-w-[180px] justify-between"
            >
              <span>
                {categoryFilter.length === 0 
                  ? 'All Categories' 
                  : `${categoryFilter.length} categor${categoryFilter.length !== 1 ? 'ies' : 'y'} selected`
                }
              </span>
              <svg
                className={`h-4 w-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto" ref={dropdownRef}>
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-700 mb-2 px-2">Select Categories</div>
                  
                  {/* All Categories Option */}
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryFilter.length === 0}
                      onChange={() => handleCategoryToggle('all')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">All Categories</span>
                  </div>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  {/* Individual Categories */}
                  {availableCategories.map((category) => (
                    <div 
                      key={category} 
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={categoryFilter.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Reset Filters Button */}
          {(participantFilter !== 'total' || statusFilter !== 'all' || categoryFilter.length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setParticipantFilter('total');
                setStatusFilter('all');
                setCategoryFilter([]);
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Overview Dashboard - Key Metrics */}
      <div className={`grid gap-1 sm:gap-4 ${
        statusFilter === 'all' 
          ? 'grid-cols-2 lg:grid-cols-4' 
          : 'grid-cols-2 lg:grid-cols-3'
      }`}>
        <StandardCard className="text-center">
        <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <h3 className="text-xs  sm:text-xl font-medium text-gray-600">Total</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.totalExpenses, mainCurrency)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {analyticsData.totalExpenseCount} expenses
            </p>
          </div>
        </StandardCard>
        
        <StandardCard className="text-center">
        <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-4 w-4 text-purple-600" />
            <h3 className="text-xs sm:text-xl font-medium text-gray-600">Average/Day</h3>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {formatCurrency(analyticsData.averagePerDay, mainCurrency)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {analyticsData.tripDuration} days
            </p>
          </div>
        </StandardCard>

        {statusFilter !== 'pending' && (
          <StandardCard className="text-center">
            <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <h3 className="text-xs sm:text-xl font-medium text-gray-600">Paid</h3>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-700">
                {formatCurrency(analyticsData.paidExpenses, mainCurrency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsData.totalExpenses > 0 
                  ? Math.round((analyticsData.paidExpenses / analyticsData.totalExpenses) * 100)
                  : 0}% of total
              </p>
            </div>
          </StandardCard>
        )}

        {statusFilter !== 'paid' && (
          <StandardCard className="text-center">
          <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <h3 className="text-xs sm:text-xl font-medium text-gray-600">Pending</h3>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-700">
                {formatCurrency(analyticsData.pendingExpenses, mainCurrency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analyticsData.totalExpenses > 0 
                  ? Math.round((analyticsData.pendingExpenses / analyticsData.totalExpenses) * 100)
                  : 0}% of total
              </p>
            </div>
          </StandardCard>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Category Breakdown */}
        <StandardCard>
          <SectionHeader title="Category Breakdown" description="Spending by category">
            <PieChart className="h-5 w-5 text-green-600" />
          </SectionHeader>
          
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={analyticsData.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="amount"
                >
                  {analyticsData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value, mainCurrency), 'Amount']}
                  labelFormatter={(label) => `${label} (${analyticsData.categoryBreakdown.find(c => c.name === label)?.percentage.toFixed(1)}%)`}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category Legend */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analyticsData.categoryBreakdown.slice(0, 6).map((category) => (
              <div key={category.name} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-gray-700 truncate">{category.name}</span>
                <span className="text-gray-500 ml-auto text-xs sm:text-sm">
                  {formatCurrency(category.amount, mainCurrency)}
                </span>
              </div>
            ))}
          </div>
        </StandardCard>

        <StandardCard>
        <SectionHeader title="Category Details" description="Detailed breakdown of each category">
          <BarChart3 className="h-5 w-5 text-purple-600" />
        </SectionHeader>
        
        <div className="space-y-4">
          {analyticsData.categoryBreakdown.map((category) => (
            <div key={category.name} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(category.amount, mainCurrency)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {category.percentage.toFixed(1)}% of total
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>{category.count} expenses</span>
                <span>Avg: {formatCurrency(category.amount / category.count, mainCurrency)}</span>
                <span>Max: {formatCurrency(category.biggestExpense, mainCurrency)}</span>
              </div>
            </div>
          ))}
        </div>
      </StandardCard>


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

      {/* Participant Analytics */}
      <StandardCard>
        <SectionHeader title="Participant Analytics" description="Spending patterns by participant">
          <Users className="h-5 w-5 text-indigo-600" />
        </SectionHeader>
        
        <div className="space-y-3">
          {analyticsData.participantAnalytics.map((participant) => (
            <div key={participant.participant.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {(participant.participant.profiles?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {participant.participant.profiles?.full_name || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.expenseCount} expense{participant.expenseCount !== 1 ? 's' : ''}
                    {participant.participant.role === 'admin' && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Admin
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-gray-900 text-sm">
                  {formatCurrency(participant.totalAmount, mainCurrency)}
                </p>
                <p className="text-xs text-gray-500">
                  Avg/Day: {formatCurrency(participant.averagePerDay, mainCurrency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </StandardCard>

      {/* Insights Panel */}
      <StandardCard>
        <SectionHeader title="Smart Insights" description="Key observations about your spending">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </SectionHeader>
        
        <div className="space-y-3">
          {analyticsData.totalExpenses > 0 && (
            <>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-blue-800">
                  <strong>Top Category:</strong> {analyticsData.categoryBreakdown[0]?.name} accounts for{' '}
                  {analyticsData.categoryBreakdown[0]?.percentage.toFixed(1)}% of your total spending.
                </p>
              </div>
              
              {analyticsData.pendingExpenses > 0 && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-orange-800">
                    <strong>Pending Payments:</strong> You have {formatCurrency(analyticsData.pendingExpenses, mainCurrency)} 
                    in pending expenses that need to be marked as paid.
                  </p>
                </div>
              )}
              
              {analyticsData.participantAnalytics[0] && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-purple-800">
                    <strong>Most Active Logger:</strong> {analyticsData.participantAnalytics[0].participant.profiles?.full_name} 
                    has logged {analyticsData.participantAnalytics[0].expenseCount} expenses totaling{' '}
                    {formatCurrency(analyticsData.participantAnalytics[0].totalAmount, mainCurrency)}.
                  </p>
                </div>
              )}
            </>
          )}
          
          {analyticsData.totalExpenses === 0 && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No expenses recorded yet. Start adding expenses to see analytics!</p>
            </div>
          )}
        </div>
      </StandardCard>
    </div>
    </div>
  );
}
