// src/app/_components/TopNav.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { LayoutDashboard, User as UserIcon } from 'lucide-react';
import LogoutButton from '../(app)/_components/LogoutButton';

export default async function TopNav() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href={user ? '/dashboard' : '/'} className="text-lg font-semibold text-gray-900">VAKAY</Link>
        {user ? (
          <nav className="flex items-center gap-4 text-sm text-gray-700">
            <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50">
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </Link>
            <LogoutButton />
          </nav>
        ) : (
          <div className="text-xs text-gray-500">Plan smarter. Travel lighter.</div>
        )}
      </div>
    </header>
  );
}
