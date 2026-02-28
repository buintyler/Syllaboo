import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import SammyAvatar from '../../components/SammyAvatar';
import { colors, typography, spacing, layout, shadows } from '../../constants/theme';
import { validateEmail, validatePassword, parseClerkError } from '../../lib/validation';
import { useUserSync } from '../../hooks/useUserSync';

type AuthTab = 'signin' | 'create';

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_apple' });
  const { syncUser } = useUserSync();
  const router = useRouter();

  const clearErrors = () => {
    setError(null);
    setEmailError(null);
    setPasswordError(null);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
  };

  const handleSignIn = async () => {
    if (!signIn || !signInLoaded) return;
    clearErrors();

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error);
      return;
    }
    if (!passwordResult.isValid) {
      setPasswordError(passwordResult.error);
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.create({ identifier: email.trim(), password });
      if (result.status === 'complete' && result.createdSessionId) {
        await setSignInActive({ session: result.createdSessionId });
        await syncUser();
      } else if (result.status === 'needs_second_factor') {
        setError('Two-factor authentication is not supported yet. Please contact support.');
      } else if (result.status === 'needs_first_factor') {
        setError('Additional verification required. Please try again.');
      }
    } catch (err: unknown) {
      setError(parseClerkError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUp || !signUpLoaded) return;
    clearErrors();

    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    if (!emailResult.isValid) {
      setEmailError(emailResult.error);
      return;
    }
    if (!passwordResult.isValid) {
      setPasswordError(passwordResult.error);
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      router.push('/(auth)/verify-email');
    } catch (err: unknown) {
      setError(parseClerkError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    clearErrors();
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        await syncUser();
      }
    } catch (err: unknown) {
      const parsed = parseClerkError(err);
      if (parsed !== 'Something went wrong. Please try again.') {
        setError(parsed);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handlePrimaryCta = () => {
    if (activeTab === 'signin') {
      handleSignIn();
    } else {
      handleSignUp();
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
          {/* Mascot */}
          <SammyAvatar size="large" />

          {/* Brand title */}
          <Text style={styles.title}>
            <Text style={styles.titleDark}>Sylla</Text>
            <Text style={styles.titleBrand}>boo</Text>
          </Text>
          <Text style={styles.subtitle}>{"Your child's reading adventure starts here"}</Text>

          {/* Auth card */}
          <View style={styles.card}>
            {/* Tab switcher */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'signin' && styles.tabActive]}
                onPress={() => { setActiveTab('signin'); clearErrors(); }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'signin' }}
              >
                <Text style={[styles.tabText, activeTab === 'signin' && styles.tabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'create' && styles.tabActive]}
                onPress={() => { setActiveTab('create'); clearErrors(); }}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'create' }}
              >
                <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              placeholder="parent@example.com"
              placeholderTextColor={colors.text.disabled}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
              accessibilityLabel="Email address"
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordRow, passwordError && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.text.disabled}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
                accessibilityLabel="Password"
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
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            {/* Forgot password — sign in only */}
            {activeTab === 'signin' && (
              <TouchableOpacity
                style={styles.forgotRow}
                activeOpacity={0.7}
                onPress={handleForgotPassword}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Form-level error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              activeOpacity={0.85}
              onPress={handlePrimaryCta}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={activeTab === 'signin' ? 'Sign in' : 'Create account'}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.text.onBrand} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {activeTab === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </Text>
              )}
            </TouchableOpacity>

            {/* OR divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Sign in with Apple */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.appleButton, isLoading && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleAppleSignIn}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Apple"
              >
                <Text style={styles.appleLogo}>{'\uF8FF'}</Text>
                <Text style={styles.appleButtonText}>Sign in with Apple</Text>
              </TouchableOpacity>
            )}

            {/* Trust badges */}
            <View style={styles.badgesRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🛡️</Text>
                <Text style={styles.badgeText}>COPPA Safe</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🔒</Text>
                <Text style={styles.badgeText}>Encrypted</Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            {'By continuing, you agree to our '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' and '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
            {". We never collect children's personal information."}
          </Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  // Brand
  title: {
    ...typography.display,
    marginTop: spacing.sm,
  },
  titleDark: {
    color: colors.text.primary,
  },
  titleBrand: {
    color: colors.brand.secondary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: layout.cardBorderRadius,
    padding: spacing.lg,
    ...shadows.card,
    gap: spacing.xs,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: layout.inputBorderRadius,
    padding: 4,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: layout.minTapTarget,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.bg.surface,
    ...shadows.card,
  },
  tabText: {
    ...typography.caption,
    color: colors.text.disabled,
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },

  // Form
  label: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  input: {
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
  inputError: {
    borderColor: colors.state.error,
  },
  passwordRow: {
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
  fieldError: {
    ...typography.small,
    color: colors.state.error,
  },

  // Forgot
  forgotRow: {
    alignItems: 'flex-end',
    minHeight: layout.minTapTarget,
    justifyContent: 'center',
  },
  forgotText: {
    ...typography.caption,
    color: colors.brand.secondary,
    fontWeight: '500',
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: layout.inputBorderRadius,
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.state.error,
    textAlign: 'center',
  },

  // Primary button
  primaryButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: layout.buttonBorderRadiusParent,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
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

  // OR divider
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  orText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },

  // Apple button
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.text.primary,
    borderRadius: layout.buttonBorderRadiusParent,
    height: 48,
    gap: spacing.sm,
  },
  appleLogo: {
    fontSize: 18,
    color: colors.text.primary,
  },
  appleButtonText: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },

  // Trust badges
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    ...typography.small,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // Terms
  terms: {
    ...typography.small,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  termsLink: {
    color: colors.brand.secondary,
    fontWeight: '500',
  },
});
