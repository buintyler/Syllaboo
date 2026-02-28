import { View, ActivityIndicator, Text, StyleSheet, SafeAreaView } from 'react-native';
import SammyAvatar from './SammyAvatar';
import { colors, typography, spacing } from '../constants/theme';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SammyAvatar size="medium" />
        <ActivityIndicator
          size="small"
          color={colors.brand.primary}
          style={styles.spinner}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
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
    justifyContent: 'center',
  },
  spinner: {
    marginTop: spacing.lg,
  },
  message: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
