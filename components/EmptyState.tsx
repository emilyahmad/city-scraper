import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
};

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View className="empty-state">
      <View className="empty-state__icon">
        <Ionicons name={icon} size={36} color="#7c3aed" />
      </View>
      <Text className="empty-state__title">{title}</Text>
      <Text className="empty-state__message">{message}</Text>
    </View>
  );
}
