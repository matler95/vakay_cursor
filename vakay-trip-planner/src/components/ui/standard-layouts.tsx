import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ChevronLeft, ArrowLeft, Home, Settings, User } from 'lucide-react';

// Standard Page Layout
interface StandardPageLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'default' | 'lg';
  background?: 'white' | 'gray' | 'transparent';
}

export function StandardPageLayout({ 
  children, 
  className,
  maxWidth = 'default',
  padding = 'default',
  background = 'white'
}: StandardPageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-2xl',
    default: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12',
  };

  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    transparent: 'bg-transparent',
  };

  return (
    <div className={cn(
      'min-h-screen',
      backgroundClasses[background]
    )}>
      <div className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}>
        {children}
      </div>
    </div>
  );
}

// Page Header with Navigation
interface PageHeaderProps {
  title: string;
  description?: string;
  backLink?: string;
  backText?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  backLink,
  backText = 'Back',
  actions,
  breadcrumbs,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 sm:mb-8 lg:mb-10', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <div className="mb-4">
          {breadcrumbs}
        </div>
      )}

      {/* Back Button */}
      {backLink && (
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {backText}
          </Button>
        </div>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-base sm:text-lg text-gray-600 max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Section Header
interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  border?: boolean;
}

export function SectionHeader({ 
  title, 
  description, 
  actions,
  className,
  border = true
}: SectionHeaderProps) {
  return (
    <div className={cn(
      'mb-4 sm:mb-6',
      border && 'pb-4 border-b border-gray-200',
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Content Section
interface ContentSectionProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'default' | 'lg';
  background?: 'white' | 'transparent';
  border?: boolean;
  shadow?: 'none' | 'sm' | 'default' | 'lg';
}

export function ContentSection({ 
  children, 
  className,
  padding = 'default',
  background = 'white',
  border = true,
  shadow = 'default'
}: ContentSectionProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const backgroundClasses = {
    white: 'bg-white',
    transparent: 'bg-transparent',
  };

  const borderClasses = border ? 'border border-gray-200' : '';
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div className={cn(
      'rounded-xl',
      paddingClasses[padding],
      backgroundClasses[background],
      borderClasses,
      shadowClasses[shadow],
      className
    )}>
      {children}
    </div>
  );
}

// Two Column Layout
interface TwoColumnLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
  className?: string;
  leftWidth?: 'sm' | 'default' | 'lg';
  gap?: 'sm' | 'default' | 'lg';
  reverse?: boolean;
}

export function TwoColumnLayout({ 
  leftColumn, 
  rightColumn, 
  className,
  leftWidth = 'default',
  gap = 'default',
  reverse = false
}: TwoColumnLayoutProps) {
  const leftWidthClasses = {
    sm: 'lg:w-1/3',
    default: 'lg:w-2/5',
    lg: 'lg:w-1/2',
  };

  const gapClasses = {
    sm: 'gap-4',
    default: 'gap-6',
    lg: 'gap-8',
  };

  const columns = [
    <div key="left" className={cn('w-full', leftWidthClasses[leftWidth])}>
      {leftColumn}
    </div>,
    <div key="right" className="w-full lg:flex-1">
      {rightColumn}
    </div>
  ];

  return (
    <div className={cn(
      'grid grid-cols-1 lg:grid-cols-5',
      gapClasses[gap],
      className
    )}>
      {reverse ? columns.reverse() : columns}
    </div>
  );
}

// Sidebar Layout
interface SidebarLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  className?: string;
  sidebarWidth?: 'sm' | 'default' | 'lg';
  gap?: 'sm' | 'default' | 'lg';
  sidebarPosition?: 'left' | 'right';
}

export function SidebarLayout({ 
  sidebar, 
  main, 
  className,
  sidebarWidth = 'default',
  gap = 'default',
  sidebarPosition = 'left'
}: SidebarLayoutProps) {
  const sidebarWidthClasses = {
    sm: 'lg:w-64',
    default: 'lg:w-80',
    lg: 'lg:w-96',
  };

  const gapClasses = {
    sm: 'gap-4',
    default: 'gap-6',
    lg: 'gap-8',
  };

  const sidebarContent = (
    <div className={cn('w-full', sidebarWidthClasses[sidebarWidth])}>
      {sidebar}
    </div>
  );

  const mainContent = (
    <div className="w-full lg:flex-1">
      {main}
    </div>
  );

  return (
    <div className={cn(
      'grid grid-cols-1 lg:grid-cols-12',
      gapClasses[gap],
      className
    )}>
      {sidebarPosition === 'left' ? (
        <>
          {sidebarContent}
          {mainContent}
        </>
      ) : (
        <>
          {mainContent}
          {sidebarContent}
        </>
      )}
    </div>
  );
}

// Card Grid Layout
interface CardGridLayoutProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 'auto';
  gap?: 'sm' | 'default' | 'lg';
}

export function CardGridLayout({ 
  children, 
  className,
  cols = 'auto',
  gap = 'default'
}: CardGridLayoutProps) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  };

  const gapClasses = {
    sm: 'gap-3',
    default: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn(
      'grid',
      colsClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Sticky Header Layout
interface StickyHeaderLayoutProps {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function StickyHeaderLayout({ 
  header, 
  children, 
  className,
  headerClassName,
  contentClassName
}: StickyHeaderLayoutProps) {
  return (
    <div className={cn('min-h-screen', className)}>
      {/* Sticky Header */}
      <div className={cn(
        'sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200',
        headerClassName
      )}>
        {header}
      </div>

      {/* Content */}
      <div className={cn('flex-1', contentClassName)}>
        {children}
      </div>
    </div>
  );
}

// Floating Action Button Layout
interface FloatingActionButtonLayoutProps {
  children: ReactNode;
  actionButton: ReactNode;
  className?: string;
  actionButtonClassName?: string;
}

export function FloatingActionButtonLayout({ 
  children, 
  actionButton, 
  className,
  actionButtonClassName
}: FloatingActionButtonLayoutProps) {
  return (
    <div className={cn('relative min-h-screen', className)}>
      {/* Main Content */}
      <div className="pb-20">
        {children}
      </div>

      {/* Floating Action Button */}
      <div className={cn(
        'fixed bottom-6 right-6 z-50',
        actionButtonClassName
      )}>
        {actionButton}
      </div>
    </div>
  );
}

// Tab Layout
interface TabLayoutProps {
  tabs: Array<{
    id: string;
    label: string;
    content: ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
}

export function TabLayout({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className,
  tabClassName,
  contentClassName
}: TabLayoutProps) {
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className={cn(
        'border-b border-gray-200 mb-6',
        tabClassName
      )}>
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className={contentClassName}>
        {activeTabContent}
      </div>
    </div>
  );
}
