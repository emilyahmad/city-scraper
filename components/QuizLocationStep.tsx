import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { CitySuggestions } from '@/components/CitySuggestions';
import { DistanceSlider } from '@/components/DistanceSlider';
import { EditableField } from '@/components/EditableField';
import { PREFERENCE_FORMS } from '@/data/preferences';
import type { PreferenceValues } from '@/types/preferences';

type QuizLocationStepProps = {
  /** The chosen city, or '' until one is picked from the suggestions */
  location: string;
  distance: string;
  onChange: (values: Partial<PreferenceValues>) => void;
};

const LOCATION_FIELD = PREFERENCE_FORMS.location.fields[0];

// Works like the Location sheet in Settings: the slider stays put, and tapping a suggestion highlights it
// in the list (which stays open) instead of replacing the list.
export function QuizLocationStep({ location, distance, onChange }: QuizLocationStepProps) {
  const scrollOffset = useSharedValue(0);
  // What the field shows: the typed text, or the city once one is tapped
  const [text, setText] = useState(location);
  // What the user last typed. Picking a suggestion doesn't change it, so the list stays the same while the choice highlights.
  const [query, setQuery] = useState<string | null>(null);

  return (
    <View className="shrink">
      <View className="settings-section__card">
        <EditableField
          field={LOCATION_FIELD}
          value={text}
          isLast
          onChange={(value) => {
            setText(value);
            setQuery(value);
            // Only a city tapped in the suggestions counts as the answer
            if (value !== location) onChange({ location: '' });
          }}
        />
      </View>
      <DistanceSlider value={distance} onChange={(value) => onChange({ distance: value })} />
      {query !== null ? (
        <CitySuggestions
          query={query}
          selected={location}
          scrollOffset={scrollOffset}
          fill={false}
          onSelect={(city) => {
            // Close the keyboard so the Continue button comes into view
            Keyboard.dismiss();
            setText(city);
            onChange({ location: city });
          }}
        />
      ) : null}
    </View>
  );
}
