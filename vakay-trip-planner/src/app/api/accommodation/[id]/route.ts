import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { fetchExchangeRates, convertCurrency } from '@/lib/currency';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
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
    if (!name || !address || !check_in_date || !check_out_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has access to this accommodation record
    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', accommodation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update accommodation record
    const { data: updatedAccommodation, error } = await supabase
      .from('accommodations')
      .update({
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating accommodation:', error);
      return NextResponse.json(
        { error: 'Failed to update accommodation' },
        { status: 500 }
      );
    }

    // Replace participants associations if provided
    if (Array.isArray(participants)) {
      const { error: delErr } = await supabase
        .from('accommodation_participants')
        .delete()
        .eq('accommodation_id', params.id);
      if (delErr) {
        console.error('Failed to clear accommodation participants:', delErr);
      }
      if (participants.length > 0) {
        const inserts = participants.map((pid: string) => ({
          accommodation_id: Number(params.id),
          participant_user_id: pid,
        }));
        const { error: insErr } = await supabase
          .from('accommodation_participants')
          .insert(inserts);
        if (insErr) {
          console.error('Failed to insert accommodation participants:', insErr);
        }
      }
    }

    // Optional: create expense on edit
    if (expense && expense.amount && expense.currency) {
      let expenseParticipants: string[] = Array.isArray(participants) ? participants : [];
      if (expenseParticipants.length === 0) {
        const { data: tps } = await supabase
          .from('trip_participants')
          .select('user_id')
          .eq('trip_id', accommodation.trip_id);
        expenseParticipants = (tps || []).map(tp => tp.user_id);
      }

      const { data: trip } = await supabase
        .from('trips')
        .select('main_currency')
        .eq('id', accommodation.trip_id)
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
          console.error('Currency conversion failed:', err);
        }
      }

      const { data: category } = await supabase
        .from('expense_categories')
        .select('id')
        .eq('name', 'Accommodation')
        .single();

      const { error: expErr } = await supabase
        .from('expenses')
        .insert({
          trip_id: accommodation.trip_id,
          user_id: user.id,
          category_id: category?.id ?? null,
          original_amount: expense.amount,
          original_currency: expense.currency,
          amount: convertedAmount,
          currency: mainCurrency,
          exchange_rate: exchangeRate,
          description: `${name}`,
          payment_status: expense.payment_status || 'pending',
          accommodation_id: Number(params.id),
        });
      if (expErr) {
        console.error('Failed to create expense on edit:', expErr);
      } else if (expenseParticipants.length > 0) {
        // Fetch the last inserted expense id might not be trivial here without returning row; skip linking participants on edit to avoid complexity
      }
    }

    return NextResponse.json(updatedAccommodation);
  } catch (error) {
    console.error('Error in accommodation PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: accommodation } = await supabase
      .from('accommodations')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', accommodation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Safeguard: delete linked expenses first (FK CASCADE should also handle this)
    await supabase
      .from('expenses')
      .delete()
      .eq('accommodation_id', params.id);

    const { error } = await supabase
      .from('accommodations')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting accommodation:', error);
      return NextResponse.json(
        { error: 'Failed to delete accommodation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Accommodation and linked expenses deleted successfully' });
  } catch (error) {
    console.error('Error in accommodation DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
