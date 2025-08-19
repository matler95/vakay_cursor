// Accommodation overview showing accommodation summary and surveys access
'use client';

import { Database } from '@/types/database.types';
import { Bed, MapPin, Calendar, ArrowRight, ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

type Accommodation = Database['public']['Tables']['accommodations']['Row'];

interface AccommodationOverviewProps {
  accommodations: Accommodation[];
  tripId: string;
}

export function AccommodationOverview({ accommodations, tripId }: AccommodationOverviewProps) {
  const router = useRouter();
  const safeAccommodations = accommodations || [];
  
  // Calculate accommodation stats
  const totalAccommodations = safeAccommodations.length;
  const totalNights = safeAccommodations.reduce((sum, acc) => {
    if (acc.check_in_date && acc.check_out_date) {
      const checkIn = new Date(acc.check_in_date);
      const checkOut = new Date(acc.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, nights);
    }
    return sum;
  }, 0);

  const handleViewSurveys = () => {
    router.push(`/trip/${tripId}/accommodation/surveys`);
  };

  return (
    <div className="space-y-4">


    </div>
  );
}
