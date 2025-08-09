// src/components/ui/modal.tsx
'use client';

import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string; // allow wider modals when needed
}

export function Modal({ open, onClose, title, description, children, footer, maxWidthClassName }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
      <div className={`relative w-full ${maxWidthClassName || 'max-w-md'} mx-4 rounded-xl border border-gray-100 bg-white p-6 shadow-2xl`}>
        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        {(title || description) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
          </div>
        )}

        {children}

        {footer && <div className="mt-4 flex gap-3">{footer}</div>}
      </div>
    </div>
  );
}
