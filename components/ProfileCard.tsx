import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type ProfileCardProps = {
  name: string;
  onEdit: () => void;
};

export function ProfileCard({ name, onEdit }: ProfileCardProps) {
  return (
    <View className="settings-section__card">
      <Pressable className="profile-card__header">
        <View className="profile-card__avatar">
          <Text className="profile-card__initial">{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View className="profile-card__info">
          <Text className="profile-card__name">{name}</Text>
        </View>
      </Pressable>
      <Pressable className="profile-card__edit" onPress={onEdit}>
        <Text className="settings-row__label">Edit Profile</Text>
        <Ionicons name="chevron-forward" size={18} color="#6b7280" />
      </Pressable>
    </View>
  );
}
