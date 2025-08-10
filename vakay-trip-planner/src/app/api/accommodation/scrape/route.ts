import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface StructuredAddress {
  name?: string;
  display_name?: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
}

// Lightweight in-memory cache for repeated URLs in a warm runtime
// Avoid unbounded growth
const CACHE = new Map<string, { name?: string; address_line?: string; latitude?: number; longitude?: number; cachedAt: number }>();
const MAX_CACHE = 100;

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { ...init, cache: 'no-store', redirect: 'follow' });
      if (res.ok) return res;
      lastErr = new Error(`status ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  throw lastErr;
}

function extractFromJsonLd($: cheerio.CheerioAPI): { name?: string; addressLine?: string } | null {
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    try {
      const text = $(el).contents().text();
      if (!text) continue;
      const json = JSON.parse(text);
      const candidates = Array.isArray(json) ? json : [json];
      for (const c of candidates) {
        const obj = c && typeof c === 'object' ? c : null;
        if (!obj) continue;
        const type = (obj['@type'] || obj['type'] || '').toString().toLowerCase();
        if (type.includes('hotel') || type.includes('lodging') || type.includes('place') || obj['address']) {
          const name: string | undefined = obj['name'];
          const addr = obj['address'];
          if (addr && typeof addr === 'object') {
            const street = [addr['houseNumber'], addr['streetAddress'], addr['street'], addr['road']].find(Boolean) as string | undefined;
            const city = addr['addressLocality'] || addr['city'] || addr['town'] || addr['village'];
            const postcode = addr['postalCode'] || addr['postcode'];
            const country = addr['addressCountry'] || addr['country'];
            const addressLine = [street, city, postcode, country].filter(Boolean).join(', ');
            return { name, addressLine: addressLine || undefined };
          }
          if (obj['geo'] && obj['address']) {
            const addressLine = typeof obj['address'] === 'string' ? obj['address'] : undefined;
            if (addressLine || name) return { name, addressLine };
          }
        }
      }
    } catch {}
  }
  return null;
}

function parseNameCity(rawTitle: string, rawDesc: string): { name?: string; city?: string } {
  const title = (rawTitle || '').replace(/\s+/g, ' ').trim();
  const parts = title.split(/\s*[–—\-|]\s*/);
  const name = parts[0]?.trim();
  const cityCandidate = parts[1]?.trim();

  let city: string | undefined = cityCandidate;
  const desc = (rawDesc || '').replace(/\s+/g, ' ');
  const inMatch = desc.match(/\bin\s+([^,\.\-]+)/i);
  if (inMatch && inMatch[1]) {
    const candidate = inMatch[1].trim();
    if (!city || candidate.length < 40) city = candidate;
  }
  return { name, city };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
    }

    const hit = CACHE.get(url);
    if (hit) {
      return NextResponse.json({ name: hit.name || null, address_line: hit.address_line || null, latitude: hit.latitude, longitude: hit.longitude }, { status: 200 });
    }

    const resp = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = await resp.text();

    const $ = cheerio.load(html);
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const metaTitle = $('meta[name="title"]').attr('content');
    const docTitle = $('title').text();
    const rawTitle = (ogTitle || metaTitle || docTitle || '').trim();

    const ogDesc = $('meta[property="og:description"]').attr('content');
    const metaDesc = $('meta[name="description"]').attr('content');
    const rawDesc = (ogDesc || metaDesc || '').trim();

    const jsonLd = extractFromJsonLd($);
    if (jsonLd && (jsonLd.name || jsonLd.addressLine)) {
      const payload = { name: jsonLd.name || rawTitle || null, address_line: jsonLd.addressLine || null };
      if (CACHE.size >= MAX_CACHE) CACHE.delete(CACHE.keys().next().value);
      CACHE.set(url, { ...payload, cachedAt: Date.now() });
      return NextResponse.json(payload, { status: 200 });
    }

    if (!rawTitle && !rawDesc) {
      return NextResponse.json({ name: null, address: null }, { status: 200 });
    }

    const { name: parsedName, city: parsedCity } = parseNameCity(rawTitle, rawDesc);
    const queries = Array.from(new Set([
      parsedName && parsedCity ? `${parsedName} ${parsedCity}` : undefined,
      parsedName || undefined,
      rawTitle || undefined,
      rawDesc || undefined,
    ].filter(Boolean) as string[]));

    for (const q of queries) {
      const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
      nominatimUrl.searchParams.append('q', q);
      nominatimUrl.searchParams.append('format', 'jsonv2');
      nominatimUrl.searchParams.append('addressdetails', '1');
      nominatimUrl.searchParams.append('limit', '1');

      try {
        const osmResponse = await fetchWithRetry(nominatimUrl.toString(), {
          headers: { 'User-Agent': 'VakayTripPlanner/1.0 (contact: example@example.com)' },
        });
        const osmData = (await osmResponse.json()) as any[];
        if (osmData && osmData.length > 0) {
          const result = osmData[0];
          const address = result.address || {};
          const city = address.city || address.town || address.village || address.hamlet;
          const street = address.house_number && address.road
            ? `${address.house_number} ${address.road}`
            : (address.road || address.pedestrian || address.path || address.neighbourhood || undefined);
          const postcode = address.postcode;
          const country = address.country;
          let addressLine = [street, city, postcode, country].filter(Boolean).join(', ');
          if (!addressLine) {
            const disp = (result.display_name as string) || '';
            const idx = disp.indexOf(',');
            addressLine = idx > -1 ? disp.slice(idx + 1).trim() : disp;
          }
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          const payload: StructuredAddress = { name: result.name || parsedName || rawTitle || null, address_line: addressLine, latitude: isNaN(lat) ? undefined : lat, longitude: isNaN(lon) ? undefined : lon };
          if (CACHE.size >= MAX_CACHE) CACHE.delete(CACHE.keys().next().value);
          CACHE.set(url, { ...payload, cachedAt: Date.now() });
          return NextResponse.json(payload, { status: 200 });
        }
      } catch {
        // try next query
      }
    }

    const payload = { name: parsedName || rawTitle || null, address: null } as any;
    if (CACHE.size >= MAX_CACHE) CACHE.delete(CACHE.keys().next().value);
    CACHE.set(url, { name: payload.name, address_line: null, cachedAt: Date.now() });
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    return NextResponse.json({ name: null, address: null }, { status: 200 });
  }
}
