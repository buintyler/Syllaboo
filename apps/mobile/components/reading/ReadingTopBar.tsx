import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants/theme';

interface ReadingTopBarProps {
  currentWordIndex: number;
  totalWords: number;
  onBack: () => void;
  onRestart: () => void;
}

export default function ReadingTopBar({
  currentWordIndex,
  totalWords,
  onBack,
  onRestart,
}: ReadingTopBarProps) {
  const progress = totalWords > 0 ? currentWordIndex / totalWords : 0;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, fillAnim]);

  const fillColor = fillAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [colors.brand.primary, colors.brand.secondary, colors.state.success],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
      </TouchableOpacity>

      <View style={styles.progressArea}>
        <View
          style={styles.progressTrack}
          accessibilityLabel={`Reading progress: ${currentWordIndex} of ${totalWords} words`}
          accessibilityRole="progressbar"
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: fillAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: fillColor,
              },
            ]}
          />
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            <Text style={styles.starIcon}>{'⭐ '}</Text>
            {currentWordIndex}/{totalWords} words
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.restartButton}
        onPress={onRestart}
        activeOpacity={0.7}
        accessibilityLabel="Start over"
        accessibilityRole="button"
      >
        <Ionicons name="refresh" size={22} color={colors.brand.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  backButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressArea: {
    flex: 1,
  },
  progressTrack: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border.light,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.brand.primary}4D`,
  },
  progressFill: {
    height: '100%',
    borderRadius: 7,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  starIcon: {
    fontSize: typography.small.fontSize,
  },
  statsText: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  restartButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
