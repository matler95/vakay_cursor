// List of expenses with filtering, sorting and quick status toggle
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, MapPin, CreditCard, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
// Server actions will be passed as props
import { DeleteExpenseModal } from './DeleteExpenseModal';
import { EditExpenseModal } from './EditExpenseModal';

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

interface ExpensesListProps {
  expenses: Expense[];
  categories: Category[];
  tripParticipants: TripParticipant[];
  tripId: string;
  userRole: string | null;
  currentUserId: string;
  mainCurrency: string;
  onExpenseUpdated: () => void;
  updateExpenseStatusAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
  deleteExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
  updateExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function ExpensesList({ 
  expenses, 
  categories, 
  tripParticipants, 
  tripId, 
  userRole, 
  currentUserId, 
  mainCurrency,
  onExpenseUpdated,
  updateExpenseStatusAction,
  deleteExpenseAction,
  updateExpenseAction
}: ExpensesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'amount' | 'description'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  // Helper function to get participant name
  const getParticipantName = (userId: string) => {
    const participant = tripParticipants.find(p => p.user_id === userId);
    return participant?.profiles.full_name || 'Unknown User';
  };

  // Filter and sort expenses
  const filteredExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (expense.location && expense.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || 
                            expense.category_id?.toString() === categoryFilter;
      
      const matchesStatus = statusFilter === 'all' || 
                          expense.payment_status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'amount':
          comparison = Number(a.amount) - Number(b.amount);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'created_at':
        default:
          comparison = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleStatusToggle = async (expense: Expense) => {
    if (isUpdatingStatus === expense.id) return;
    
    setIsUpdatingStatus(expense.id);
    
    const newStatus = expense.payment_status === 'paid' ? 'pending' : 'paid';
    const formData = new FormData();
    formData.append('expense_id', expense.id.toString());
    formData.append('payment_status', newStatus);
    formData.append('trip_id', tripId);

    try {
      const result = await updateExpenseStatusAction(null, formData);
      if (result.message?.includes('success')) {
        onExpenseUpdated();
      }
    } catch (error) {
      console.error('Failed to update expense status:', error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const canEditExpense = (expense: Expense) => {
    return userRole === 'admin' || expense.user_id === currentUserId;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-full">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Expense History</h3>
      </div>

      {/* Filters, Search, Sorting */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 md:justify-between">
          {/* Search (constrained width on desktop) */}
          <div className="w-full ">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Right controls: Filters + Sorting */}
          <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-4 md:justify-end">
            {/* Filters group */}
            <div className="flex w-full items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <div className="flex flex-grow gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sorting group */}
            <div className="flex w-full items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'created_at' | 'amount' | 'description')}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    {/* <ArrowUpDown className="h-4 w-4 text-gray-500" /> */}
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                aria-pressed={sortOrder === 'desc'}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                className="flex items-center gap-2"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <ArrowUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden space-y-4">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No expenses found
          </div>
        ) : (
          filteredExpenses.map((expense) => (
            <div key={expense.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{expense.description}</h4>
                  <p className="text-sm text-gray-500">
                    By {getParticipantName(expense.user_id)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {formatCurrency(Number(expense.amount), mainCurrency)}
                  </p>
                  {expense.original_currency !== mainCurrency && (
                    <p className="text-xs text-gray-500">
                      {getCurrencySymbol(expense.original_currency || '')}{expense.original_amount}
                    </p>
                  )}
                </div>
              </div>

              {expense.expense_categories && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: expense.expense_categories.color }}
                  />
                  <span className="text-sm text-gray-600">{expense.expense_categories.name}</span>
                </div>
              )}

              {expense.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {expense.location}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Button
                  variant={expense.payment_status === 'paid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusToggle(expense)}
                  disabled={!canEditExpense(expense) || isUpdatingStatus === expense.id}
                  className={expense.payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'text-orange-600 border-orange-600 hover:bg-orange-50'}
                >
                  {isUpdatingStatus === expense.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : expense.payment_status === 'paid' ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-1" />
                      Paid
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </>
                  )}
                </Button>

                <div className="flex gap-2">
                  {canEditExpense(expense) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400"
                        onClick={() => setEditExpense(expense)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteExpense(expense)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Created By</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        {expense.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <MapPin className="h-3 w-3" />
                            {expense.location}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(expense.created_at)}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {expense.expense_categories ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: expense.expense_categories.color }}
                          />
                          <span className="text-sm">{expense.expense_categories.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No category</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">
                          {formatCurrency(Number(expense.amount), mainCurrency)}
                        </p>
                        {expense.original_currency !== mainCurrency && (
                          <p className="text-xs text-gray-500">
                            {getCurrencySymbol(expense.original_currency || '')}{expense.original_amount} {expense.original_currency}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {getParticipantName(expense.user_id).charAt(0).toUpperCase()}
                        </div> */}
                        <span className="text-sm">{getParticipantName(expense.user_id)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant={expense.payment_status === 'paid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusToggle(expense)}
                        disabled={!canEditExpense(expense) || isUpdatingStatus === expense.id}
                        className={expense.payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700' : 'text-orange-600 border-orange-600 hover:bg-orange-50'}
                      >
                        {isUpdatingStatus === expense.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        ) : expense.payment_status === 'paid' ? (
                          <>
                            <CreditCard className="h-4 w-4 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-1" />
                            Pending
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditExpense(expense) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400"
                              onClick={() => setEditExpense(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => setDeleteExpense(expense)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {deleteExpense && (
        <DeleteExpenseModal
          expense={deleteExpense}
          onClose={() => setDeleteExpense(null)}
          onDeleted={() => {
            setDeleteExpense(null);
            onExpenseUpdated();
          }}
          deleteExpenseAction={deleteExpenseAction}
        />
      )}

      {editExpense && (
        <EditExpenseModal
          expense={editExpense}
          categories={categories}
          onClose={() => setEditExpense(null)}
          onUpdated={() => {
            setEditExpense(null);
            onExpenseUpdated();
          }}
          updateExpenseAction={updateExpenseAction}
        />
      )}
    </div>
  );
}
