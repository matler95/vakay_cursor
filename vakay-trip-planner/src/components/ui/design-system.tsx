import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

// Design System Constants
export const DESIGN_SYSTEM = {
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
};

// Standardized Page Layout Components
export function PageContainer({ 
  children, 
  className,
  padding = 'default',
  maxWidth = 'default'
}: { 
  children: ReactNode; 
  className?: string;
  padding?: 'none' | 'sm' | 'default' | 'lg';
  maxWidth?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-4 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-12',
  };

  const maxWidthClasses = {
    sm: 'max-w-2xl',
    default: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-none',
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      paddingClasses[padding],
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

export function PageHeader({ 
  title, 
  description, 
  children,
  className 
}: { 
  title: string; 
  description?: string; 
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'mb-6 sm:mb-8 lg:mb-10',
      className
    )}>
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
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionHeader({ 
  title, 
  description, 
  children,
  className 
}: { 
  title: string; 
  description?: string; 
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'mb-4 sm:mb-6',
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
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Standardized Card Components
export function StandardCard({ 
  children, 
  className,
  padding = 'default',
  shadow = 'default'
}: { 
  children: ReactNode; 
  className?: string;
  padding?: 'none' | 'sm' | 'default' | 'lg';
  shadow?: 'none' | 'sm' | 'default' | 'lg';
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200',
      paddingClasses[padding],
      shadowClasses[shadow],
      className
    )}>
      {children}
    </div>
  );
}

// Standardized List Components
export function StandardList({ 
  children, 
  className,
  spacing = 'default'
}: { 
  children: ReactNode; 
  className?: string;
  spacing?: 'sm' | 'default' | 'lg';
}) {
  const spacingClasses = {
    sm: 'space-y-2',
    default: 'space-y-3',
    lg: 'space-y-4',
  };

  return (
    <div className={cn(
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

export function StandardListItem({ 
  children, 
  className,
  padding = 'default',
  hover = true
}: { 
  children: ReactNode; 
  className?: string;
  padding?: 'sm' | 'default' | 'lg';
  hover?: boolean;
}) {
  const paddingClasses = {
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-lg transition-all duration-200',
      paddingClasses[padding],
      hover && 'hover:shadow-md hover:border-gray-300',
      className
    )}>
      {children}
    </div>
  );
}

// Standardized Form Components
export function FormSection({ 
  title, 
  description, 
  children,
  className 
}: { 
  title: string; 
  description?: string; 
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

export function FormRow({ 
  children, 
  className,
  cols = 'default'
}: { 
  children: ReactNode; 
  className?: string;
  cols?: 1 | 2 | 3 | 'default';
}) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    default: 'grid-cols-1 sm:grid-cols-2',
  };

  return (
    <div className={cn(
      'grid gap-4',
      colsClasses[cols],
      className
    )}>
      {children}
    </div>
  );
}

// Standardized Action Components
export function ActionBar({ 
  children, 
  className,
  position = 'bottom'
}: { 
  children: ReactNode; 
  className?: string;
  position?: 'top' | 'bottom' | 'sticky';
}) {
  const positionClasses = {
    top: 'mb-6',
    bottom: 'mt-6 pt-6 border-t border-gray-200',
    sticky: 'sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10',
  };

  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-center gap-3 sm:justify-between',
      positionClasses[position],
      className
    )}>
      {children}
    </div>
  );
}

// Standardized Empty State
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  description: string; 
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'text-center py-12 sm:py-16',
      className
    )}>
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">{description}</p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

// Standardized Loading State
export function LoadingState({ 
  message = 'Loading...', 
  className 
}: { 
  message?: string; 
  className?: string;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12',
      className
    )}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

// Standardized Error State
export function ErrorState({ 
  title = 'Something went wrong', 
  description, 
  action,
  className 
}: { 
  title?: string; 
  description?: string; 
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'text-center py-12',
      className
    )}>
      <div className="mx-auto h-12 w-12 text-red-500 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}

// Utility function for consistent spacing
export function createSpacing(amount: keyof typeof DESIGN_SYSTEM.spacing) {
  return DESIGN_SYSTEM.spacing[amount];
}

// Utility function for consistent border radius
export function createBorderRadius(size: keyof typeof DESIGN_SYSTEM.borderRadius) {
  return DESIGN_SYSTEM.borderRadius[size];
}
