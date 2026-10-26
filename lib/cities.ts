export type CitySuggestion = {
  id: number;
  /** Value saved to the location preference, e.g. "Greenport, New York" */
  label: string;
  /** Secondary line, e.g. "Village · New York, US" */
  detail: string;
};

type GeocodingResult = {
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

// Open-Meteo's geocoder is free, needs no API key and tolerates small typos.
export async function searchCities(query: string, signal?: AbortSignal): Promise<CitySuggestion[]> {
  const params = new URLSearchParams({ name: query, count: String(MAX_RESULTS), language: 'en', format: 'json' });
  const response = await fetch(`${ENDPOINT}?${params}`, { signal });
  if (!response.ok) return [];
  const data: { results?: GeocodingResult[] } = await response.json();

  return (data.results ?? []).map((result) => {
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
