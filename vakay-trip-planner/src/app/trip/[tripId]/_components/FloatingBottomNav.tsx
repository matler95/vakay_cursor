'use client';

import { Calendar, Bed, Plane, Link as LinkIcon, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'plan' | 'accommodation' | 'transportation' | 'links' | 'expenses';

interface FloatingBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function FloatingBottomNav({ activeTab, onTabChange }: FloatingBottomNavProps) {
  const tabs = [
    { id: 'plan', name: 'Plan', icon: Calendar },
    { id: 'accommodation', name: 'Sleep', icon: Bed },
    { id: 'transportation', name: 'Travel', icon: Plane },
    { id: 'links', name: 'Links', icon: LinkIcon },
    { id: 'expenses', name: 'Budget', icon: DollarSign },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl pb-safe animate-in slide-in-from-bottom-2 duration-300">
      <nav className="flex justify-around items-center px-2 py-2" role="tablist" aria-label="Trip sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => {
                if (activeTab !== tab.id) {
                  // Add subtle haptic feedback
                  if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                  }
                  onTabChange(tab.id as TabType);
                }
              }}
              aria-selected={isActive}
              aria-label={`${tab.name} tab`}
              role="tab"
              tabIndex={0}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-2 min-w-[60px] font-medium text-xs transition-all duration-300 cursor-pointer rounded-lg relative overflow-hidden",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "transform active:scale-95 touch-manipulation",
                isActive
                  ? "text-blue-600 bg-blue-50 scale-105"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "scale-110" : ""
                )} 
              />
              <span className="text-center leading-tight">{tab.name}</span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-sm" />
              )}
              {/* Subtle ripple effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
