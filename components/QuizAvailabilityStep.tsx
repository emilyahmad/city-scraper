import { ScrollView } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { DayPicker } from '@/components/DayPicker';
import { TimeRangePicker } from '@/components/TimeRangePicker';
import type { PreferenceValues } from '@/types/preferences';

type QuizAvailabilityStepProps = {
  days: string;
  times: string;
  onChange: (values: Partial<PreferenceValues>) => void;
};

export function QuizAvailabilityStep({ days, times, onChange }: QuizAvailabilityStepProps) {
  // The time picker reports scroll positions for the edit sheet's swipe-to-close; the quiz has no sheet, so they go unused.
  const scrollOffset = useSharedValue(0);
  const restoreOffset = useSharedValue(0);

  return (
    <ScrollView className="shrink" showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
      <DayPicker value={days} onChange={(value) => onChange({ days: value })} />
      <TimeRangePicker
        value={times}
        days={days}
        scrollOffset={scrollOffset}
        restoreOffset={restoreOffset}
        closeSignal={0}
        onChange={(value) => onChange({ times: value })}
      />
    </ScrollView>
  );
}
