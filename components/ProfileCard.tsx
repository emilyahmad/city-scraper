import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type ProfileCardProps = {
  name: string;
};

export function ProfileCard({ name }: ProfileCardProps) {
  return (
    <View className="settings-section__card">
      <Pressable className="profile-card__header">
        <View className="profile-card__avatar">
          <Text className="profile-card__initial">{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View className="profile-card__info">
          <Text className="profile-card__name">{name}</Text>
          <Text className="profile-card__link">View Profile</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6b7280" />
      </Pressable>
      <Pressable className="profile-card__edit">
        <Text className="settings-row__label">Edit Profile</Text>
        <Ionicons name="chevron-forward" size={18} color="#6b7280" />
      </Pressable>
    </View>
  );
}
