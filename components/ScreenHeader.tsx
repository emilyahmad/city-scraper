import { Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle: string;
  lightSubtitle?: boolean;
};

export function ScreenHeader({ title, subtitle, lightSubtitle }: ScreenHeaderProps) {
  return (
    <View>
      <Text className="tab-screen__title">{title}</Text>
      <Text className={lightSubtitle ? 'tab-screen__subtitle tab-screen__subtitle--light' : 'tab-screen__subtitle'}>{subtitle}</Text>
    </View>
  );
}
