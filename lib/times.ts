export type Time = { hour: number; minute: number; period: "AM" | "PM" };

// The first range uses the sheet's main days, so only the extra ranges carry their own.
export type TimeRange = { start: Time; end: Time; days?: string };

// Used when the saved value isn't a range yet (e.g. the old "Evening" default).
export const DEFAULT_RANGE: TimeRange = {
  start: { hour: 6, minute: 0, period: "PM" },
  end: { hour: 10, minute: 0, period: "PM" },
};

const formatTime = ({ hour, minute, period }: Time) =>
  `${hour}:${String(minute).padStart(2, "0")} ${period}`;

// Times are stored as one string, with slots separated by semicolons. Extra slots start with their days,
// e.g. "6:00 PM - 10:00 PM; Sat, Sun: 1:00 PM - 3:00 PM".
export const formatRanges = (ranges: TimeRange[]) =>
  ranges
    .map(({ start, end, days }) => {
      const range = `${formatTime(start)} - ${formatTime(end)}`;
      return days === undefined ? range : `${days}: ${range}`;
    })
    .join("; ");

const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi;
const DAYS_PREFIX = /^\s*([A-Za-z][A-Za-z, ]*):/;

export function parseRanges(value: string): TimeRange[] {
  const ranges: TimeRange[] = [];
  for (const part of value.split(";")) {
    const days = part.match(DAYS_PREFIX)?.[1].trim();
    const times = [...part.matchAll(TIME_PATTERN)].map(
      ([, hour, minute, period]) => ({
        hour: Number(hour),
        minute: Number(minute),
        period: period.toUpperCase() as Time["period"],
      }),
    );
    for (let i = 0; i + 1 < times.length; i += 2) {
      ranges.push({
        start: times[i],
        end: times[i + 1],
        // The first range never carries days; it follows the sheet's main days.
        ...(ranges.length && days !== undefined ? { days } : {}),
      });
    }
  }
  // Extra ranges always need a days entry, even when the saved text had none.
  return ranges.length
    ? ranges.map((range, i) =>
        i && range.days === undefined ? { ...range, days: "" } : range,
      )
    : [DEFAULT_RANGE];
}

// True when an extra slot has had all of its days deselected.
export const hasEmptySlotDays = (value: string) =>
  parseRanges(value).some(
    (range) => range.days !== undefined && !range.days.trim(),
  );
