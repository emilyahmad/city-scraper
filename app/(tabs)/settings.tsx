import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EditNameModal } from '@/components/EditNameModal';
import { EditPreferencesModal } from '@/components/EditPreferencesModal';
import { ProfileCard } from '@/components/ProfileCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_SECTIONS } from '@/data/settings';
import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import type { PreferenceFormId } from '@/types/preferences';

export default function SettingsScreen() {
  const { top } = useSafeAreaInsets();
  const [activeForm, setActiveForm] = useState<PreferenceFormId>('location');
  const [modalVisible, setModalVisible] = useState(false);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const name = useProfileStore((state) => state.name);
  const signOut = useAuthStore((state) => state.signOut);

  const openForm = (form: PreferenceFormId) => {
    setActiveForm(form);
    setModalVisible(true);
  };

  return (
    <View className="settings-screen">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="tab-screen__content" contentContainerStyle={{ paddingTop: top + 16 }}>
        <ScreenHeader title="Settings" subtitle="Update your preferences" />
        <View className="mt-6">
          <ProfileCard name={name} onEdit={() => setNameModalVisible(true)} />
        </View>
        {SETTINGS_SECTIONS.map((section, index) => (
          <SettingsSection key={section.title ?? index} {...section} onSelectForm={openForm} />
        ))}
        <Pressable className="settings-screen__sign-out" onPress={signOut}>
          <Text className="settings-screen__sign-out-label">Sign out</Text>
        </Pressable>
      </ScrollView>
      <EditPreferencesModal visible={modalVisible} formId={activeForm} onClose={() => setModalVisible(false)} />
      <EditNameModal visible={nameModalVisible} onClose={() => setNameModalVisible(false)} />
    </View>
  );
}
