import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useState } from 'react';
import SammyAvatar from '../../components/SammyAvatar';
import { colors, typography, spacing, layout, shadows } from '../../constants/theme';

type AuthTab = 'signin' | 'create';

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          {/* Mascot — swap SammyAvatar internals with real art when ready */}
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
                onPress={() => setActiveTab('signin')}
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
                onPress={() => setActiveTab('create')}
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
              style={styles.input}
              placeholder="parent@example.com"
              placeholderTextColor={colors.text.disabled}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Email address"
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.text.disabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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

            {/* Forgot password — sign in only */}
            {activeTab === 'signin' && (
              <TouchableOpacity
                style={styles.forgotRow}
                activeOpacity={0.7}
                accessibilityRole="link"
                accessibilityLabel="Forgot password"
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            {/* Primary CTA */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={activeTab === 'signin' ? 'Sign in' : 'Create account'}
            >
              <Text style={styles.primaryButtonText}>
                {activeTab === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </Text>
            </TouchableOpacity>

            {/* OR divider */}
            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Sign in with Apple — required by Apple for Kids category */}
            <TouchableOpacity
              style={styles.appleButton}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Apple"
            >
              {/* Replace  with Apple logo asset if needed */}
              <Text style={styles.appleLogo}></Text>
              <Text style={styles.appleButtonText}>Sign in with Apple</Text>
            </TouchableOpacity>

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

          {/* Terms — links are acceptable here (parent zone, no parental gate needed on auth screen) */}
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
