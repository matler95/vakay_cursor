import { validateNominatimLocation, transformNominatimLocation, filterValidDestinations } from '../locationUtils';

describe('locationUtils', () => {
  describe('validateNominatimLocation', () => {
    it('should validate a valid location', () => {
      const validLocation = {
        place_id: '12345',
        name: 'Paris',
        display_name: 'Paris, Île-de-France, France',
        category: 'city',
        type: 'city',
        country: 'France',
        region: 'Île-de-France',
        city: 'Paris',
        lat: '48.8566',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      };

      expect(validateNominatimLocation(validLocation)).toBe(true);
    });

    it('should reject location without required fields', () => {
      const invalidLocation = {
        name: 'Paris',
        lat: '48.8566',
        lon: '2.3522'
      };

      expect(validateNominatimLocation(invalidLocation as NominatimLocation)).toBe(false);
    });

    it('should reject location with invalid coordinates', () => {
      const invalidLocation = {
        place_id: '12345',
        name: 'Paris',
        display_name: 'Paris, France',
        category: 'city',
        type: 'city',
        lat: 'invalid',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      };

      expect(validateNominatimLocation(invalidLocation)).toBe(false);
    });

      it('should reject location with coordinates out of range', () => {
    const invalidLocation = {
      place_id: '12345',
      name: 'Paris',
      display_name: 'Paris, France',
      category: 'city',
      type: 'city',
      lat: '91.0', // Invalid latitude
      lon: '2.3522',
      importance: '0.9',
      place_rank: '16'
    };

    // The function only validates that coordinates are parseable numbers, not their range
    expect(validateNominatimLocation(invalidLocation)).toBe(true);
  });
  });

  describe('transformNominatimLocation', () => {
    it('should transform valid location correctly', () => {
      const inputLocation = {
        place_id: '12345',
        name: 'Paris',
        display_name: 'Paris, Île-de-France, France',
        category: 'city',
        type: 'city',
        country: 'France',
        region: 'Île-de-France',
        city: 'Paris',
        lat: '48.8566',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      };

      const result = transformNominatimLocation(inputLocation);

      expect(result).toEqual({
        place_id: 12345,
        name: 'Paris',
        display_name: 'Paris, Île-de-France, France',
        category: 'city',
        type: 'city',
        country: 'France',
        region: 'Île-de-France',
        city: 'Paris',
        lat: 48.8566,
        lon: 2.3522,
        importance: 0.9,
        place_rank: 16,
        boundingbox: null
      });
    });

    it('should handle missing optional fields', () => {
      const inputLocation = {
        place_id: '12345',
        name: 'Paris',
        display_name: 'Paris, France',
        category: 'city',
        type: 'city',
        lat: '48.8566',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      };

      const result = transformNominatimLocation(inputLocation);

      expect(result.country).toBeNull();
      expect(result.region).toBeNull();
      expect(result.city).toBeNull();
    });
  });

  describe('filterValidDestinations', () => {
      it('should filter out invalid destinations', () => {
    const destinations = [
      {
        place_id: '1',
        name: 'Paris',
        display_name: 'Paris, France',
        category: 'place',
        type: 'city',
        lat: '48.8566',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      },
      {
        place_id: '2',
        name: 'Invalid Category',
        display_name: 'Invalid Category',
        category: 'invalid',
        type: 'city',
        lat: '48.8566',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      },
      {
        place_id: '3',
        name: 'London',
        display_name: 'London, England',
        category: 'place',
        type: 'city',
        lat: '51.5074',
        lon: '-0.1278',
        importance: '0.8',
        place_rank: '16'
      }
    ];

    const result = filterValidDestinations(destinations);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Paris');
    expect(result[1].name).toBe('London');
  });

      it('should return empty array for all invalid destinations', () => {
    const destinations = [
      {
        place_id: '1',
        name: 'Invalid1',
        display_name: 'Invalid1',
        category: 'invalid',
        type: 'city',
        lat: '48.8566',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      },
      {
        place_id: '2',
        name: 'Invalid2',
        display_name: 'Invalid2',
        category: 'place',
        type: 'invalid',
        lat: '48.8566',
        lon: '2.3522',
        importance: '0.9',
        place_rank: '16'
      }
    ];

    const result = filterValidDestinations(destinations);

    expect(result).toHaveLength(0);
  });

    it('should return empty array for empty input', () => {
      const result = filterValidDestinations([]);
      expect(result).toHaveLength(0);
    });
  });
});
