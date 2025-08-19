import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Trash2, Edit, MoreHorizontal, ChevronRight } from 'lucide-react';

// Standard List Container
interface StandardListProps {
  children: ReactNode;
  className?: string;
  spacing?: 'sm' | 'default' | 'lg';
  emptyState?: ReactNode;
  loading?: boolean;
  loadingMessage?: string;
}

export function StandardList({ 
  children, 
  className, 
  spacing = 'default',
  emptyState,
  loading = false,
  loadingMessage = 'Loading...'
}: StandardListProps) {
  const spacingClasses = {
    sm: 'space-y-2',
    default: 'space-y-3',
    lg: 'space-y-4',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-3 text-sm text-gray-600">{loadingMessage}</span>
      </div>
    );
  }

  if (!children || (Array.isArray(children) && children.length === 0)) {
    return emptyState || (
      <div className="text-center py-12 text-gray-500">
        No items found
      </div>
    );
  }

  return (
    <div className={cn(
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

// Compact Row List Item (following user's preference)
interface CompactRowProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  actions?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  border?: boolean;
  padding?: 'sm' | 'default' | 'lg';
}

export function CompactRow({ 
  children, 
  className,
  hover = true,
  clickable = false,
  onClick,
  actions,
  leftIcon,
  rightIcon,
  border = true,
  padding = 'default'
}: CompactRowProps) {
  const paddingClasses = {
    sm: 'px-3 py-2',
    default: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const borderClasses = border ? 'border border-gray-200' : '';

  return (
    <div 
      className={cn(
        'bg-white rounded-lg transition-all duration-200 flex items-center gap-3',
        paddingClasses[padding],
        borderClasses,
        hover && 'hover:shadow-sm hover:border-gray-300',
        clickable && 'cursor-pointer',
        className
      )}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {leftIcon && (
        <div className="flex-shrink-0 text-gray-500">
          {leftIcon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {rightIcon && (
        <div className="flex-shrink-0 text-gray-400">
          {rightIcon}
        </div>
      )}

      {actions && (
        <div className="flex-shrink-0 flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}

// Standard List Item with Header and Content
interface StandardListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  border?: boolean;
  padding?: 'sm' | 'default' | 'lg';
}

export function StandardListItem({ 
  title,
  subtitle,
  description,
  leftIcon,
  rightIcon,
  actions,
  className,
  hover = true,
  clickable = false,
  onClick,
  border = true,
  padding = 'default'
}: StandardListItemProps) {
  return (
    <CompactRow
      className={className}
      hover={hover}
      clickable={clickable}
      onClick={onClick}
      actions={actions}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      border={border}
      padding={padding}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 truncate">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </CompactRow>
  );
}

// Action Button Components
interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'ghost' | 'destructive';
  size?: 'sm' | 'default';
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  className?: string;
}

export function ActionButton({ 
  icon: Icon, 
  onClick, 
  variant = 'ghost',
  size = 'sm',
  disabled = false,
  loading = false,
  tooltip,
  className 
}: ActionButtonProps) {
  const sizeClasses = {
    sm: 'h-7 w-7',
    default: 'h-8 w-8',
  };

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        sizeClasses[size],
        'p-0 text-gray-400 hover:text-gray-600 transition-colors',
        variant === 'destructive' && 'hover:text-red-500 hover:bg-red-50',
        className
      )}
      title={tooltip}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </Button>
  );
}

// Common Action Buttons
export function EditButton({ onClick, disabled, loading, tooltip = 'Edit', ...props }: Omit<ActionButtonProps, 'icon' | 'variant'>) {
  return (
    <ActionButton
      icon={Edit}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      tooltip={tooltip}
      {...props}
    />
  );
}

export function DeleteButton({ onClick, disabled, loading, tooltip = 'Delete', ...props }: Omit<ActionButtonProps, 'icon' | 'variant'>) {
  return (
    <ActionButton
      icon={Trash2}
      onClick={onClick}
      variant="ghost"
      disabled={disabled}
      loading={loading}
      tooltip={tooltip}
      className="text-red-600 hover:text-red-600 border-red-300 hover:bg-red-50"
      {...props}
    />
  );
}

export function MoreButton({ onClick, disabled, loading, tooltip = 'More options', ...props }: Omit<ActionButtonProps, 'icon'>) {
  return (
    <ActionButton
      icon={MoreHorizontal}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      tooltip={tooltip}
      {...props}
    />
  );
}

export function ChevronButton({ onClick, disabled, loading, tooltip = 'View details', ...props }: Omit<ActionButtonProps, 'icon'>) {
  return (
    <ActionButton
      icon={ChevronRight}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      tooltip={tooltip}
      {...props}
    />
  );
}

// List Header Component
interface ListHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  border?: boolean;
}

export function ListHeader({ 
  title, 
  description, 
  children, 
  className,
  border = true
}: ListHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
      border && 'pb-4 border-b border-gray-200',
      className
    )}>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

// List Footer Component
interface ListFooterProps {
  children: ReactNode;
  className?: string;
  border?: boolean;
}

export function ListFooter({ children, className, border = true }: ListFooterProps) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
      border && 'pt-4 border-t border-gray-200',
      className
    )}>
      {children}
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'text-center py-12',
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

// Loading State Component
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
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
