import { NextRequest } from 'next/server';
import { POST } from '../locations/search/route';

// Mock the Supabase server client
jest.mock('@/lib/supabaseServer', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 1,
                  name: 'Test Location',
                  display_name: 'Test Location, Test City',
                  category: 'city',
                  type: 'city',
                  country: 'Test Country',
                  region: 'Test Region',
                  city: 'Test City',
                  lat: 40.7128,
                  lon: -74.0060,
                  importance: 0.8,
                  place_rank: 10,
                  boundingbox: ['40.0', '41.0', '-75.0', '-74.0']
                }
              ],
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}));

describe('POST /api/locations/search', () => {
  it('should search locations successfully', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/locations/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'test',
        limit: 5
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('should handle empty search query', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/locations/search', {
      method: 'POST',
      body: JSON.stringify({
        query: '',
        limit: 5
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should handle search with limit parameter', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/locations/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'test',
        limit: 3
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(3);
  });

  it('should handle malformed request body', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/locations/search', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });

  it('should handle missing query parameter', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/locations/search', {
      method: 'POST',
      body: JSON.stringify({
        limit: 5
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
  });

  it('should return location data with correct structure', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/locations/search', {
      method: 'POST',
      body: JSON.stringify({
        query: 'test',
        limit: 1
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('display_name');
    expect(data[0]).toHaveProperty('category');
    expect(data[0]).toHaveProperty('type');
    expect(data[0]).toHaveProperty('lat');
    expect(data[0]).toHaveProperty('lon');
  });
});
