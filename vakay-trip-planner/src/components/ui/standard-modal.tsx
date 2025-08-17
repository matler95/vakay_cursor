'use client';

import { Fragment, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footer?: React.ReactNode;
  showFooter?: boolean;
  loading?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]'
};

export function StandardModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  headerClassName,
  contentClassName,
  footer,
  showFooter = false,
  loading = false
}: StandardModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
      >
        <div
          ref={modalRef}
          className={cn(
            'bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col',
            sizeClasses[size],
            className
          )}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn(
            'flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0',
            headerClassName
          )}>
            <div className="flex-1 min-w-0">
              <h2 
                id="modal-title"
                className="text-lg sm:text-xl font-semibold text-gray-900 truncate"
              >
                {title}
              </h2>
              {description && (
                <p 
                  id="modal-description"
                  className="mt-1 text-sm text-gray-600"
                >
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4 h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Content */}
          <div className={cn(
            'flex-1 overflow-y-auto p-4 sm:p-6',
            contentClassName
          )}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-3 text-sm text-gray-600">Loading...</span>
              </div>
            ) : (
              children
            )}
          </div>

          {/* Footer */}
          {showFooter && (
            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );

  // Use portal to render modal at the document body level
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

// Specialized modal variants for common use cases
export function ConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
  ...props
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  onConfirm: () => void;
  loading?: boolean;
} & Omit<StandardModalProps, 'children' | 'title' | 'description' | 'onClose' | 'isOpen'>) {
  const variantClasses = {
    default: 'bg-primary hover:bg-primary/90',
    destructive: 'bg-destructive hover:bg-destructive/90',
    warning: 'bg-orange-600 hover:bg-orange-700',
  };

  const footer = (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button 
        variant="outline" 
        className="flex-1" 
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button 
        className={cn('flex-1', variantClasses[variant])}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Loading...
          </>
        ) : (
          confirmText
        )}
      </Button>
    </div>
  );

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showFooter
      footer={footer}
      loading={loading}
      {...props}
    >
      {null}
    </StandardModal>
  );
}

export function FormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  onSubmit,
  loading = false,
  size = 'md',
  ...props
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  onSubmit: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
} & Omit<StandardModalProps, 'children' | 'title' | 'description' | 'onClose' | 'isOpen' | 'size'>) {
  const footer = (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button 
        variant="outline" 
        className="flex-1" 
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button 
        className="flex-1"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Saving...
          </>
        ) : (
          submitText
        )}
      </Button>
    </div>
  );

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      showFooter
      footer={footer}
      loading={loading}
      {...props}
    >
      {children}
    </StandardModal>
  );
}
