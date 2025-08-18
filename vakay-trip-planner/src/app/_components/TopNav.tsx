"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, User as UserIcon, Menu, X } from 'lucide-react';
import LogoutButton from '../(app)/_components/LogoutButton';

export default function TopNav({ user }: { user?: { id: string; email?: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);

  const handleNav = (href: string) => (e: React.MouseEvent) => {
    if (pathname !== href) {
      e.preventDefault();
      setLoadingRoute(href); // Show loading immediately
      router.push(href);
    }
  };

  // Hide loading when path changes
  useEffect(() => {
    setLoadingRoute(null);
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
      {loadingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-white"></div>
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
                <Link 
                  href="/dashboard" 
                  className={`flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors ${
                    loadingRoute === '/dashboard' ? 'opacity-50 pointer-events-none' : ''
                  }`} 
                  onClick={handleNav('/dashboard')}
                >
                  {loadingRoute === '/dashboard' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : (
                    <LayoutDashboard className="h-4 w-4" />
                  )}
                  <span>Dashboard</span>
                </Link>
                <Link 
                  href="/dashboard/profile" 
                  className={`flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors ${
                    loadingRoute === '/dashboard/profile' ? 'opacity-50 pointer-events-none' : ''
                  }`} 
                  onClick={handleNav('/dashboard/profile')}
                >
                  {loadingRoute === '/dashboard/profile' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : (
                    <UserIcon className="h-4 w-4" />
                  )}
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

        {/* Mobile Navigation */}
        {user && (
          <div
            className={`md:hidden border-t border-gray-100 bg-white mobile-menu-container ${
              isMenuOpen ? 'block' : 'hidden'
            }`}
          >
            <nav className="flex flex-col p-2 text-sm text-gray-700">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors ${
                  loadingRoute === '/dashboard' ? 'opacity-50 pointer-events-none' : ''
                }`}
                onClick={handleNav('/dashboard')}
              >
                {loadingRoute === '/dashboard' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/profile"
                className={`flex items-center gap-2 rounded-md px-3 py-2 hover:bg-gray-50 transition-colors ${
                  loadingRoute === '/dashboard/profile' ? 'opacity-50 pointer-events-none' : ''
                }`}
                onClick={handleNav('/dashboard/profile')}
              >
                {loadingRoute === '/dashboard/profile' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                  <UserIcon className="h-4 w-4" />
                )}
                <span>Profile</span>
              </Link>
              <div className="px-3 py-2">
                <LogoutButton />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
