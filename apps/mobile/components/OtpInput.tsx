import { useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, typography, spacing, layout } from '../constants/theme';

interface OtpInputProps {
  length?: number;
  value: string;
  onChangeText: (code: string) => void;
  error?: string | null;
  autoFocus?: boolean;
}

export default function OtpInput({
  length = 6,
  value,
  onChangeText,
  error,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(digits);
  };

  const digits = value.split('');

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handlePress} style={styles.boxRow}>
        {Array.from({ length }, (_, i) => {
          const isFilled = i < digits.length;
          const isCurrent = i === digits.length;
          return (
            <View
              key={i}
              style={[
                styles.box,
                isCurrent && styles.boxFocused,
                error && styles.boxError,
              ]}
            >
              <Text style={styles.digit}>{isFilled ? digits[i] : ''}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        autoComplete="one-time-code"
        accessibilityLabel="Verification code"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  boxRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: layout.inputBorderRadius,
    borderWidth: 1.5,
    borderColor: colors.border.input,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
  },
  boxError: {
    borderColor: colors.state.error,
  },
  digit: {
    ...typography.h1,
    color: colors.text.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  error: {
    ...typography.small,
    color: colors.state.error,
    marginTop: spacing.sm,
  },
});
