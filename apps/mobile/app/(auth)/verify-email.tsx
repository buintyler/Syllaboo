import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useSignUp } from '@clerk/clerk-expo';
import SammyAvatar from '../../components/SammyAvatar';
import OtpInput from '../../components/OtpInput';
import { colors, typography, spacing, layout, shadows } from '../../constants/theme';
import { parseClerkError } from '../../lib/validation';
import { useUserSync } from '../../hooks/useUserSync';

export default function VerifyEmailScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { signUp, setActive, isLoaded } = useSignUp();
  const { syncUser } = useUserSync();

  const handleVerify = async () => {
    if (!signUp || !isLoaded || code.length < 6) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        await syncUser();
        // Root layout auth guard handles redirect to consent
      }
    } catch (err: unknown) {
      setError(parseClerkError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!signUp || !isLoaded) return;
    setError(null);
    setResendMessage(null);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setResendMessage('Code resent! Check your email.');
    } catch (err: unknown) {
      setError(parseClerkError(err));
    }
  };

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (error) setError(null);
    if (resendMessage) setResendMessage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SammyAvatar size="medium" />

        <Text style={styles.heading}>Check your email!</Text>
        <Text style={styles.subtext}>
          {"We sent a 6-digit code to your email.\nEnter it below to verify your account."}
        </Text>

        <View style={styles.card}>
          <OtpInput
            value={code}
            onChangeText={handleCodeChange}
            error={error}
          />

          {resendMessage ? (
            <Text style={styles.resendSuccess}>{resendMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.verifyButton, (isLoading || code.length < 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading || code.length < 6}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Verify code"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.onBrand} />
            ) : (
              <Text style={styles.verifyButtonText}>VERIFY</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            style={styles.resendRow}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="Resend verification code"
          >
            <Text style={styles.resendText}>Resend code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  heading: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  subtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: layout.cardBorderRadius,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  verifyButton: {
    width: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: layout.buttonBorderRadiusParent,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  verifyButtonText: {
    ...typography.bodyBold,
    color: colors.text.onBrand,
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  resendRow: {
    minHeight: layout.minTapTarget,
    justifyContent: 'center',
  },
  resendText: {
    ...typography.caption,
    color: colors.brand.secondary,
    fontWeight: '500',
  },
  resendSuccess: {
    ...typography.caption,
    color: colors.state.success,
  },
});
