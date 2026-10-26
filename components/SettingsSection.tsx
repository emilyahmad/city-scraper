import { Text, View } from 'react-native';

import { SettingsRow } from '@/components/SettingsRow';
import type { SettingsSection as SettingsSectionData } from '@/data/settings';
import type { PreferenceFormId } from '@/types/preferences';

type SettingsSectionProps = SettingsSectionData & {
  onSelectForm: (form: PreferenceFormId) => void;
};

export function SettingsSection({ title, items, onSelectForm }: SettingsSectionProps) {
  return (
    <View className="settings-section">
      {title ? <Text className="settings-section__title">{title}</Text> : null}
      <View className="settings-section__card">
        {items.map((item, index) => (
          <SettingsRow
            key={item.label}
            item={item}
            isLast={index === items.length - 1}
            onPress={item.form ? () => onSelectForm(item.form!) : undefined}
          />
        ))}
      </View>
    </View>
  );
}
