import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import type { SettingsItem } from '@/data/settings';

type SettingsRowProps = {
  item: SettingsItem;
  isLast: boolean;
  onPress?: () => void;
};

export function SettingsRow({ item, isLast, onPress }: SettingsRowProps) {
  return (
    <Pressable className="settings-row" onPress={onPress}>
      <View className={`settings-row__icon ${item.iconBg}`}>
        <Image source={item.icon} tintColor="#ffffff" contentFit="contain" style={{ width: 18, height: 18 }} />
      </View>
      <View className={isLast ? 'settings-row__body' : 'settings-row__body settings-row__body--divider'}>
        <Text className="settings-row__label">{item.label}</Text>
        <View className={item.external ? 'rotate-[-45deg]' : ''}>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </View>
      </View>
    </Pressable>
  );
}
