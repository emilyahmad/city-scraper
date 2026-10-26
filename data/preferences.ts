import type { PreferenceForm, PreferenceFormId } from '@/types/preferences';

export const PREFERENCE_FORMS: Record<PreferenceFormId, PreferenceForm> = {
  location: {
    title: 'Location & Distance',
    subtitle: 'Where you are and how far you will travel for events',
    fields: [
      { key: 'location', label: 'Location', placeholder: 'Enter a city' },
      { key: 'distance', label: 'Distance (miles)', placeholder: '5', keyboardType: 'numeric' },
    ],
  },
  availability: {
    title: 'Availability',
    subtitle: 'Which days and times you are free for events',
    fields: [
      { key: 'days', label: 'Days', placeholder: 'Fri, Sat, Sun' },
      { key: 'times', label: 'Time of day', placeholder: 'Morning, Evening' },
    ],
  },
  interests: {
    title: 'Interests',
    subtitle: 'Tap the topics you want to see events for',
    fields: [{ key: 'interests', label: 'Interests', placeholder: 'Running, Movies, Finance' }],
  },
};

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const INTEREST_OPTIONS = [
  'Running',
  'Movies',
  'Finance',
  'Music',
  'Art',
  'Food',
  'Comedy',
  'Fitness',
  'Yoga',
  'Tech',
  'Networking',
  'Theater',
  'Books',
  'Gaming',
  'Outdoors',
  'Nightlife',
  'Photography',
  'Dance',
  'Wellness',
  'Fashion',
];

/** Similar interests and sub-niches that get suggested when an interest is selected */
export const RELATED_INTERESTS: Record<string, string[]> = {
  Running: ['Trail Running', 'Marathons', 'Run Clubs'],
  Movies: ['Indie Film', 'Film Festivals', 'Horror Screenings'],
  Finance: ['Investing', 'Crypto', 'Startups'],
  Music: ['Live Jazz', 'Indie Concerts', 'Electronic'],
  Art: ['Gallery Openings', 'Street Art', 'Pottery'],
  Food: ['Food Markets', 'Wine Tasting', 'Cooking Classes'],
  Comedy: ['Stand-up', 'Improv', 'Open Mics'],
  Fitness: ['Climbing', 'Pilates', 'CrossFit'],
  Yoga: ['Meditation', 'Breathwork', 'Sound Baths'],
  Tech: ['AI', 'Hackathons', 'Startups'],
  Networking: ['Founder Meetups', 'Career Mixers', 'Women in Tech'],
  Theater: ['Broadway', 'Off-Broadway', 'Musicals'],
  Books: ['Book Clubs', 'Author Talks', 'Poetry'],
  Gaming: ['Board Games', 'Esports', 'Trivia'],
  Outdoors: ['Hiking', 'Kayaking', 'Camping'],
  Nightlife: ['Rooftop Bars', 'Dance Parties', 'Karaoke'],
  Photography: ['Film Photography', 'Photo Walks', 'Portraits'],
  Dance: ['Salsa', 'Swing', 'Ballet'],
  Wellness: ['Spa Days', 'Sound Baths', 'Cold Plunge'],
  Fashion: ['Vintage', 'Thrifting', 'Runway Shows'],
  Investing: ['Stock Picking', 'Real Estate'],
  Climbing: ['Bouldering', 'Rock Climbing'],
  Hiking: ['Day Hikes', 'Camping'],
  'Stand-up': ['Comedy Cellar Shows', 'Open Mics'],
  Meditation: ['Breathwork', 'Mindfulness'],
};
