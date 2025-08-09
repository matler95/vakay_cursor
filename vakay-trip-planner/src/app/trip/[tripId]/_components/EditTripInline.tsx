// src/app/trip/[tripId]/_components/EditTripInline.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings } from 'lucide-react';
import { EditTripModal } from './EditTripModal';

type Trip = Database['public']['Tables']['trips']['Row'];

interface EditTripInlineProps {
  trip: Trip;
  userRole: string | null;
}

export function EditTripInline({ trip, userRole }: EditTripInlineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Only admins can see the edit functionality
  if (userRole !== 'admin') {
    return null;
  }

  const handleTripUpdated = () => {
    // Refresh the page to get updated trip data
    router.refresh();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4"/>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edit trip details</p>
        </TooltipContent>
      </Tooltip>

      {/* Edit Trip Modal */}
      <EditTripModal
        trip={trip}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTripUpdated={handleTripUpdated}
      />
    </>
  );
}