import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, layout, typography, shadows } from '../../constants/theme';
import { useReadingSession } from '../../hooks/useReadingSession';
import ReadingTopBar from '../../components/reading/ReadingTopBar';
import SpeechBubble, { getMoodForPhase } from '../../components/reading/SpeechBubble';
import WordDisplay from '../../components/reading/WordDisplay';
import MicButton from '../../components/reading/MicButton';
import SessionControls from '../../components/reading/SessionControls';
import SammyAvatar from '../../components/SammyAvatar';
import LottieAnimation from '../../components/LottieAnimation';
import confettiAnimation from '../../assets/animations/confetti.json';
import starsAnimation from '../../assets/animations/stars-celebration.json';

export default function ReadingSessionScreen() {
  const router = useRouter();
  const {
    phase,
    words,
    currentWordIndex,
    totalWords,
    encouragement,
    lastWordCorrect,
    isListening,
    startListening,
    stopListening,
    advanceWord,
    restart,
    endSession,
  } = useReadingSession();

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleBack = () => {
    if (isListening || currentWordIndex > 0) {
      Alert.alert('Stop reading?', 'Are you sure you want to stop?', [
        { text: 'Keep Reading', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            stopListening();
            endSession();
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  };

  const handleRestart = () => {
    if (currentWordIndex > 0) {
      Alert.alert('Start over?', 'Do you want to read from the beginning?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes!',
          onPress: restart,
        },
      ]);
    } else {
      restart();
    }
  };

  // Celebration screen when reading is complete
  if (phase === 'completed') {
    return (
      <SafeAreaView style={styles.celebrationSafe}>
        {/* Confetti overlay — plays once on top of everything */}
        <LottieAnimation
          source={confettiAnimation}
          style={styles.confettiOverlay}
          loop={false}
        />

        <View style={styles.celebrationContainer}>
          <SammyAvatar size="large" />

          <Text style={styles.celebrationTitle}>GREAT JOB!</Text>
          <Text style={styles.celebrationSubtitle}>You finished the story!</Text>

          {/* Animated stars replacing static emoji */}
          <LottieAnimation
            source={starsAnimation}
            style={styles.starsAnimation}
            loop={3}
          />

          <View style={styles.statBadge}>
            <Text style={styles.statBadgeNumber}>{totalWords}</Text>
            <Text style={styles.statBadgeLabel}>words read!</Text>
          </View>

          <TouchableOpacity
            style={styles.celebrationButton}
            onPress={restart}
            activeOpacity={0.85}
            accessibilityLabel="Read again"
            accessibilityRole="button"
          >
            <Text style={styles.celebrationButtonText}>READ AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.celebrationSecondary}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Done reading"
            accessibilityRole="button"
          >
            <Text style={styles.celebrationSecondaryText}>All done!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ReadingTopBar
        currentWordIndex={currentWordIndex}
        totalWords={totalWords}
        onBack={handleBack}
        onRestart={handleRestart}
      />

      {/* Story title */}
      <Text style={styles.storyTitle}>The Quick Brown Fox</Text>

      <SpeechBubble
        message={encouragement}
        mood={getMoodForPhase(phase, lastWordCorrect)}
      />

      <View style={styles.wordArea}>
        <WordDisplay words={words} />
      </View>

      <MicButton isListening={isListening} onPress={handleMicPress} />

      <SessionControls isListening={isListening} />

      {/* DEV-only controls for testing word advancement */}
      {__DEV__ && (
        <View style={styles.devControls}>
          <TouchableOpacity
            style={[styles.devButton, styles.devCorrect]}
            onPress={() => advanceWord(true)}
          >
            <Text style={styles.devButtonText}>Next Word</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  storyTitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  wordArea: {
    flex: 1,
    justifyContent: 'center',
  },

  // Celebration screen
  celebrationSafe: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    zIndex: 1,
    pointerEvents: 'none',
  },
  celebrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding,
    gap: spacing.sm,
    zIndex: 2,
  },
  celebrationTitle: {
    ...typography.display,
    fontSize: 44,
    color: colors.brand.primary,
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  celebrationSubtitle: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  starsAnimation: {
    width: 260,
    height: 100,
  },
  statBadge: {
    backgroundColor: colors.brand.primary,
    borderRadius: layout.cardBorderRadius,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.button,
  },
  statBadgeNumber: {
    ...typography.display,
    color: colors.text.onBrand,
  },
  statBadgeLabel: {
    ...typography.bodyBold,
    color: colors.text.onBrand,
  },
  celebrationButton: {
    backgroundColor: colors.child.streakOrange,
    borderRadius: layout.buttonBorderRadius,
    height: 60,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    shadowColor: colors.child.streakOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  celebrationButtonText: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.text.onBrand,
    letterSpacing: 2,
  },
  celebrationSecondary: {
    height: 56,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.buttonBorderRadius,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    marginTop: spacing.xs,
  },
  celebrationSecondaryText: {
    ...typography.h3,
    fontWeight: '700',
    color: colors.brand.primary,
  },

  // Dev controls
  devControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  devButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: layout.buttonBorderRadius,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devCorrect: {
    backgroundColor: colors.text.secondary,
  },
  devButtonText: {
    ...typography.caption,
    color: colors.text.onBrand,
    fontWeight: '600',
  },
});
