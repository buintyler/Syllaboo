/**
 * SammyAvatar — Syllaboo mascot component.
 *
 * Currently renders a placeholder emoji.
 * TO REPLACE: Swap the inner content with an <Image> or react-native-svg component
 * once the final Sammy artwork is ready. The outer ring and sizing stay the same.
 *
 * Usage:
 *   <SammyAvatar size="large" />
 *   <SammyAvatar size={64} />
 */

import { View, Text, StyleSheet } from 'react-native';
import { colors, layout } from '../constants/theme';

type AvatarSize = 'small' | 'medium' | 'large' | number;

interface SammyAvatarProps {
  size?: AvatarSize;
}

const SIZE_MAP = {
  small: layout.avatarSize.small,
  medium: layout.avatarSize.medium,
  large: layout.avatarSize.large,
};

export default function SammyAvatar({ size = 'large' }: SammyAvatarProps) {
  const diameter = typeof size === 'number' ? size : SIZE_MAP[size];
  const fontSize = diameter * 0.52;

  return (
    <View
      style={[
        styles.ring,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
        },
      ]}
    >
      {/* ── REPLACE THIS with <Image source={require('../assets/sammy.png')} /> ── */}
      <Text style={[styles.emoji, { fontSize }]}>🦥</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: colors.bg.surface,
    borderWidth: 3,
    borderColor: colors.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: {
    textAlign: 'center',
  },
});
