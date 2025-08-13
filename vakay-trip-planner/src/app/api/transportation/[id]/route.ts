import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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
      type,
      provider,
      departure_location,
      arrival_location,
      departure_date,
      arrival_date,
      departure_time,
      arrival_time,
      flight_number,
      terminal,
      gate,
      seat,
      vehicle_number,
      carriage_coach,
      pickup_location,
      dropoff_location,
      booking_reference,
      notes,
      participants,
      expense,
    } = body;

    // Validate required fields
    if (!type || !provider || !departure_location || !arrival_location || !departure_date || !arrival_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user has access to this transportation record
    const { data: transportation } = await supabase
      .from('transportation')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!transportation) {
      return NextResponse.json({ error: 'Transportation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', transportation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update transportation record
    const { data: updatedTransportation, error } = await supabase
      .from('transportation')
      .update({
        type,
        provider,
        departure_location,
        arrival_location,
        departure_date,
        arrival_date,
        departure_time: departure_time || null,
        arrival_time: arrival_time || null,
        flight_number: flight_number || null,
        terminal: terminal || null,
        gate: gate || null,
        seat: seat || null,
        vehicle_number: vehicle_number || null,
        carriage_coach: carriage_coach || null,
        pickup_location: pickup_location || null,
        dropoff_location: dropoff_location || null,
        booking_reference: booking_reference || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transportation:', error);
      return NextResponse.json(
        { error: 'Failed to update transportation' },
        { status: 500 }
      );
    }

    // Replace participants associations if provided
    if (Array.isArray(participants)) {
      // Delete existing
      const { error: delErr } = await supabase
        .from('transportation_participants')
        .delete()
        .eq('transportation_id', params.id);
      if (delErr) {
        console.error('Failed to clear transportation participants:', delErr);
      }
      if (participants.length > 0) {
        const inserts = participants.map((pid: string) => ({
          transportation_id: Number(params.id),
          participant_user_id: pid,
        }));
        const { error: insErr } = await supabase
          .from('transportation_participants')
          .insert(inserts);
        if (insErr) {
          console.error('Failed to insert transportation participants:', insErr);
        }
      }
    }

    // Handle expense creation if provided
    if (expense && expense.amount && expense.currency) {
      // Check if expense already exists for this transportation
      const expectedDescription = `${provider} ${departure_location} → ${arrival_location}`;
      const { data: existingExpense } = await supabase
        .from('expenses')
        .select('id')
        .eq('trip_id', transportation.trip_id)
        .eq('description', expectedDescription)
        .single();

      if (!existingExpense) {
        // Resolve default participants (all trip participants) if none selected
        let expenseParticipants: string[] = Array.isArray(participants) ? participants : [];
        if (expenseParticipants.length === 0) {
          const { data: tps } = await supabase
            .from('trip_participants')
            .select('user_id')
            .eq('trip_id', transportation.trip_id);
          expenseParticipants = (tps || []).map(tp => tp.user_id);
        }

        // Fetch trip main currency
        const { data: trip } = await supabase
          .from('trips')
          .select('main_currency')
          .eq('id', transportation.trip_id)
          .single();
        const mainCurrency = trip?.main_currency || 'USD';

        let convertedAmount = expense.amount as number;
        let exchangeRate = 1;

        if (expense.currency !== mainCurrency) {
          try {
            // Import currency conversion functions
            const { fetchExchangeRates, convertCurrency } = await import('@/lib/currency');
            const rates = await fetchExchangeRates(expense.currency);
            const conversion = convertCurrency(expense.amount, expense.currency, mainCurrency, rates.rates);
            convertedAmount = conversion.convertedAmount;
            exchangeRate = conversion.exchangeRate;
          } catch (err) {
            console.error('Currency conversion failed, falling back to original amount:', err);
          }
        }

        // Get Transportation category id
        const { data: category } = await supabase
          .from('expense_categories')
          .select('id')
          .eq('name', 'Transportation')
          .single();

        const { data: expenseRow, error: expErr } = await supabase
          .from('expenses')
          .insert({
            trip_id: transportation.trip_id,
            user_id: user.id,
            category_id: category?.id ?? null,
            original_amount: expense.amount,
            original_currency: expense.currency,
            amount: convertedAmount,
            currency: mainCurrency,
            exchange_rate: exchangeRate,
            description: expectedDescription,
            payment_status: expense.payment_status || 'pending',
          })
          .select()
          .single();

        if (expErr) {
          console.error('Failed to create expense for transportation:', expErr);
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
    }

    return NextResponse.json(updatedTransportation);
  } catch (error) {
    console.error('Error in transportation PUT:', error);
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
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this transportation record
    const { data: transportation } = await supabase
      .from('transportation')
      .select('trip_id')
      .eq('id', params.id)
      .single();

    if (!transportation) {
      return NextResponse.json({ error: 'Transportation not found' }, { status: 404 });
    }

    const { data: participantCheck } = await supabase
      .from('trip_participants')
      .select('user_id')
      .eq('trip_id', transportation.trip_id)
      .eq('user_id', user.id)
      .single();

    if (!participantCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete transportation record
    const { error } = await supabase
      .from('transportation')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting transportation:', error);
      return NextResponse.json(
        { error: 'Failed to delete transportation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Transportation deleted successfully' });
  } catch (error) {
    console.error('Error in transportation DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
