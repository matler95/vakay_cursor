// Server actions for expense tracking
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Database } from '@/types/database.types';
import { fetchExchangeRates, convertCurrency } from '@/lib/currency';

export async function addExpense(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { message: 'error: You must be logged in to add expenses' };
    }

    const description = formData.get('description') as string;
    const originalAmount = formData.get('original_amount') as string;
    const originalCurrency = formData.get('original_currency') as string;
    const categoryId = formData.get('category_id') as string;
    const location = formData.get('location') as string;
    const notes = formData.get('notes') as string;
    const paymentStatus = formData.get('payment_status') as string;
    const tripId = formData.get('trip_id') as string;
    
    // Get selected participants
    const participantIds: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('participant_') && value === 'on') {
        participantIds.push(key.replace('participant_', ''));
      }
    }

    if (!description || !originalAmount || !originalCurrency || !tripId) {
      return { message: 'error: Please fill in all required fields' };
    }

    // Check if user is a participant in this trip
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      return { message: 'error: You are not a participant in this trip' };
    }

    // Get trip's main currency
    const { data: trip } = await supabase
      .from('trips')
      .select('main_currency')
      .eq('id', tripId)
      .single();

    if (!trip) {
      return { message: 'error: Trip not found' };
    }

    const mainCurrency = trip.main_currency || 'USD';
    let convertedAmount = parseFloat(originalAmount);
    let exchangeRate = 1;

    // Convert currency if needed
    if (originalCurrency !== mainCurrency) {
      try {
        const exchangeRates = await fetchExchangeRates(originalCurrency);
        const conversion = convertCurrency(
          parseFloat(originalAmount),
          originalCurrency,
          mainCurrency,
          exchangeRates.rates
        );
        convertedAmount = conversion.convertedAmount;
        exchangeRate = conversion.exchangeRate;
      } catch (error) {
        console.error('Currency conversion failed:', error);
        return { message: 'error: Failed to convert currency. Please try again.' };
      }
    }

    // Insert the expense
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        user_id: user.id,
        category_id: categoryId ? parseInt(categoryId) : null,
        original_amount: parseFloat(originalAmount),
        original_currency: originalCurrency,
        amount: convertedAmount,
        currency: mainCurrency,
        exchange_rate: exchangeRate,
        description,
        location: location || null,
        notes: notes || null,
        payment_status: paymentStatus || 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return { message: 'error: Failed to add expense' };
    }

    // Add expense participants
    if (participantIds.length > 0 && expense) {
      const participantInserts = participantIds.map(participantId => ({
        expense_id: expense.id,
        participant_user_id: participantId,
      }));

      const { error: participantError } = await supabase
        .from('expense_participants')
        .insert(participantInserts);

      if (participantError) {
        console.error('Error adding expense participants:', participantError);
        // Don't fail the whole operation, just log the error
      }
    }

    revalidatePath(`/trip/${tripId}/expense`);
    return { message: 'success: Expense added successfully' };
  } catch (error) {
    console.error('Error adding expense:', error);
    return { message: 'error: An unexpected error occurred' };
  }
}

export async function updateExpense(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { message: 'error: You must be logged in to update expenses' };
    }

    const expenseId = formData.get('expense_id') as string;
    const description = formData.get('description') as string;
    const originalAmount = formData.get('original_amount') as string;
    const originalCurrency = formData.get('original_currency') as string;
    const categoryId = formData.get('category_id') as string;
    const location = formData.get('location') as string;
    const notes = formData.get('notes') as string;
    const paymentStatus = formData.get('payment_status') as string;
    const tripId = formData.get('trip_id') as string;

    if (!expenseId || !description || !originalAmount || !originalCurrency || !tripId) {
      return { message: 'error: Please fill in all required fields' };
    }

    // Check if user can edit this expense
    const { data: expense } = await supabase
      .from('expenses')
      .select('user_id, trip_id')
      .eq('id', parseInt(expenseId))
      .single();

    if (!expense) {
      return { message: 'error: Expense not found' };
    }

    // Check if user is admin or the expense owner
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', expense.trip_id)
      .eq('user_id', user.id)
      .single();

    if (participant?.role !== 'admin' && expense.user_id !== user.id) {
      return { message: 'error: You do not have permission to edit this expense' };
    }

    // Get trip's main currency
    const { data: trip } = await supabase
      .from('trips')
      .select('main_currency')
      .eq('id', tripId)
      .single();

    if (!trip) {
      return { message: 'error: Trip not found' };
    }

    const mainCurrency = trip.main_currency || 'USD';
    let convertedAmount = parseFloat(originalAmount);
    let exchangeRate = 1;

    // Convert currency if needed
    if (originalCurrency !== mainCurrency) {
      try {
        const exchangeRates = await fetchExchangeRates(originalCurrency);
        const conversion = convertCurrency(
          parseFloat(originalAmount),
          originalCurrency,
          mainCurrency,
          exchangeRates.rates
        );
        convertedAmount = conversion.convertedAmount;
        exchangeRate = conversion.exchangeRate;
      } catch (error) {
        console.error('Currency conversion failed:', error);
        return { message: 'error: Failed to convert currency. Please try again.' };
      }
    }

    const { error } = await supabase
      .from('expenses')
      .update({
        category_id: categoryId ? parseInt(categoryId) : null,
        original_amount: parseFloat(originalAmount),
        original_currency: originalCurrency,
        amount: convertedAmount,
        currency: mainCurrency,
        exchange_rate: exchangeRate,
        description,
        location: location || null,
        notes: notes || null,
        payment_status: paymentStatus || 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(expenseId));

    if (error) {
      console.error('Error updating expense:', error);
      return { message: 'error: Failed to update expense' };
    }

    revalidatePath(`/trip/${tripId}/expense`);
    return { message: 'success: Expense updated successfully' };
  } catch (error) {
    console.error('Error updating expense:', error);
    return { message: 'error: An unexpected error occurred' };
  }
}

