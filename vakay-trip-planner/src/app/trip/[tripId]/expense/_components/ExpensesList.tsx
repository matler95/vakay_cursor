// List of expenses with filtering, sorting and quick status toggle
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, MapPin, CreditCard, Clock, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { 
  StandardList, 
  CompactRow, 
  ListHeader, 
  EditButton, 
  DeleteButton,
  ContentSection
} from '@/components/ui';
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
    <ContentSection>
      <ListHeader
        title="Expense History"
      />

      {/* Filters, Search, Sorting */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 md:justify-between">
          {/* Search */}
          <div className="w-full">
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
                  <SelectValue placeholder="Sort by" />
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
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <StandardList>
        {filteredExpenses.map((expense) => (
          <CompactRow
            key={expense.id}
            leftIcon={
              <div className="p-2 bg-green-100 rounded-full">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
            }
            actions={
              <div className="flex items-center gap-2">
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

                {canEditExpense(expense) && (
                  <>
                    <EditButton
                      onClick={() => setEditExpense(expense)}
                      tooltip="Edit expense"
                    />
                    <DeleteButton
                      onClick={() => setDeleteExpense(expense)}
                      tooltip="Delete expense"
                    />
                  </>
                )}
              </div>
            }
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{expense.description}</h4>
                  <p className="text-sm text-gray-500">
                    By {getParticipantName(expense.user_id)}
                  </p>
                  {expense.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      {expense.location}
                    </div>
                  )}
                  {expense.expense_categories && (
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: expense.expense_categories.color }}
                      />
                      <span className="text-sm text-gray-600">{expense.expense_categories.name}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(expense.created_at)}
                  </p>
                </div>
                <div className="text-right ml-4">
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
            </div>
          </CompactRow>
        ))}
      </StandardList>

      {/* Modals */}
      {deleteExpense && (
        <DeleteExpenseModal
          expense={deleteExpense}
          isOpen={!!deleteExpense}
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
          isOpen={!!editExpense}
          categories={categories}
          onClose={() => setEditExpense(null)}
          onUpdated={() => {
            setEditExpense(null);
            onExpenseUpdated();
          }}
          updateExpenseAction={updateExpenseAction}
        />
      )}
    </ContentSection>
  );
}
