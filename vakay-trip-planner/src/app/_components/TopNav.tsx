"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, User as UserIcon, Menu, X } from 'lucide-react';
import LogoutButton from '../(app)/_components/LogoutButton';
import Lottie from 'lottie-react';
import flightAnimation from '@/../public/Flight.json';

export default function TopNav({ user }: { user?: { id: string; email?: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Close menu when path changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('.mobile-menu-container')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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
          <div className="flex items-baseline space-x-0">
            <Link
              href={user ? '/dashboard' : '/'}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              VAKAY
            </Link>
            <p className="text-xs text-gray-900 ml-1">beta</p>
          </div>
        {user ? (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-4 text-sm text-gray-700">
                <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors" onClick={handleNav('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link href="/dashboard/profile" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors" onClick={handleNav('/dashboard/profile')}>
                  <UserIcon className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <LogoutButton />
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </>
          ) : (
            <div className="text-xs text-gray-500">Plan smarter. Travel lighter.</div>
          )}
        </div>

        {/* Mobile Menu - Improved for touch */}
        {user && isMenuOpen && (
          <div className="mobile-menu-container md:hidden border-t border-gray-100 bg-white shadow-lg">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 rounded-lg px-4 py-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation" 
                onClick={handleNav('/dashboard')}
              >
                <LayoutDashboard className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link 
                href="/dashboard/profile" 
                className="flex items-center gap-3 rounded-lg px-4 py-4 text-sm text-gray-700 hover:bg-gray-50 transition-colors touch-manipulation" 
                onClick={handleNav('/dashboard/profile')}
              >
                <UserIcon className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Profile</span>
              </Link>
              <div className="px-4 py-2">
                <LogoutButton />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
