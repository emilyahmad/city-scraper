import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { LoadingDots } from '@/components/LoadingDots';
import type { images } from '@/constants/images';

type EmptyStateProps = {
  // Either an Ionicons glyph or one of the app's images. Not needed while loading.
  icon?: keyof typeof Ionicons.glyphMap | { image: (typeof images)[keyof typeof images] };
  title: string;
  message: string;
  // Optional button under the message, e.g. "Try again"
  action?: { label: string; onPress: () => void };
  // Show animated dots in place of the icon while work is in progress
  loading?: boolean;
};

const ICON_COLOR = '#7c3aed';
const ICON_SIZE = 36;

export function EmptyState({ icon, title, message, action, loading }: EmptyStateProps) {
  return (
    <View className="empty-state">
      {loading ? (
        <View className="empty-state__loading">
          <LoadingDots />
        </View>
      ) : (
        icon && (
          <View className="empty-state__icon">
            {typeof icon === 'string' ? (
              <Ionicons name={icon} size={ICON_SIZE} color={ICON_COLOR} />
            ) : (
              <Image source={icon.image} tintColor={ICON_COLOR} contentFit="contain" style={{ width: ICON_SIZE, height: ICON_SIZE }} />
            )}
          </View>
        )
      )}
      <Text className="empty-state__title">{title}</Text>
      <Text className="empty-state__message">{message}</Text>
      {action && (
        <Pressable className="empty-state__action" onPress={action.onPress} hitSlop={8}>
          <Text className="empty-state__action-label">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}
