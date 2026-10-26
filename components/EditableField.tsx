import { Image } from 'expo-image';
import { type ComponentRef, useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { images } from '@/constants/images';
import type { PreferenceField } from '@/types/preferences';

type EditableFieldProps = {
  field: PreferenceField;
  value: string;
  isLast: boolean;
  onChange: (value: string) => void;
};

export function EditableField({ field, value, isLast, onChange }: EditableFieldProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <Pressable className="editable-field" onPress={() => inputRef.current?.focus()}>
      <View className={isLast ? 'editable-field__body' : 'editable-field__body editable-field__body--divider'}>
        <Text className="editable-field__label">{field.label}</Text>
        <TextInput
          ref={inputRef}
          className="editable-field__input"
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor="#6b7280"
          keyboardType={field.keyboardType}
          returnKeyType="done"
        />
        <Image source={images.pencil} tintColor="#9ca3af" contentFit="contain" style={{ width: 16, height: 16 }} />
      </View>
    </Pressable>
  );
}
