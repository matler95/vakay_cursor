'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Search, MapPin, Globe, Mountain, Building2, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutocompleteOption {
  place_id: number;
  name: string;
  display_name: string;
  category: string;
  type: string;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  lat: number;
  lon: number;
  importance: number;
  place_rank: number;
  boundingbox?: string[] | null;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minQueryLength?: number;
  debounceMs?: number;
  maxResults?: number;
}

const getCategoryIcon = (category: string, type: string) => {
  if (category === 'tourism') {
    return <Mountain className="h-4 w-4 text-blue-600" />;
  }
  if (category === 'place') {
    if (type === 'city') return <Building2 className="h-4 w-4 text-gray-600" />;
    if (type === 'island') return <TreePine className="h-4 w-4 text-green-600" />;
    return <Globe className="h-4 w-4 text-purple-600" />;
  }
  return <MapPin className="h-4 w-4 text-gray-500" />;
};

const getCategoryLabel = (category: string, type: string) => {
  if (category === 'tourism') {
    return type === 'attraction' ? 'Tourist Attraction' : type;
  }
  if (category === 'place') {
    if (type === 'city') return 'City';
    if (type === 'island') return 'Island';
    if (type === 'country') return 'Country';
    return type;
  }
  return category;
};

export function Autocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search destinations...",
  className,
  disabled = false,
  minQueryLength = 2,
  debounceMs = 300,
  maxResults = 10
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AutocompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (value.length >= minQueryLength) {
      debounceTimeoutRef.current = setTimeout(async () => {
        if (value.length < minQueryLength) {
          setOptions([]);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch(`/api/locations/search?q=${encodeURIComponent(value)}&limit=${maxResults}`);
          
          if (!response.ok) {
            throw new Error('Failed to search destinations');
          }

          const result = await response.json();
          
          if (result.success) {
            setOptions(result.data);
          } else {
            throw new Error(result.error || 'Search failed');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setOptions([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    } else {
      setOptions([]);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, debounceMs, minQueryLength, maxResults]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (option: AutocompleteOption) => {
    onSelect(option);
    onChange(option.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setOptions([]);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (value.length >= minQueryLength && options.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow click events on dropdown
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-4"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Searching destinations...</p>
            </div>
          )}

          {error && (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && options.length === 0 && value.length >= minQueryLength && (
            <div className="p-4 text-center text-gray-500">
              <p>No destinations found</p>
            </div>
          )}

          {!isLoading && !error && options.length > 0 && (
            <div className="py-2">
              {options.map((option, index) => (
                <button
                  key={option.place_id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors",
                    highlightedIndex === index && "bg-blue-50 border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getCategoryIcon(option.category, option.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {option.name}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getCategoryLabel(option.category, option.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {option.display_name}
                      </p>
                      {option.country && (
                        <p className="text-xs text-gray-400 mt-1">
                          {option.country}
                          {option.region && `, ${option.region}`}
                          {option.city && `, ${option.city}`}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
