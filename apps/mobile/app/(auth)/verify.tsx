import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import SammyAvatar from '../../components/SammyAvatar';
import { colors, typography, spacing, layout, shadows } from '../../constants/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = useCallback(async () => {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });

      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId });
        router.replace('/(reading)');
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
          clerkError.errors?.[0]?.message ||
          'Verification failed. Please check your code and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signUp, code, setActive, router]);

  const handleResend = useCallback(async () => {
    if (!isLoaded || !signUp) return;
    setResending(true);
    setError('');

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ longMessage?: string; message?: string }> };
      setError(
        clerkError.errors?.[0]?.longMessage ||
          clerkError.errors?.[0]?.message ||
          'Could not resend code. Please try again.',
      );
    } finally {
      setResending(false);
    }
  }, [isLoaded, signUp]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.content}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <SammyAvatar size="medium" />

          <Text style={styles.heading}>Check your email</Text>
          <Text style={styles.subtitle}>
            {"We sent a verification code to\n"}
            <Text style={styles.emailText}>{signUp?.emailAddress ?? 'your email'}</Text>
          </Text>

          {/* Verification card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Verification code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor={colors.text.disabled}
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              accessibilityLabel="Verification code"
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.verifyButton, (!isLoaded || loading) && styles.verifyButtonDisabled]}
              activeOpacity={0.85}
              onPress={handleVerify}
              disabled={!isLoaded || loading}
              accessibilityRole="button"
              accessibilityLabel="Verify email"
            >
              {loading ? (
                <ActivityIndicator color={colors.text.onBrand} />
              ) : (
                <Text style={styles.verifyButtonText}>VERIFY</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResend}
              disabled={resending}
              accessibilityRole="button"
              accessibilityLabel="Resend verification code"
            >
              <Text style={styles.resendText}>
                {resending ? 'Sending...' : "Didn't get the code? Resend"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    gap: spacing.md,
  },

  // Back
  backButton: {
    alignSelf: 'flex-start',
    minHeight: layout.minTapTarget,
    justifyContent: 'center',
  },
  backText: {
    ...typography.body,
    color: colors.brand.secondary,
    fontWeight: '600',
  },

  // Header
  heading: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: layout.cardBorderRadius,
    padding: spacing.lg,
    ...shadows.card,
    gap: spacing.sm,
  },

  // Error
  errorContainer: {
    backgroundColor: '#FFF0F0',
    borderRadius: layout.inputBorderRadius,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand.accent,
  },
  errorText: {
    ...typography.caption,
    color: colors.brand.accent,
    textAlign: 'center',
  },

  // Form
  label: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: layout.inputBorderRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    ...typography.h2,
    color: colors.text.primary,
    backgroundColor: colors.bg.primary,
    minHeight: layout.minTapTarget,
    textAlign: 'center',
    letterSpacing: 8,
  },

  // Verify button
  verifyButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: layout.buttonBorderRadiusParent,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...shadows.button,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    ...typography.bodyBold,
    color: colors.text.onBrand,
    letterSpacing: 1,
  },

  // Resend
  resendButton: {
    alignItems: 'center',
    minHeight: layout.minTapTarget,
    justifyContent: 'center',
  },
  resendText: {
    ...typography.caption,
    color: colors.brand.secondary,
    fontWeight: '500',
  },
});
