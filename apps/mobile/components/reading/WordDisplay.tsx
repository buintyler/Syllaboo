import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, typography, spacing, layout } from '../../constants/theme';
import type { DisplayWord, WordStatus } from '../../hooks/useReadingSession';

const VISIBLE_WORD_COUNT = 10;

interface WordDisplayProps {
  words: DisplayWord[];
  currentWordIndex: number;
}

function getWordColor(status: WordStatus): string {
  switch (status) {
    case 'current':
      return colors.text.reading;
    case 'correct':
      return colors.state.success;
    case 'incorrect':
      return colors.state.error;
    case 'skipped':
      return colors.text.disabled;
    default:
      return colors.text.disabled;
  }
}

export default function WordDisplay({ words, currentWordIndex }: WordDisplayProps) {
  // Show a window of up to VISIBLE_WORD_COUNT words centered on the current word
  const half = Math.floor(VISIBLE_WORD_COUNT / 2);
  let start = Math.max(0, currentWordIndex - half);
  const end = Math.min(words.length, start + VISIBLE_WORD_COUNT);
  // Adjust start if we're near the end of the story
  start = Math.max(0, end - VISIBLE_WORD_COUNT);
  const visibleWords = words.slice(start, end);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.wordsRow}>
        {visibleWords.map((word) => (
          <View
            key={word.wordIndex}
            style={styles.wordColumn}
            accessibilityLabel={word.text}
            accessibilityHint={word.status === 'current' ? `Currently reading: ${word.phonetic}` : undefined}
          >
            <View
              style={[
                styles.wordWrapper,
                word.status === 'current' && styles.currentWordWrapper,
              ]}
            >
              <Text
                style={[
                  styles.wordText,
                  { color: getWordColor(word.status) },
                  word.status === 'current' && styles.currentWord,
                  word.status === 'incorrect' && styles.incorrectWord,
                  word.status === 'skipped' && styles.skippedWord,
                ]}
              >
                {word.text}
              </Text>
            </View>
            {word.status === 'current' && (
              <Text style={styles.phoneticText}>{word.phonetic}</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    rowGap: spacing.lg,
  },
  wordColumn: {
    alignItems: 'center',
  },
  wordWrapper: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  currentWordWrapper: {
    backgroundColor: colors.state.highlight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ scale: 1.05 }],
  },
  wordText: {
    ...typography.reading,
  },
  currentWord: {
    ...typography.readingHighlight,
    color: colors.text.reading,
  },
  incorrectWord: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: colors.state.error,
  },
  skippedWord: {
    textDecorationLine: 'line-through',
  },
  phoneticText: {
    ...typography.caption,
    color: colors.brand.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
