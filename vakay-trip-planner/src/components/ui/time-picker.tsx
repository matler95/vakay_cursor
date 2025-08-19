'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string; // Format: "HH:MM" (24-hour format)
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  use24Hour?: boolean; // Default true for 24-hour format
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({
    value = '',
    onChange,
    placeholder = 'Select time',
    disabled = false,
    error,
    label,
    required = false,
    name,
    id,
    className,
    use24Hour = true,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
    
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const timePickerRef = useRef<HTMLDivElement>(null);

    // Initialize time from value
    useEffect(() => {
      if (value && value.trim()) {
        const [hours, minutes] = value.split(':');
        const hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);
        
        if (!isNaN(hour) && !isNaN(minute)) {
          if (use24Hour) {
            setSelectedHour(hour);
            setSelectedMinute(minute);
          } else {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            setSelectedHour(displayHour);
            setSelectedMinute(minute);
            setSelectedPeriod(period);
          }
        }
      }
    }, [value, use24Hour]);

    // Format time for display
    const formatTime = (hour: number, minute: number, period?: 'AM' | 'PM') => {
      if (use24Hour) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      } else {
        return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
      }
    };

    // Convert display time to 24-hour format for value
    const convertTo24Hour = (hour: number, minute: number, period?: 'AM' | 'PM') => {
      if (use24Hour) {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      } else {
        let hour24 = hour;
        if (period === 'AM' && hour === 12) hour24 = 0;
        if (period === 'PM' && hour !== 12) hour24 = hour + 12;
        return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }
    };

    // Handle time selection
    const handleTimeSelect = (hour: number, minute: number, period?: 'AM' | 'PM') => {
      setSelectedHour(hour);
      setSelectedMinute(minute);
      if (!use24Hour && period) {
        setSelectedPeriod(period);
      }

      const timeValue = convertTo24Hour(hour, minute, period);
      const displayValue = formatTime(hour, minute, period);
      
      setInputValue(displayValue);
      onChange?.(timeValue);
      setIsOpen(false);
    };

    // Handle input change (manual typing)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      
      // Try to parse the input
      if (use24Hour) {
        const timeRegex = /^(\d{1,2}):(\d{2})$/;
        const match = newValue.match(timeRegex);
        if (match) {
          const hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            onChange?.(newValue);
          }
        }
      } else {
        const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
        const match = newValue.match(timeRegex);
        if (match) {
          const hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          const period = match[3].toUpperCase() as 'AM' | 'PM';
          if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
            const timeValue = convertTo24Hour(hour, minute, period);
            onChange?.(timeValue);
          }
        }
      }
    };

    const handleInputBlur = () => {
      // Revert to last valid value if input is invalid
      if (value !== inputValue) {
        setInputValue(value);
      }
    };

    const handleTimePickerOpen = () => {
      if (!disabled) {
        setIsOpen(true);
      }
    };

    // Close time picker when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Generate hour options
    const hourOptions = use24Hour 
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: 12 }, (_, i) => i + 1);

    // Generate minute options (0-59)
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

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
            onFocus={handleTimePickerOpen}
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
          
          {/* Clock Icon Button */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={handleTimePickerOpen}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              tabIndex={-1}
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Time Picker Dropdown */}
        {isOpen && (
          <div
            ref={timePickerRef}
            className="absolute z-50 top-full mt-2 bg-white rounded-md border border-gray-200 shadow-lg p-4 min-w-[280px]"
          >
            <div className="flex gap-4">
              {/* Hours */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  {use24Hour ? 'Hour' : 'Hour'}
                </label>
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {hourOptions.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => {
                        if (selectedMinute !== null) {
                          handleTimeSelect(hour, selectedMinute, selectedPeriod);
                        } else {
                          setSelectedHour(hour);
                        }
                      }}
                      className={cn(
                        "block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors",
                        selectedHour === hour && "bg-indigo-50 text-indigo-600 font-medium"
                      )}
                    >
                      {use24Hour ? hour.toString().padStart(2, '0') : hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Minute
                </label>
                <div className="max-h-32 overflow-y-auto border rounded-md">
                  {minuteOptions.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      onClick={() => {
                        if (selectedHour !== null) {
                          handleTimeSelect(selectedHour, minute, selectedPeriod);
                        } else {
                          setSelectedMinute(minute);
                        }
                      }}
                      className={cn(
                        "block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors",
                        selectedMinute === minute && "bg-indigo-50 text-indigo-600 font-medium"
                      )}
                    >
                      {minute.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM for 12-hour format */}
              {!use24Hour && (
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Period
                  </label>
                  <div className="border rounded-md">
                    {['AM', 'PM'].map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(period as 'AM' | 'PM');
                          if (selectedHour !== null && selectedMinute !== null) {
                            handleTimeSelect(selectedHour, selectedMinute, period as 'AM' | 'PM');
                          }
                        }}
                        className={cn(
                          "block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors",
                          selectedPeriod === period && "bg-indigo-50 text-indigo-600 font-medium"
                        )}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick select buttons */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Now', value: new Date() },
                  { label: '9:00 AM', hour: 9, minute: 0 },
                  { label: '12:00 PM', hour: 12, minute: 0 },
                  { label: '6:00 PM', hour: 18, minute: 0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                                             if ('value' in preset) {
                         const now = preset.value;
                         const hour = use24Hour ? now.getHours() : (now.getHours() > 12 ? now.getHours() - 12 : now.getHours() || 12);
                         const minute = now.getMinutes(); // Use actual current minutes
                         const period = now.getHours() >= 12 ? 'PM' : 'AM';
                         handleTimeSelect(hour, minute, use24Hour ? undefined : period);
                       } else {
                        const hour = use24Hour ? preset.hour : (preset.hour > 12 ? preset.hour - 12 : preset.hour);
                        const period = preset.hour >= 12 ? 'PM' : 'AM';
                        handleTimeSelect(hour, preset.minute, use24Hour ? undefined : period);
                      }
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

TimePicker.displayName = 'TimePicker';
