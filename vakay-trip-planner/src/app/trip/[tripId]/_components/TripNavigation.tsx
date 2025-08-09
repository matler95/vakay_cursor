// src/app/trip/[tripId]/_components/TripNavigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, DollarSign } from 'lucide-react';

interface TripNavigationProps {
  tripId: string;
}

export function TripNavigation({ tripId }: TripNavigationProps) {
  const pathname = usePathname();
  
  const tabs = [
    {
      name: 'Itinerary',
      href: `/trip/${tripId}`,
      icon: Calendar,
      current: pathname === `/trip/${tripId}`,
    },
    {
      name: 'Expenses',
      href: `/trip/${tripId}/expense`,
      icon: DollarSign,
      current: pathname === `/trip/${tripId}/expense`,
    },
  ];

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                ${tab.current
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
