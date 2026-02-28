import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { colors, typography, spacing, layout } from '../../constants/theme';

interface SessionControlsProps {
  isListening: boolean;
}

export default function SessionControls({ isListening }: SessionControlsProps) {
  const dotOpacity = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isListening && !reduceMotion) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    dotOpacity.setValue(1);
  }, [isListening, reduceMotion, dotOpacity]);

  return (
    <View style={styles.container}>
      <View
        style={styles.statusRow}
        accessibilityLabel={isListening ? "I'm listening" : 'Tap the mic and read to me'}
        accessibilityRole="text"
      >
        {isListening && (
          <Animated.View style={[styles.statusDot, { opacity: dotOpacity }]} />
        )}
        <Text style={[styles.statusText, isListening && styles.statusTextActive]}>
          {isListening ? "I'm listening! 👂" : 'Tap the mic and read to me!'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 28,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.state.success,
  },
  statusText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  statusTextActive: {
    color: colors.state.success,
  },
});
