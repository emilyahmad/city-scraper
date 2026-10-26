import { images } from '@/constants/images';
import type { PreferenceFormId } from '@/types/preferences';

export type SettingsItem = {
  label: string;
  icon: (typeof images)[keyof typeof images];
  /** Full Tailwind class so NativeWind can detect it, e.g. "bg-red-500" */
  iconBg: string;
  /** Shows a diagonal arrow instead of a chevron for links that leave the app */
  external?: boolean;
  /** Opens this preference form in a modal when tapped */
  form?: PreferenceFormId;
};

export type SettingsSection = {
  title?: string;
  items: SettingsItem[];
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: 'Preferences',
    items: [
      { label: 'Location & Distance', icon: images.location, iconBg: 'bg-blue-500', form: 'location' },
      { label: 'Availability', icon: images.availability, iconBg: 'bg-violet-500', form: 'availability' },
      { label: 'Interests', icon: images.interests, iconBg: 'bg-pink-500', form: 'interests' },
    ],
  },
];
