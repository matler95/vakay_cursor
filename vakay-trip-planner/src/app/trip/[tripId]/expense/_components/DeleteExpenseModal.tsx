// Modal for deleting expenses
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';
// Server action will be passed as prop
import { formatCurrency } from '@/lib/currency';

type Expense = Database['public']['Tables']['expenses']['Row'] & {
  expense_categories: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
};

interface DeleteExpenseModalProps {
  expense: Expense;
  onClose: () => void;
  onDeleted: () => void;
  deleteExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function DeleteExpenseModal({ expense, onClose, onDeleted, deleteExpenseAction }: DeleteExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('expense_id', expense.id.toString());
    formData.append('trip_id', expense.trip_id);

    try {
      const result = await deleteExpenseAction(null, formData);
      if (result.message?.includes('success')) {
        setMessage('Expense deleted!');
        setTimeout(() => {
          onDeleted();
          setMessage('');
        }, 1500);
      } else {
        setMessage(result.message || 'An error occurred');
      }
    } catch {
      setMessage('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold">Delete Expense</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Description:</span>
              <span>{expense.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount:</span>
              <span className="font-semibold">
                {formatCurrency(Number(expense.amount), expense.currency)}
              </span>
            </div>
            {expense.original_currency !== expense.currency && (
              <div className="flex justify-between">
                <span className="font-medium">Original Amount:</span>
                <span className="text-sm text-gray-600">
                  {formatCurrency(Number(expense.original_amount), expense.original_currency || '')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={`capitalize ${
                expense.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {expense.payment_status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Created:</span>
              <span>{formatDateTime(expense.created_at)}</span>
            </div>
            {expense.expense_categories && (
              <div className="flex justify-between">
                <span className="font-medium">Category:</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: expense.expense_categories.color }}
                  />
                  <span>{expense.expense_categories.name}</span>
                </div>
              </div>
            )}
            {expense.location && (
              <div className="flex justify-between">
                <span className="font-medium">Location:</span>
                <span>{expense.location}</span>
              </div>
            )}
          </div>
        </div>

        {message && (
          <p className={`text-sm mb-4 ${message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Expense
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
