import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import SammyAvatar from '../../components/SammyAvatar';
import { colors, typography, spacing, layout, shadows } from '../../constants/theme';
import { useSupabaseClient } from '../../hooks/useSupabaseClient';

const CONSENT_ITEMS = [
  'Record your child\'s voice during reading sessions to track their progress',
  'Store reading progress and accuracy data to help your child improve',
  'Use first name only for your child\'s profile — no other personal information',
];

export default function ConsentScreen() {
  const [consentChecked, setConsentChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const handleConsent = async () => {
    if (!consentChecked || !user) return;
    setIsLoading(true);
    setError(null);

    try {
      // Ensure user row exists (may not if syncUser failed during sign-up)
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(
          {
            clerk_id: user.id,
            email: user.primaryEmailAddress?.emailAddress ?? '',
            consent_accepted_at: new Date().toISOString(),
          },
          { onConflict: 'clerk_id' },
        );

      if (upsertError) {
        console.error('Consent update failed:', upsertError);
        throw upsertError;
      }

      router.push('/(auth)/create-child-profile');
    } catch (err) {
      console.error('Consent error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SammyAvatar size="medium" />

        <Text style={styles.heading}>Before we begin</Text>
        <Text style={styles.subtext}>
          {'Syllaboo needs your permission to help your child learn to read. Please review and accept the following:'}
        </Text>

        <View style={styles.card}>
          {CONSENT_ITEMS.map((item, index) => (
            <View key={index} style={styles.consentItem}>
              <Text style={styles.checkIcon}>{'✓'}</Text>
              <Text style={styles.consentText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.privacyHeading}>Our promise to you</Text>
          <Text style={styles.privacyText}>
            {'We are committed to protecting your child\'s privacy. Syllaboo is COPPA compliant. We never collect personal information from children beyond a first name. Voice recordings are processed in real time and are never stored. All data is encrypted and accessible only to you.'}
          </Text>
        </View>

        {/* Consent checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setConsentChecked((v) => !v)}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentChecked }}
          accessibilityLabel="I am the parent or legal guardian and I consent to the above"
        >
          <View style={[styles.checkbox, consentChecked && styles.checkboxChecked]}>
            {consentChecked ? <Text style={styles.checkboxMark}>{'✓'}</Text> : null}
          </View>
          <Text style={styles.checkboxLabel}>
            {'I am the parent/legal guardian and I consent to the above'}
          </Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, (!consentChecked || isLoading) && styles.buttonDisabled]}
          onPress={handleConsent}
          disabled={!consentChecked || isLoading}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue to create child profile"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.text.onBrand} />
          ) : (
            <Text style={styles.primaryButtonText}>CONTINUE</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.policyLink}>
          {'Read our full '}
          <Text style={styles.policyLinkText}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heading: {
    ...typography.h1,
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
    gap: spacing.md,
    ...shadows.card,
  },
  consentItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  checkIcon: {
    ...typography.body,
    color: colors.state.success,
    fontWeight: '700',
    marginTop: 2,
  },
  consentText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  privacyHeading: {
    ...typography.h3,
    color: colors.text.primary,
  },
  privacyText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    minHeight: layout.minTapTarget,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border.input,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  checkboxMark: {
    fontSize: 14,
    color: colors.text.onBrand,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
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
  policyLink: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  policyLinkText: {
    color: colors.brand.secondary,
    fontWeight: '500',
  },
});
