import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EditPreferencesModal } from '@/components/EditPreferencesModal';
import { ProfileCard } from '@/components/ProfileCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_SECTIONS } from '@/data/settings';
import type { PreferenceFormId } from '@/types/preferences';

export default function SettingsScreen() {
  const { top } = useSafeAreaInsets();
  const [activeForm, setActiveForm] = useState<PreferenceFormId>('location');
  const [modalVisible, setModalVisible] = useState(false);

  const openForm = (form: PreferenceFormId) => {
    setActiveForm(form);
    setModalVisible(true);
  };

  return (
    <View className="settings-screen">
      <ScrollView contentContainerClassName="tab-screen__content" contentContainerStyle={{ paddingTop: top + 16 }}>
        <ScreenHeader title="Settings" subtitle="Update your preferences" />
        <View className="mt-6">
          <ProfileCard name="Your Name" />
        </View>
        {SETTINGS_SECTIONS.map((section, index) => (
          <SettingsSection key={section.title ?? index} {...section} onSelectForm={openForm} />
        ))}
      </ScrollView>
      <EditPreferencesModal visible={modalVisible} formId={activeForm} onClose={() => setModalVisible(false)} />
    </View>
  );
}
