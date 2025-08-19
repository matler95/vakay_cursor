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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Accommodations */}
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex flex-col justify-center items-center">
          <div className="flex items-center gap-2 mb-2">
            <Bed className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs sm:text-xl font-medium text-gray-600">Total</h3>
          </div>
          <p className="text-sm sm:text-2xl font-bold text-gray-900 leading-tight text-center">
            {totalAccommodations}
          </p>
        </div>

        {/* Surveys Button */}
        <Button
          onClick={handleViewSurveys}
          variant="ghost"
          className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex-1 min-w-0 h-full flex justify-center items-center hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs sm:text-xl font-medium text-gray-600">Surveys</h3>
            <ArrowRight className="h-4 w-4 text-blue-600" />
          </div>
        </Button>
      </div>

      {/* Additional Stats */}
      {totalNights > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <h3 className="text-sm font-medium text-gray-600">Total Nights</h3>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {totalNights} night{totalNights !== 1 ? 's' : ''}
          </p>
        </div>
      )}

    </div>
  );
}
