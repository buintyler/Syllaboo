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
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import SammyAvatar from '../../components/SammyAvatar';
import AvatarPicker from '../../components/AvatarPicker';
import { colors, typography, spacing, layout, shadows } from '../../constants/theme';
import { validateDisplayName } from '../../lib/validation';
import { useSupabaseClient } from '../../hooks/useSupabaseClient';

export default function CreateChildProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const isFormValid = displayName.trim().length > 0 && selectedAvatarId !== null;

  const handleCreate = async () => {
    if (!user) return;
    setError(null);

    const nameResult = validateDisplayName(displayName);
    if (!nameResult.isValid) {
      setError(nameResult.error);
      return;
    }
    if (!selectedAvatarId) {
      setError('Please choose an avatar');
      return;
    }

    setIsLoading(true);
    try {
      // Get the Supabase user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userError || !userData) throw userError ?? new Error('User not found');

      // Create child profile
      const { error: profileError } = await supabase
        .from('child_profiles')
        .insert({
          parent_id: userData.id,
          display_name: displayName.trim(),
          avatar_id: selectedAvatarId,
          reading_level: 1,
        });

      if (profileError) throw profileError;

      // Mark onboarding as complete
      const { error: updateError } = await supabase
        .from('users')
        .update({ onboarding_complete: true })
        .eq('id', userData.id);

      if (updateError) throw updateError;

      // Navigate to the reading zone
      router.replace('/(reading)');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
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
          <SammyAvatar size="medium" />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>{"Who's going to read with me?"}</Text>
          </View>

          <Text style={styles.heading}>Create reader profile</Text>

          <View style={styles.card}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor={colors.text.disabled}
              value={displayName}
              onChangeText={(t) => { setDisplayName(t); setError(null); }}
              autoCapitalize="words"
              maxLength={20}
              editable={!isLoading}
              accessibilityLabel="Child's first name"
            />

            <Text style={[styles.label, styles.avatarLabel]}>Choose an avatar</Text>
            <AvatarPicker
              selectedId={selectedAvatarId}
              onSelect={(id) => { setSelectedAvatarId(id); setError(null); }}
            />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, (!isFormValid || isLoading) && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Create reader profile and start"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.onBrand} />
            ) : (
              <Text style={styles.primaryButtonText}>{"LET'S GO!"}</Text>
            )}
          </TouchableOpacity>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  speechBubble: {
    backgroundColor: colors.bg.surface,
    borderRadius: layout.cardBorderRadius,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  speechText: {
    ...typography.body,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  heading: {
    ...typography.h2,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: colors.bg.surface,
    borderRadius: layout.cardBorderRadius,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  label: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  avatarLabel: {
    marginTop: spacing.md,
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
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.text.onBrand,
    letterSpacing: 1,
    fontSize: 18,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
