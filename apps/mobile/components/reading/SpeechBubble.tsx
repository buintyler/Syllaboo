import { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, AccessibilityInfo } from 'react-native';
import SammyAvatar from '../SammyAvatar';
import { colors, typography, spacing, layout } from '../../constants/theme';
import type { SessionPhase } from '../../hooks/useReadingSession';

export type SammyMood = 'happy' | 'excited' | 'encouraging' | 'sleeping';

interface SpeechBubbleProps {
  message: string;
  mood?: SammyMood;
}

const MOOD_EMOJI: Record<SammyMood, string> = {
  happy: '😊',
  excited: '🎉',
  encouraging: '💪',
  sleeping: '😴',
};

export function getMoodForPhase(
  phase: SessionPhase,
  lastWordCorrect: boolean | null,
): SammyMood {
  if (phase === 'idle') return 'happy';
  if (phase === 'completed') return 'excited';
  if (lastWordCorrect === true) return 'excited';
  if (lastWordCorrect === false) return 'encouraging';
  return 'happy';
}

export default function SpeechBubble({ message, mood = 'happy' }: SpeechBubbleProps) {
  const moodEmoji = MOOD_EMOJI[mood];
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // Bounce Sammy each time the message changes
  useEffect(() => {
    if (reduceMotion) return;
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -6,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [message, reduceMotion, bounceAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.avatarArea, { transform: [{ translateY: bounceAnim }] }]}
      >
        <SammyAvatar size="small" />
        <Text style={styles.moodEmoji}>{moodEmoji}</Text>
      </Animated.View>
      <View style={styles.bubbleWrapper}>
        <View style={styles.triangle} />
        <View
          style={styles.bubble}
          accessibilityLabel={`Sammy says: ${message}`}
          accessibilityRole="text"
        >
          <Text style={styles.text}>{message}</Text>
        </View>
      </View>
    </View>
  );
}

// 40% opacity of brand.primary (#4AAFE0)
const BRAND_BORDER = `${colors.brand.primary}66`;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: spacing.sm,
  },
  avatarArea: {
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 14,
    marginTop: 2,
  },
  bubbleWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: BRAND_BORDER,
    marginRight: -1,
  },
  bubble: {
    backgroundColor: colors.bg.surface,
    borderRadius: layout.cardBorderRadius,
    borderWidth: 1.5,
    borderColor: BRAND_BORDER,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flex: 1,
  },
  text: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
