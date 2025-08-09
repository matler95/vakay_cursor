"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, User as UserIcon } from 'lucide-react';
import LogoutButton from '../(app)/_components/LogoutButton';
import Lottie from 'lottie-react';
import flightAnimation from '@/../public/Flight.json';

export default function TopNav({ user }: { user?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleNav = (href: string) => (e: React.MouseEvent) => {
    if (pathname !== href) {
      e.preventDefault();
      setLoading(true);
      router.push(href);
    }
  };

  // Hide loading when path changes
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center">
            <Lottie animationData={flightAnimation} loop style={{ width: 96, height: 96 }} />
            <span className="mt-4 text-lg text-white font-semibold">Loading...</span>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link href={user ? '/dashboard' : '/'} className="text-lg font-semibold text-gray-900">VAKAY</Link>
          {user ? (
            <nav className="flex items-center gap-4 text-sm text-gray-700">
              <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50" onClick={handleNav('/dashboard')}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50" onClick={handleNav('/dashboard/profile')}>
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
    </>
  );
}
