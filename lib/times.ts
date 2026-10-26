export type Time = { hour: number; minute: number; period: 'AM' | 'PM' };

export type TimeRange = { start: Time; end: Time };

// Used when the saved value isn't a range yet (e.g. the old "Evening" default).
export const DEFAULT_RANGE: TimeRange = {
  start: { hour: 6, minute: 0, period: 'PM' },
  end: { hour: 10, minute: 0, period: 'PM' },
};

const formatTime = ({ hour, minute, period }: Time) =>
  `${hour}:${String(minute).padStart(2, '0')} ${period}`;

// Times are stored as one string, e.g. "6:00 PM - 10:00 PM".
export const formatRange = ({ start, end }: TimeRange) => `${formatTime(start)} - ${formatTime(end)}`;

const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;

export function parseRange(value: string): TimeRange {
  const matches = [...value.matchAll(TIME_PATTERN)];
  if (matches.length !== 2) return DEFAULT_RANGE;
  const [start, end] = matches.map(([, hour, minute, period]) => ({
    hour: Number(hour),
    minute: Number(minute),
    period: period.toUpperCase() as Time['period'],
  }));
  return { start, end };
}
