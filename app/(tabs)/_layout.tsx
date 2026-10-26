import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TabIcon } from '@/components/TabIcon';
import { images } from '@/constants/images';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: 'fade', sceneStyle: { backgroundColor: '#000000' } }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <TabIcon source={images.houseIcon} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pinned"
        options={{
          title: 'Pinned',
          tabBarIcon: ({ color, size }) => <TabIcon source={images.calendarAdd} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon source={images.personIcon} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
