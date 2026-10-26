import { Image } from 'expo-image';
import type { ColorValue } from 'react-native';

import type { images } from '@/constants/images';

type TabIconProps = {
  source: (typeof images)[keyof typeof images];
  color: ColorValue;
  size: number;
};

export function TabIcon({ source, color, size }: TabIconProps) {
  return (
    <Image
      source={source}
      tintColor={String(color)}
      contentFit="contain"
      style={{ width: size, height: size }}
    />
  );
}
