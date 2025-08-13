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
    if (!trip_id || !type || !provider || !departure_location || !arrival_location || !departure_date || !arrival_date) {
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

    // Insert transportation record
    const { data: transportation, error } = await supabase
      .from('transportation')
      .insert({
        trip_id,
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
      })
      .select()
      .single();

    if (error || !transportation) {
      console.error('Error inserting transportation:', error);
      return NextResponse.json(
        { error: 'Failed to create transportation' },
        { status: 500 }
      );
    }

    // Link participants if provided
    if (Array.isArray(participants) && participants.length > 0) {
      const inserts = participants.map((pid: string) => ({
        transportation_id: transportation.id,
        participant_user_id: pid,
      }));
      const { error: tpError } = await supabase
        .from('transportation_participants')
        .insert(inserts);
      if (tpError) {
        console.error('Error adding transportation participants:', tpError);
      }
    }

    // Optional: create expense
    if (expense && expense.amount && expense.currency) {
      // Helper function to format location display for flights
      const formatLocationDisplay = (location: string, type: string) => {
        if (type === 'flight') {
          // Extract airport code from location string
          // Expected format: "WAW - Warsaw Chopin Airport, Warsaw" or just "WAW"
          const airportCodeMatch = location.match(/^([A-Z]{3})/);
          if (airportCodeMatch) {
            return airportCodeMatch[1]; // Return just the airport code (e.g., "WAW")
          }
          // Fallback: if no airport code found, return the original location
          return location;
        }
        // For non-flight transportation, return the original location
        return location;
      };

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

      // Get Transportation category id
      const { data: category } = await supabase
        .from('expense_categories')
        .select('id')
        .eq('name', 'Transportation')
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
          description: `${provider} ${formatLocationDisplay(departure_location, type)} → ${formatLocationDisplay(arrival_location, type)}`,
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

    return NextResponse.json(transportation, { status: 201 });
  } catch (error) {
    console.error('Error in transportation POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
