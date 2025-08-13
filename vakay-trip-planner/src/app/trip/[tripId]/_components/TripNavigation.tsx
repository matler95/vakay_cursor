// src/app/trip/[tripId]/_components/TripNavigation.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calendar, DollarSign, Bed, Plane, Link as LinkIcon } from 'lucide-react';
import Lottie from 'lottie-react';
import flightAnimation from '@/../public/Flight.json';

interface TripNavigationProps {
  tripId: string;
}

export function TripNavigation({ tripId }: TripNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Reset loading when path changes
    setLoading(false);
  }, [pathname]);
  
  const handleNav = (href: string) => (e: React.MouseEvent) => {
    if (pathname !== href) {
      e.preventDefault();
      setLoading(true);
      router.push(href);
    }
  };
  
  const tabs = [
    {
      name: 'Plan',
      href: `/trip/${tripId}`,
      icon: Calendar,
      current: pathname === `/trip/${tripId}`,
    },
    {
      name: 'Accomodation',
      href: `/trip/${tripId}/accommodation`,
      icon: Bed,
      current: pathname === `/trip/${tripId}/accommodation`,
    },
    {
      name: 'Travel',
      href: `/trip/${tripId}/transportation`,
      icon: Plane,
      current: pathname === `/trip/${tripId}/transportation`,
    },
    {
      name: 'Useful Links',
      href: `/trip/${tripId}/links`,
      icon: LinkIcon,
      current: pathname === `/trip/${tripId}/links`,
    },
    {
      name: 'Expenses',
      href: `/trip/${tripId}/expense`,
      icon: DollarSign,
      current: pathname === `/trip/${tripId}/expense`,
    },
  ];

  return (
    <div className="border-b border-gray-200 mb-6 relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center">
            <Lottie animationData={flightAnimation} loop style={{ width: 96, height: 96 }} />
            <span className="mt-4 text-lg text-white font-semibold">Loading...</span>
          </div>
        </div>
      )}
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              onClick={handleNav(tab.href)}
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
