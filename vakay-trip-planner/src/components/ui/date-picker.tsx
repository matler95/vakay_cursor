'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  error?: string;
  name?: string;
  id?: string;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Select date", 
    label,
    required = false,
    disabled = false,
    min,
    max,
    className,
    error,
    name,
    id
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(
      value && value.trim() ? new Date(value + 'T12:00:00') : null
    );
    const [currentMonth, setCurrentMonth] = useState<Date>(
      value && value.trim() ? new Date(value + 'T12:00:00') : new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0, 0)
    );
    const [inputValue, setInputValue] = useState(value || '');
    
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Update position when opening calendar
    const handleCalendarOpen = () => {
      setIsOpen(true);
      // No positioning calculation needed since we always use below
    };

    // Lock scroll when calendar is open (mobile experience)
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen]);

    // Close calendar when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update internal state when value prop changes
    useEffect(() => {
      if (value && value.trim()) {
        const date = new Date(value + 'T12:00:00');
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          setCurrentMonth(date);
          setInputValue(value);
        } else {
          // Invalid date, reset to defaults
          setSelectedDate(null);
          setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0, 0));
          setInputValue('');
        }
      } else {
        setSelectedDate(null);
        setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0, 0)); // Ensure currentMonth is always a valid date
        setInputValue('');
      }
    }, [value]);

    const formatDate = (date: Date): string => {
      // Fix timezone issue by using local date instead of UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date: Date): string => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      setInputValue(formatDate(date));
      setCurrentMonth(date);
      setIsOpen(false);
      
      if (onChange) {
        onChange(formatDate(date));
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setInputValue(inputValue);
      
      // Try to parse the input as a date
      if (inputValue) {
        const date = new Date(inputValue + 'T12:00:00');
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          if (onChange) {
            // Use the parsed date to avoid timezone issues
            onChange(formatDate(date));
          }
        }
      } else {
        setSelectedDate(null);
        if (onChange) {
          onChange('');
        }
      }
    };

    const handleInputBlur = () => {
      // Validate input on blur
      if (inputValue && !selectedDate) {
        setInputValue('');
        if (onChange) {
          onChange('');
        }
      }
    };

    const goToPreviousMonth = () => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1, 12, 0, 0, 0));
    };

    const goToNextMonth = () => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1, 12, 0, 0, 0));
    };

    const goToToday = () => {
      const today = new Date();
      // Set to noon to avoid timezone issues
      const todayNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
      setCurrentMonth(todayNoon);
      if (!selectedDate) {
        handleDateSelect(todayNoon);
      }
    };

    const clearDate = () => {
      setSelectedDate(null);
      setInputValue('');
      if (onChange) {
        onChange('');
      }
    };

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      // Convert Sunday (0) to 7, Monday (1) to 1, etc. to make Monday the first day
      let firstDayOfWeek = firstDay.getDay();
      firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek; // Sunday becomes 7
      firstDayOfWeek = firstDayOfWeek - 1; // Adjust to 0-based index for Monday start
      
      const days: (Date | null)[] = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
      }
      
      // Add all days in the month - create dates in local timezone
      for (let i = 1; i <= daysInMonth; i++) {
        // Create date at noon local time to avoid timezone edge cases
        const dayDate = new Date(year, month, i, 12, 0, 0, 0);
        days.push(dayDate);
      }
      
      return days;
    };

    const isDateDisabled = (date: Date | null): boolean => {
      if (!date) return true; // Null dates are considered disabled
      if (min) {
        const minDate = new Date(min);
        if (date < minDate) return true;
      }
      if (max) {
        const maxDate = new Date(max);
        if (date > maxDate) return true;
      }
      return false;
    };

    const isToday = (date: Date | null): boolean => {
      if (!date) return false;
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date | null): boolean => {
      if (!date || !selectedDate) return false;
      return date.toDateString() === selectedDate.toDateString();
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleCalendarOpen}
            placeholder={placeholder}
            disabled={disabled}
            name={name}
            id={id}
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
                             "border-input flex h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs",
              "transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
              "md:text-sm", // Match standard Input responsive font sizing
              "pr-12", // Add right padding to prevent text under buttons
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", // Match standard Input focus
              "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", // Match standard Input invalid state
              "focus:border-indigo-500 focus:ring-indigo-500 focus:ring-1", // Custom focus styling
              error && "border-red-300 focus:border-red-500 focus:ring-red-500"
            )}
          />
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {selectedDate && (
              <button
                type="button"
                onClick={clearDate}
                className="text-gray-400 hover:text-gray-600 mr-1.5"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleCalendarOpen}
              className="text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {/* Calendar Popup */}
        {isOpen && (
          <div 
            ref={calendarRef}
            className={cn(
              "absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4",
              "w-full max-w-80 min-w-72", // Responsive width
              "top-full mt-2", // Always below
              // Mobile-specific adjustments
              "sm:max-w-80 max-w-[calc(100vw-2rem)]"
            )}
            style={{
              // Ensure calendar doesn't go off-screen horizontally
              left: '0',
              right: '0',
              maxWidth: '100vw',
              minWidth: '280px',
              // Ensure calendar doesn't go off-screen vertically
              maxHeight: 'calc(90vh - 40px)', // Account for potential header space
              overflow: 'auto'
            }}
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded active:scale-95 transition-transform" // Larger touch target
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h3 className="text-sm font-semibold text-gray-900">{monthName}</h3>
              
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded active:scale-95 transition-transform" // Larger touch target
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Today Button */}
            <div className="mb-3">
              <button
                type="button"
                onClick={goToToday}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-2 rounded hover:bg-indigo-50 active:scale-95 transition-transform" // Larger touch target
              >
                Today
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-xs text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => date && handleDateSelect(date)}
                  disabled={!date || isDateDisabled(date)}
                  className={cn(
                    "h-10 w-10 text-sm rounded-md flex items-center justify-center", // Larger touch targets on mobile
                    "hover:bg-gray-100 disabled:hover:bg-transparent",
                    "disabled:text-gray-300 disabled:cursor-not-allowed",
                    "active:scale-95 transition-transform", // Touch feedback
                    isToday(date) && "bg-blue-50 text-blue-600 font-medium",
                    isSelected(date) && "bg-indigo-600 text-white hover:bg-indigo-700",
                    !date && "cursor-default"
                  )}
                >
                  {date ? date.getDate() : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
