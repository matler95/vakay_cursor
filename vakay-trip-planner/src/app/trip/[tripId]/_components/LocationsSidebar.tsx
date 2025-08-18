'use client';

import { useState, useMemo } from 'react';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Star, Clock, Plus, Search, Filter, Edit, Trash2, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

type Location = Database['public']['Tables']['locations']['Row'];
type ItineraryDay = Database['public']['Tables']['itinerary_days']['Row'];

interface LocationsSidebarProps {
  locations: Location[];
  itineraryDays: ItineraryDay[];
  tripId: string;
  onLocationSelect?: (location: Location) => void;
  onEditLocation?: (location: Location) => void;
  onDeleteLocation?: (locationId: number) => void;
  onCreateLocation?: () => void;
  className?: string;
}

interface LocationUsage {
  locationId: number;
  count: number;
  lastUsed: string;
  days: string[];
}

export function LocationsSidebar({
  locations,
  itineraryDays,
  tripId,
  onLocationSelect,
  onEditLocation,
  onDeleteLocation,
  onCreateLocation,
  className
}: LocationsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'used' | 'unused' | 'favorites'>('all');
  const [showUnused, setShowUnused] = useState(true);

  // Calculate location usage statistics
  const locationUsage = useMemo(() => {
    const usage = new Map<number, LocationUsage>();
    
    itineraryDays.forEach(day => {
      if (day.location_1_id) {
        const existing = usage.get(day.location_1_id);
        if (existing) {
          existing.count++;
          existing.days.push(day.date);
          if (day.date > existing.lastUsed) {
            existing.lastUsed = day.date;
          }
        } else {
          usage.set(day.location_1_id, {
            locationId: day.location_1_id,
            count: 1,
            lastUsed: day.date,
            days: [day.date]
          });
        }
      }
      
      if (day.location_2_id) {
        const existing = usage.get(day.location_2_id);
        if (existing) {
          existing.count++;
          existing.days.push(day.date);
          if (day.date > existing.lastUsed) {
            existing.lastUsed = day.date;
          }
        } else {
          usage.set(day.location_2_id, {
            locationId: day.location_2_id,
            count: 1,
            lastUsed: day.date,
            days: [day.date]
          });
        }
      }
    });
    
    return usage;
  }, [itineraryDays]);

  // Filter locations based on search and filter criteria
  const filteredLocations = useMemo(() => {
    let filtered = locations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (location.description && location.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'used':
        filtered = filtered.filter(location => locationUsage.has(location.id));
        break;
      case 'unused':
        filtered = filtered.filter(location => !locationUsage.has(location.id));
        break;
      case 'favorites':
        // For now, we'll use a simple heuristic - locations used more than once
        filtered = filtered.filter(location => {
          const usage = locationUsage.get(location.id);
          return usage && usage.count > 1;
        });
        break;
      default:
        break;
    }

    // Sort by usage count (most used first), then by name
    filtered.sort((a, b) => {
      const usageA = locationUsage.get(a.id);
      const usageB = locationUsage.get(b.id);
      
      if (usageA && usageB) {
        if (usageA.count !== usageB.count) {
          return usageB.count - usageA.count;
        }
        return usageB.lastUsed.localeCompare(usageA.lastUsed);
      } else if (usageA && !usageB) {
        return -1;
      } else if (!usageA && usageB) {
        return 1;
      }
      
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [locations, searchQuery, filterType, locationUsage]);

  const getUsageCount = (locationId: number) => {
    return locationUsage.get(locationId)?.count || 0;
  };

  const getLastUsed = (locationId: number) => {
    const usage = locationUsage.get(locationId);
    if (!usage) return null;
    
    const date = new Date(usage.lastUsed);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFilterIcon = () => {
    switch (filterType) {
      case 'used':
        return <MapPin className="h-4 w-4" />;
      case 'unused':
        return <Clock className="h-4 w-4" />;
      case 'favorites':
        return <Heart className="h-4 w-4" />;
      default:
        return <Filter className="h-4 w-4" />;
    }
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'used':
        return 'Used';
      case 'unused':
        return 'Unused';
      case 'favorites':
        return 'Favorites';
      default:
        return 'All';
    }
  };

  return (
    <div className={cn("bg-white border-l border-gray-200 p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
        {onCreateLocation && (
          <Button
            onClick={onCreateLocation}
            size="sm"
            className="h-8 px-3"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search locations..."
          className="pl-10"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All' },
          { key: 'used', label: 'Used' },
          { key: 'unused', label: 'Unused' },
          { key: 'favorites', label: 'Favorites' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterType(filter.key as any)}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              filterType === filter.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Location Count */}
      <div className="text-sm text-gray-500 text-center">
        {filteredLocations.length} of {locations.length} locations
      </div>

      {/* Locations List */}
      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {filteredLocations.map((location) => {
          const usageCount = getUsageCount(location.id);
          const lastUsed = getLastUsed(location.id);
          const isUsed = usageCount > 0;
          
          return (
            <div
              key={location.id}
              className={cn(
                "group p-3 rounded-lg border transition-all cursor-pointer",
                isUsed
                  ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
              onClick={() => onLocationSelect?.(location)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" 
                      style={{ backgroundColor: location.color }}
                    />
                    <span className="font-medium text-gray-900 truncate">
                      {location.name}
                    </span>
                    {usageCount > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {usageCount}×
                      </Badge>
                    )}
                  </div>
                  
                  {location.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {location.description}
                    </p>
                  )}
                  
                  {isUsed && lastUsed && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last used {lastUsed}</span>
                    </div>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEditLocation && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditLocation(location);
                            }}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit location</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {onDeleteLocation && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLocation(location.id);
                            }}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete location</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredLocations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            {searchQuery 
              ? 'No locations match your search'
              : filterType === 'used' 
                ? 'No locations have been used yet'
                : filterType === 'unused'
                  ? 'All locations are being used'
                  : filterType === 'favorites'
                    ? 'No favorite locations yet'
                    : 'No locations found'
            }
          </p>
        </div>
      )}
    </div>
  );
}
