export type PreferenceKey = 'location' | 'distance' | 'days' | 'times' | 'interests';

export type PreferenceValues = Record<PreferenceKey, string>;

export type PreferenceFormId = 'location' | 'availability' | 'interests';

export type PreferenceField = {
  key: PreferenceKey;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
};

export type PreferenceForm = {
  title: string;
  subtitle: string;
  fields: PreferenceField[];
};
