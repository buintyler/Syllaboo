import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import SammyAvatar from '../../components/SammyAvatar';
import OtpInput from '../../components/OtpInput';
import { colors, typography, spacing, layout, shadows } from '../../constants/theme';
import { validateEmail, validatePassword, parseClerkError } from '../../lib/validation';

type ForgotStep = 'email' | 'code' | 'newPassword';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const handleSendCode = async () => {
    if (!signIn || !isLoaded) return;
    setError(null);

    const emailResult = validateEmail(email);
    if (!emailResult.isValid) {
      setError(emailResult.error);
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email.trim(),
      });
      setStep('code');
    } catch (err: unknown) {
      setError(parseClerkError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (code.length < 6) return;
    setError(null);
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (!signIn || !isLoaded) return;
    setError(null);

    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      setError(passwordResult.error);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });
      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        // Auth guard handles navigation
      }
    } catch (err: unknown) {
      setError(parseClerkError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'email') {
      router.back();
    } else if (step === 'code') {
      setStep('email');
      setError(null);
    } else {
      setStep('code');
      setError(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>{'← Back'}</Text>
          </TouchableOpacity>

          <SammyAvatar size="medium" />

          {step === 'email' && (
            <View style={styles.card}>
              <Text style={styles.heading}>Forgot password?</Text>
              <Text style={styles.subtext}>
                {"Enter your email and we'll send you a code to reset your password."}
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="parent@example.com"
                placeholderTextColor={colors.text.disabled}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                accessibilityLabel="Email address"
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={isLoading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Send reset code"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.text.onBrand} />
                ) : (
                  <Text style={styles.primaryButtonText}>SEND CODE</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'code' && (
            <View style={styles.card}>
              <Text style={styles.heading}>Check your email!</Text>
              <Text style={styles.subtext}>
                {'Enter the 6-digit code we sent to your email.'}
              </Text>

              <OtpInput
                value={code}
                onChangeText={(t) => { setCode(t); setError(null); }}
                error={error}
              />

              <TouchableOpacity
                style={[styles.primaryButton, (isLoading || code.length < 6) && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={isLoading || code.length < 6}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Verify code"
              >
                <Text style={styles.primaryButtonText}>VERIFY CODE</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'newPassword' && (
            <View style={styles.card}>
              <Text style={styles.heading}>Create new password</Text>
              <Text style={styles.subtext}>
                {'Enter your new password below.'}
              </Text>

              <Text style={styles.label}>New password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={colors.text.disabled}
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); setError(null); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                  accessibilityLabel="New password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.text.disabled}
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setError(null); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
                accessibilityLabel="Confirm new password"
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Reset password"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.text.onBrand} />
                ) : (
                  <Text style={styles.primaryButtonText}>RESET PASSWORD</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
  scroll: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
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
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: layout.cardBorderRadius,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  heading: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: layout.inputBorderRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.primary,
    minHeight: layout.minTapTarget,
  },
  passwordRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.input,
    borderRadius: layout.inputBorderRadius,
    backgroundColor: colors.bg.primary,
    minHeight: layout.minTapTarget,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    ...typography.body,
    color: colors.text.primary,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    minWidth: layout.minTapTarget,
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: layout.inputBorderRadius,
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.state.error,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: layout.buttonBorderRadiusParent,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.text.onBrand,
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
