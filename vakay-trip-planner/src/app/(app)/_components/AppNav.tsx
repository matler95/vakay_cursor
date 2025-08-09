// src/app/(app)/_components/AppNav.tsx
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';
import { CalendarDays, LayoutDashboard, User as UserIcon, MapPin } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default async function AppNav() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  let trips: { id: string; name: string | null }[] = [];
  if (user) {
    const { data } = await supabase
      .from('trip_participants')
      .select('trips(id, name)')
      .eq('user_id', user.id)
      .order('id', { ascending: false });
    trips = (data || []).map((row: { trips: { id: string; name: string | null } }) => ({ id: row.trips.id, name: row.trips.name }));
  }

  return (
    <aside className="hidden md:block md:w-64 border-r border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="flex h-full flex-col p-4">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
          <CalendarDays className="h-5 w-5 text-blue-600" /> VAKAY
        </Link>

        <nav className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50">
            <UserIcon className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </nav>

        {trips.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Your Trips</div>
            <div className="space-y-1">
              {trips.slice(0, 6).map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="truncate">{trip.name || 'Untitled trip'}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-6">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
