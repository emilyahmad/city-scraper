export type CitySuggestion = {
  id: number;
  /** Value saved to the location preference, e.g. "Greenport, New York" */
  label: string;
  /** Secondary line, e.g. "Village · New York, US" */
  detail: string;
};

export type Coordinates = { latitude: number; longitude: number };

// Straight-line distance in miles
export function distanceMiles(a: Coordinates, b: Coordinates) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

type GeocodingResult = Coordinates & {
  id: number;
  name: string;
  admin1?: string;
  country_code?: string;
  feature_code?: string;
};

const FEATURE_LABELS: Record<string, string> = {
  PPLC: 'Capital',
  PPLA: 'City',
  PPLA2: 'City',
  PPLA3: 'Town',
  PPLA4: 'Town',
  PPL: 'City',
};

const ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const MAX_RESULTS = 4;

async function fetchResults(name: string, count: number, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({ name, count: String(count), language: 'en', format: 'json' });
  const response = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!response.ok) return [];
  const data: { results?: GeocodingResult[] } = await response.json();
  return data.results ?? [];
}

// Open-Meteo's geocoder is free, needs no API key and tolerates small typos.
export async function searchCities(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const results = await fetchResults(query, MAX_RESULTS, signal);

  return results.map((result) => {
    const region = result.admin1 ?? result.country_code ?? '';
    return {
      id: result.id,
      label: region ? `${result.name}, ${region}` : result.name,
      detail: [FEATURE_LABELS[result.feature_code ?? ''] ?? 'City', [result.admin1, result.country_code].filter(Boolean).join(', ')]
        .filter(Boolean)
        .join(' · '),
    };
  });
}

// Turns a saved location like "Greenport, New York" or "New York, NY" into coordinates.
// The geocoder only searches by name, so the part after the comma picks between same-named places.
export async function geocodeCity(label: string): Promise<Coordinates | null> {
  const [name, region = ''] = label.split(',').map((part) => part.trim());
  if (!name) return null;
  const results = await fetchResults(name, 10);
  const wanted = region.toLowerCase();
  const match = (wanted && results.find((result) => result.admin1?.toLowerCase() === wanted)) || results[0];
  return match ? { latitude: match.latitude, longitude: match.longitude } : null;
}
