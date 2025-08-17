// Modal for deleting expenses
'use client';

import { useState } from 'react';
import { Database } from '@/types/database.types';
import { AlertTriangle } from 'lucide-react';
// Server action will be passed as prop
import { formatCurrency } from '@/lib/currency';
import { ConfirmationModal } from '@/components/ui';

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
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  deleteExpenseAction: (prevState: unknown, formData: FormData) => Promise<{ message?: string }>;
}

export function DeleteExpenseModal({ expense, isOpen, onClose, onDeleted, deleteExpenseAction }: DeleteExpenseModalProps) {
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
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Expense"
      description={`Are you sure you want to delete "${expense.description}" (${formatCurrency(Number(expense.amount), expense.currency)})? This action cannot be undone.`}
      confirmText="Delete Expense"
      cancelText="Cancel"
      variant="destructive"
      onConfirm={handleDelete}
      loading={isSubmitting}
    />
  );
}