export async function updateExpenseStatus(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { message: 'error: You must be logged in to update expenses' };
    }

    const expenseId = formData.get('expense_id') as string;
    const paymentStatus = formData.get('payment_status') as string;
    const tripId = formData.get('trip_id') as string;

    if (!expenseId || !paymentStatus || !tripId) {
      return { message: 'error: Invalid data provided' };
    }

    // Check if user can edit this expense
    const { data: expense } = await supabase
      .from('expenses')
      .select('user_id')
      .eq('id', parseInt(expenseId))
      .single();

    if (!expense) {
      return { message: 'error: Expense not found' };
    }

    // Check if user is admin or the expense owner
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (participant?.role !== 'admin' && expense.user_id !== user.id) {
      return { message: 'error: You do not have permission to edit this expense' };
    }

    const { error } = await supabase
      .from('expenses')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(expenseId));

    if (error) {
      console.error('Error updating expense status:', error);
      return { message: 'error: Failed to update expense status' };
    }

    revalidatePath(`/trip/${tripId}/expense`);
    return { message: 'success: Expense status updated successfully' };
  } catch (error) {
    console.error('Error updating expense status:', error);
    return { message: 'error: An unexpected error occurred' };
  }
}

export async function deleteExpense(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { message: 'error: You must be logged in to delete expenses' };
    }

    const expenseId = formData.get('expense_id') as string;
    const tripId = formData.get('trip_id') as string;

    if (!expenseId || !tripId) {
      return { message: 'error: Invalid expense data' };
    }

    // Check if user can delete this expense
    const { data: expense } = await supabase
      .from('expenses')
      .select('user_id')
      .eq('id', parseInt(expenseId))
      .single();

    if (!expense) {
      return { message: 'error: Expense not found' };
    }

    // Check if user is admin or the expense owner
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (participant?.role !== 'admin' && expense.user_id !== user.id) {
      return { message: 'error: You do not have permission to delete this expense' };
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', parseInt(expenseId));

    if (error) {
      console.error('Error deleting expense:', error);
      return { message: 'error: Failed to delete expense' };
    }

    revalidatePath(`/trip/${tripId}/expense`);
    return { message: 'success: Expense deleted successfully' };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return { message: 'error: An unexpected error occurred' };
  }
}

export async function updateTripMainCurrency(prevState: unknown, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { message: 'error: You must be logged in to update trip settings' };
    }

    const tripId = formData.get('trip_id') as string;
    const mainCurrency = formData.get('main_currency') as string;

    if (!tripId || !mainCurrency) {
      return { message: 'error: Please provide all required information' };
    }

    // Check if user is admin
    const { data: participant } = await supabase
      .from('trip_participants')
      .select('role')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (participant?.role !== 'admin') {
      return { message: 'error: Only admins can update trip currency settings' };
    }

    // Update trip main currency
    const { error } = await supabase
      .from('trips')
      .update({ main_currency: mainCurrency })
      .eq('id', tripId);

    if (error) {
      console.error('Error updating trip main currency:', error);
      return { message: 'error: Failed to update trip currency' };
    }

    // TODO: Optionally, recalculate all expense amounts with new base currency
    // This would require fetching all expenses and updating their converted amounts

    revalidatePath(`/trip/${tripId}/expense`);
    return { message: 'success: Trip main currency updated successfully' };
  } catch (error) {
    console.error('Error updating trip main currency:', error);
    return { message: 'error: An unexpected error occurred' };
  }
}