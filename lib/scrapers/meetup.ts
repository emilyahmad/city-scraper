import { postJson } from '@/lib/scrapers/http';
import type { RawEvent, Scraper } from '@/lib/scrapers/types';

// Meetup's GraphQL API. Event search works without a token and returns venue coordinates.
const API = 'https://api.meetup.com/gql-ext';
const MAX_INTEREST_SEARCHES = 5;
const MAX_DESCRIPTION_LENGTH = 1200;
// The search needs some text; this broad word returns a general mix of nearby events
const GENERAL_QUERY = 'events';

const SEARCH = `
  query ($filter: EventSearchFilter!) {
    eventSearch(filter: $filter, first: 100) {
      edges {
        node {
          id
          title
          description
          eventUrl
          dateTime
          endTime
          venue { name city lat lon }
          featuredEventPhoto { highResUrl }
          group { name }
          feeSettings { amount }
        }
      }
    }
  }
`;

type MeetupEvent = {
  id: string;
  title: string;
  description: string | null;
  eventUrl: string;
  dateTime: string;
  endTime: string | null;
  venue: { name: string | null; city: string | null; lat: number | null; lon: number | null } | null;
  featuredEventPhoto: { highResUrl: string } | null;
  group: { name: string } | null;
  feeSettings: { amount: number } | null;
};

type SearchResponse = { data?: { eventSearch: { edges: { node: MeetupEvent }[] } }; errors?: { message: string }[] };

function toRawEvent(event: MeetupEvent): RawEvent {
  const description = event.description ?? '';
  return {
    source: 'meetup',
    sourceId: event.id,
    title: event.title,
    description: description.length > MAX_DESCRIPTION_LENGTH ? `${description.slice(0, MAX_DESCRIPTION_LENGTH)}…` : description,
    startAt: event.dateTime,
    endAt: event.endTime,
    venue: event.venue?.name ?? '',
    neighborhood: event.venue?.city ?? '',
    // Meetup uses 0,0 for venues it couldn't place
    latitude: event.venue?.lat || null,
    longitude: event.venue?.lon || null,
    imageUrl: event.featuredEventPhoto?.highResUrl ?? null,
    // No fee settings means the event is free
    price: event.feeSettings ? event.feeSettings.amount : 0,
    url: event.eventUrl,
    host: event.group?.name ?? '',
    sourceCategories: [],
  };
}

export const fetchMeetup: Scraper = async ({ latitude, longitude, radiusMiles, interests, from, to }) => {
  const search = async (query: string) => {
    const filter = {
      query,
      lat: latitude,
      lon: longitude,
      radius: Math.max(1, Math.ceil(radiusMiles)),
      eventType: 'PHYSICAL',
      startDateRange: from.toISOString(),
      endDateRange: to.toISOString(),
    };
    const response = await postJson<SearchResponse>(API, { query: SEARCH, variables: { filter } });
    if (!response.data) throw new Error(response.errors?.[0]?.message ?? 'Meetup search failed');
    return response.data.eventSearch.edges.map((edge) => edge.node);
  };

  const queries = [GENERAL_QUERY, ...interests.slice(0, MAX_INTEREST_SEARCHES)];
  const results = await Promise.allSettled(queries.map(search));
  if (results.every((result) => result.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;

  // The same event comes back from several searches
  const byId = new Map<string, MeetupEvent>();
  for (const result of results) {
    if (result.status === 'fulfilled') for (const event of result.value) byId.set(event.id, event);
  }
  return [...byId.values()].map(toRawEvent);
};
