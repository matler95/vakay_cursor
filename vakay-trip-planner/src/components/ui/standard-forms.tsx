import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { Checkbox } from './checkbox';

// Standardized Form Field Component
interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  description, 
  error, 
  required, 
  children, 
  className 
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

// Standardized Text Input
interface StandardInputProps extends React.ComponentProps<typeof Input> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const StandardInput = forwardRef<HTMLInputElement, StandardInputProps>(
  ({ label, description, error, required, className, ...props }, ref) => {
    return (
      <FormField 
        label={label} 
        description={description} 
        error={error} 
        required={required}
      >
        <Input 
          ref={ref}
          className={cn(
            'h-10 transition-colors focus:ring-2 focus:ring-primary/20',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
      </FormField>
    );
  }
);
StandardInput.displayName = 'StandardInput';

// Standardized Select Input
interface StandardSelectProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function StandardSelect({ 
  label, 
  description, 
  error, 
  required, 
  placeholder, 
  value, 
  onValueChange, 
  children, 
  className 
}: StandardSelectProps) {
  return (
    <FormField 
      label={label} 
      description={description} 
      error={error} 
      required={required}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(
          'h-10 transition-colors focus:ring-2 focus:ring-primary/20',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
          className
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </FormField>
  );
}

// Standardized Textarea
interface StandardTextareaProps extends React.ComponentProps<typeof Textarea> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const StandardTextarea = forwardRef<HTMLTextAreaElement, StandardTextareaProps>(
  ({ label, description, error, required, className, ...props }, ref) => {
    return (
      <FormField 
        label={label} 
        description={description} 
        error={error} 
        required={required}
      >
        <Textarea 
          ref={ref}
          className={cn(
            'min-h-[80px] transition-colors focus:ring-2 focus:ring-primary/20',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
      </FormField>
    );
  }
);
StandardTextarea.displayName = 'StandardTextarea';

// Standardized Checkbox
interface StandardCheckboxProps extends React.ComponentProps<typeof Checkbox> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const StandardCheckbox = forwardRef<HTMLButtonElement, StandardCheckboxProps>(
  ({ label, description, error, required, className, ...props }, ref) => {
    return (
      <FormField 
        label="" 
        description={description} 
        error={error} 
        required={required}
      >
        <div className="flex items-start space-x-3">
          <Checkbox 
            ref={ref}
            className={cn(
              'mt-1 transition-colors focus:ring-2 focus:ring-primary/20',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-700">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        </div>
      </FormField>
    );
  }
);
StandardCheckbox.displayName = 'StandardCheckbox';

// Standardized Date Input
interface StandardDateInputProps extends Omit<StandardInputProps, 'type'> {
  min?: string;
  max?: string;
}

export const StandardDateInput = forwardRef<HTMLInputElement, StandardDateInputProps>(
  ({ min, max, ...props }, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="date"
        min={min}
        max={max}
        {...props}
      />
    );
  }
);
StandardDateInput.displayName = 'StandardDateInput';

// Standardized Time Input
interface StandardTimeInputProps extends Omit<StandardInputProps, 'type'> {
  min?: string;
  max?: string;
}

export const StandardTimeInput = forwardRef<HTMLInputElement, StandardTimeInputProps>(
  ({ min, max, ...props }, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="time"
        min={min}
        max={max}
        {...props}
      />
    );
  }
);
StandardTimeInput.displayName = 'StandardTimeInput';

// Standardized Number Input
interface StandardNumberInputProps extends Omit<StandardInputProps, 'type'> {
  min?: number;
  max?: number;
  step?: number;
}

export const StandardNumberInput = forwardRef<HTMLInputElement, StandardNumberInputProps>(
  ({ min, max, step, ...props }, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="number"
        min={min}
        max={max}
        step={step}
        {...props}
      />
    );
  }
);
StandardNumberInput.displayName = 'StandardNumberInput';

// Standardized Email Input
export const StandardEmailInput = forwardRef<HTMLInputElement, StandardInputProps>(
  (props, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="email"
        autoComplete="email"
        {...props}
      />
    );
  }
);
StandardEmailInput.displayName = 'StandardEmailInput';

// Standardized Password Input
export const StandardPasswordInput = forwardRef<HTMLInputElement, StandardInputProps>(
  (props, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="password"
        autoComplete="current-password"
        {...props}
      />
    );
  }
);
StandardPasswordInput.displayName = 'StandardPasswordInput';

// Standardized Search Input
export const StandardSearchInput = forwardRef<HTMLInputElement, StandardInputProps>(
  (props, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="search"
        autoComplete="off"
        {...props}
      />
    );
  }
);
StandardSearchInput.displayName = 'StandardSearchInput';

// Standardized URL Input
export const StandardUrlInput = forwardRef<HTMLInputElement, StandardInputProps>(
  (props, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="url"
        autoComplete="url"
        {...props}
      />
    );
  }
);
StandardUrlInput.displayName = 'StandardUrlInput';

// Standardized Phone Input
export const StandardPhoneInput = forwardRef<HTMLInputElement, StandardInputProps>(
  (props, ref) => {
    return (
      <StandardInput 
        ref={ref}
        type="tel"
        autoComplete="tel"
        {...props}
      />
    );
  }
);
StandardPhoneInput.displayName = 'StandardPhoneInput';

// Form Section Component
interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
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

// Form Row Component
interface FormRowProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 'default';
}

export function FormRow({ children, className, cols = 'default' }: FormRowProps) {
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

// Form Actions Component
interface FormActionsProps {
  children: ReactNode;
  className?: string;
  position?: 'left' | 'center' | 'right' | 'between';
}

export function FormActions({ children, className, position = 'right' }: FormActionsProps) {
  const positionClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn(
      'flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-gray-200',
      positionClasses[position],
      className
    )}>
      {children}
    </div>
  );
}
