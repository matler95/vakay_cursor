'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'relative inline-flex h-7 w-12 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 touch-manipulation',
              props.checked ? 'bg-blue-600' : 'bg-gray-200',
              props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              className
            )}
            onClick={() => {
              if (!props.disabled && props.onChange) {
                const event = {
                  target: { checked: !props.checked }
                } as React.ChangeEvent<HTMLInputElement>;
                props.onChange(event);
              }
            }}
          >
            <span
              className={cn(
                'inline-block h-5 w-5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform shadow-sm',
                props.checked ? 'translate-x-7 sm:translate-x-6' : 'translate-x-1'
              )}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col min-w-0">
            {label && (
              <label className="text-sm sm:text-sm font-medium text-gray-900 cursor-pointer leading-tight">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-gray-500 leading-tight mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
