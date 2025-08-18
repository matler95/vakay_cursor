import { AutocompleteOption } from '@/components/ui/autocomplete';

interface NominatimLocation {
  place_id: string | number;
  name: string;
  display_name: string;
  category: string;
  type: string;
  country?: string;
  region?: string;
  city?: string;
  lat: string | number;
  lon: string | number;
  importance: string | number;
  place_rank: string | number;
  boundingbox?: string[];
}

/**
 * Validates if a location object matches the expected format from Nominatim
 */
export function validateNominatimLocation(location: NominatimLocation): boolean {
  const requiredFields = ['place_id', 'name', 'display_name', 'category', 'type', 'lat', 'lon', 'importance', 'place_rank'] as const;
  
  return requiredFields.every(field => {
    const value = location[field];
    if (field === 'lat' || field === 'lon') {
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)));
    }
    if (field === 'importance') {
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)));
    }
    if (field === 'place_rank') {
      return typeof value === 'number' || (typeof value === 'string' && !isNaN(parseInt(value)));
    }
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Transforms a Nominatim location object to our internal format
 */
export function transformNominatimLocation(location: NominatimLocation): AutocompleteOption {
  return {
    place_id: parseInt(String(location.place_id)),
    name: location.name,
    display_name: location.display_name,
    category: location.category,
    type: location.type,
    country: location.country || null,
    region: location.region || null,
    city: location.city || null,
    lat: parseFloat(String(location.lat)),
    lon: parseFloat(String(location.lon)),
    importance: parseFloat(String(location.importance)),
    place_rank: parseInt(String(location.place_rank)),
    boundingbox: location.boundingbox || null
  };
}

/**
 * Filters locations based on category and type to exclude unwanted items
 */
export function filterValidDestinations(locations: NominatimLocation[]): NominatimLocation[] {
  const validCategories = ['tourism', 'place'];
  const validTypes = ['attraction', 'city', 'island', 'country', 'region', 'state'];
  
  return locations.filter(location => {
    // Must have valid category and type
    if (!validCategories.includes(location.category) || !validTypes.includes(location.type)) {
      return false;
    }
    
    // Exclude specific unwanted types
    const excludedTypes = ['museum', 'monument', 'memorial', 'statue', 'building'];
    if (excludedTypes.includes(location.type)) {
      return false;
    }
    
    // Must have a minimum importance score (adjust as needed)
    const importance = parseFloat(String(location.importance));
    if (isNaN(importance) || importance < 0.1) {
      return false;
    }
    
    return true;
  });
}

/**
 * Sorts locations by importance and relevance
 */
export function sortDestinationsByRelevance(locations: AutocompleteOption[]): AutocompleteOption[] {
  return locations.sort((a, b) => {
    // Primary sort by importance
    if (Math.abs(a.importance - b.importance) > 0.1) {
      return b.importance - a.importance;
    }
    
    // Secondary sort by place rank (lower is better)
    if (a.place_rank !== b.place_rank) {
      return a.place_rank - b.place_rank;
    }
    
    // Tertiary sort by name length (shorter names first)
    return a.name.length - b.name.length;
  });
}

/**
 * Groups locations by country for better organization
 */
export function groupLocationsByCountry(locations: AutocompleteOption[]): Record<string, AutocompleteOption[]> {
  return locations.reduce((groups, location) => {
    const country = location.country || 'Unknown';
    if (!groups[country]) {
      groups[country] = [];
    }
    groups[country].push(location);
    return groups;
  }, {} as Record<string, AutocompleteOption[]>);
}

/**
 * Creates a search-friendly display name
 */
export function createSearchDisplayName(location: AutocompleteOption): string {
  const parts = [location.name];
  
  if (location.city && location.city !== location.name) {
    parts.push(location.city);
  }
  
  if (location.region && location.region !== location.city) {
    parts.push(location.region);
  }
  
  if (location.country) {
    parts.push(location.country);
  }
  
  return parts.join(', ');
}

/**
 * Validates coordinates are within reasonable bounds
 */
export function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Calculates distance between two coordinates (Haversine formula)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
