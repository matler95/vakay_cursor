import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates, convertCurrency } from '@/lib/currency';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      trip_id,
      name,
      address,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      booking_confirmation,
      booking_url,
      contact_phone,
      notes,
      participants,
      expense,
    } = body;

    // Validate required fields
    if (!trip_id || !name || !address || !check_in_date || !check_out_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has access to this trip
    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Insert accommodation record
    const { data: accommodation, error } = await supabase
      .from('accommodations')
      .insert({
        trip_id,
        name,
        address,
        check_in_date,
        check_out_date,
        check_in_time: check_in_time || null,
        check_out_time: check_out_time || null,
        booking_confirmation: booking_confirmation || null,
        booking_url: booking_url || null,
        contact_phone: contact_phone || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error || !accommodation) {
      console.error('Error inserting accommodation:', error);
      return NextResponse.json(
        { error: 'Failed to create accommodation' },
        { status: 500 }
      );
    }

    // Link participants if provided
    if (Array.isArray(participants) && participants.length > 0) {
      const inserts = participants.map((pid: string) => ({
        accommodation_id: accommodation.id,
        participant_user_id: pid,
      }));
      const { error: apError } = await supabase
        .from('accommodation_participants')
        .insert(inserts);
      if (apError) {
        console.error('Error adding accommodation participants:', apError);
      }
    }

    // Optional: create expense
    if (expense && expense.amount && expense.currency) {
      // Resolve default participants (all trip participants) if none selected
      let expenseParticipants: string[] = Array.isArray(participants) ? participants : [];
      if (expenseParticipants.length === 0) {
        const { data: tps } = await supabase
          .from('trip_participants')
          .select('user_id')
          .eq('trip_id', trip_id);
        expenseParticipants = (tps || []).map(tp => tp.user_id);
      }

      // Fetch trip main currency
      const { data: trip } = await supabase
        .from('trips')
        .select('main_currency')
        .eq('id', trip_id)
        .single();
      const mainCurrency = trip?.main_currency || 'USD';

      let convertedAmount = expense.amount as number;
      let exchangeRate = 1;

      if (expense.currency !== mainCurrency) {
        try {
          const rates = await fetchExchangeRates(expense.currency);
          const conversion = convertCurrency(expense.amount, expense.currency, mainCurrency, rates.rates);
          convertedAmount = conversion.convertedAmount;
          exchangeRate = conversion.exchangeRate;
        } catch (err) {
          console.error('Currency conversion failed, falling back to original amount:', err);
        }
      }

      // Get Accommodation category id
      const { data: category } = await supabase
        .from('expense_categories')
        .select('id')
        .eq('name', 'Accommodation')
        .single();

      const { data: expenseRow, error: expErr } = await supabase
        .from('expenses')
        .insert({
          trip_id,
          user_id: user.id,
          category_id: category?.id ?? null,
          original_amount: expense.amount,
          original_currency: expense.currency,
          amount: convertedAmount,
          currency: mainCurrency,
          exchange_rate: exchangeRate,
          description: `${name}`,
          payment_status: expense.payment_status || 'pending',
          accommodation_id: accommodation.id,
        })
        .select()
        .single();

      if (expErr) {
        console.error('Failed to create expense for accommodation:', expErr);
      } else if (expenseRow && expenseParticipants.length > 0) {
        const expParts = expenseParticipants.map((pid: string) => ({
          expense_id: expenseRow.id,
          participant_user_id: pid,
        }));
        const { error: expPartErr } = await supabase
          .from('expense_participants')
          .insert(expParts);
        if (expPartErr) {
          console.error('Failed to add expense participants:', expPartErr);
        }
      }
    }

    return NextResponse.json(accommodation, { status: 201 });
  } catch (error) {
    console.error('Error in accommodation POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
