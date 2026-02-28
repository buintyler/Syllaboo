import { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, typography, spacing } from '../../constants/theme';

interface MicButtonProps {
  isListening: boolean;
  onPress: () => void;
}

const MIC_SIZE = 96;
const PULSE_SIZE = 130;

export default function MicButton({ isListening, onPress }: MicButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.25)).current;
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
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.25,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.05,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.25,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
    pulseOpacity.setValue(0.25);
  }, [isListening, reduceMotion, pulseAnim, pulseOpacity]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {isListening && (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseOpacity,
              },
            ]}
          />
        )}
        <TouchableOpacity
          style={[styles.button, isListening && styles.buttonListening]}
          onPress={onPress}
          activeOpacity={0.85}
          accessibilityLabel={isListening ? 'Listening, tap to pause' : 'Tap to start reading'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={40}
            color={isListening ? colors.text.onBrand : colors.text.primary}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.label, isListening && styles.labelActive]}>
        {isListening ? 'LISTENING' : 'READ'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: PULSE_SIZE + 16,
    width: PULSE_SIZE + 16,
  },
  pulseRing: {
    position: 'absolute',
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
    backgroundColor: colors.brand.primary,
  },
  button: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  buttonListening: {
    backgroundColor: colors.brand.primaryDark,
  },
  label: {
    ...typography.bodyBold,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  labelActive: {
    color: colors.brand.primary,
  },
});
