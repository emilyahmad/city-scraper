import { View } from 'react-native';

type QuizProgressProps = {
  steps: number;
  /** Zero-based index of the step being shown */
  current: number;
};

export function QuizProgress({ steps, current }: QuizProgressProps) {
  return (
    <View className="quiz-progress">
      {Array.from({ length: steps }, (_, index) => (
        <View
          key={index}
          className={index <= current ? 'quiz-progress__bar quiz-progress__bar--done' : 'quiz-progress__bar'}
        />
      ))}
    </View>
  );
}
