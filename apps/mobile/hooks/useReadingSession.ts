import { useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export type WordStatus = 'upcoming' | 'current' | 'correct' | 'incorrect' | 'skipped';
export type SessionPhase = 'idle' | 'listening' | 'completed';

export interface DisplayWord {
  wordIndex: number;
  text: string;
  textNormalized: string;
  phonetic: string;
  status: WordStatus;
}

interface StoryWord {
  wordIndex: number;
  text: string;
  textNormalized: string;
  phonetic: string;
  charOffset: number;
}

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {},
  ios: {
    extension: '.raw',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

const MOCK_STORY_WORDS: StoryWord[] = [
  { wordIndex: 0, text: 'The', textNormalized: 'the', phonetic: 'thuh', charOffset: 0 },
  { wordIndex: 1, text: 'quick', textNormalized: 'quick', phonetic: 'kwik', charOffset: 4 },
  { wordIndex: 2, text: 'brown', textNormalized: 'brown', phonetic: 'brown', charOffset: 10 },
  { wordIndex: 3, text: 'fox', textNormalized: 'fox', phonetic: 'foks', charOffset: 16 },
  { wordIndex: 4, text: 'jumps', textNormalized: 'jumps', phonetic: 'juhmps', charOffset: 20 },
  { wordIndex: 5, text: 'over', textNormalized: 'over', phonetic: 'oh-ver', charOffset: 26 },
  { wordIndex: 6, text: 'the', textNormalized: 'the', phonetic: 'thuh', charOffset: 31 },
  { wordIndex: 7, text: 'lazy', textNormalized: 'lazy', phonetic: 'lay-zee', charOffset: 35 },
  { wordIndex: 8, text: 'dog.', textNormalized: 'dog', phonetic: 'dawg', charOffset: 40 },
];

const ENCOURAGEMENTS_IDLE = [
  "Hi there! Ready to read together?",
  "Let's read a story! Tap the blue button!",
  "I can't wait to hear you read!",
];

const ENCOURAGEMENTS_LISTENING = [
  "I'm listening, keep going!",
  "You're doing amazing!",
  'Great reading, keep it up!',
  "Wow, you're a star reader!",
];

const ENCOURAGEMENTS_RESTART = [
  "Let's try again! You've got this!",
  'Starting fresh! Ready to read?',
];

async function cleanupRecording(recording: Audio.Recording | null): Promise<void> {
  if (!recording) return;
  try {
    const status = await recording.getStatusAsync();
    if (status.isRecording) {
      await recording.stopAndUnloadAsync();
    }
    const uri = recording.getURI();
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Recording may already be unloaded — safe to ignore
  }
}

export function useReadingSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordResults, setWordResults] = useState<Map<number, 'correct' | 'incorrect'>>(new Map());
  const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS_IDLE[0]);
  const [lastWordCorrect, setLastWordCorrect] = useState<boolean | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const words: DisplayWord[] = useMemo(
    () =>
      MOCK_STORY_WORDS.map((w) => {
        const result = wordResults.get(w.wordIndex);
        let status: WordStatus = 'upcoming';
        if (result) {
          status = result;
        } else if (w.wordIndex === currentWordIndex) {
          status = 'current';
        }
        return {
          wordIndex: w.wordIndex,
          text: w.text,
          textNormalized: w.textNormalized,
          phonetic: w.phonetic,
          status,
        };
      }),
    [currentWordIndex, wordResults],
  );

  const totalWords = MOCK_STORY_WORDS.length;
  const isListening = phase === 'listening';

  const pickRandom = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

  const startListening = useCallback(async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Microphone needed',
        'Syllaboo needs your microphone to hear you read. Please enable it in Settings.',
      );
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(RECORDING_OPTIONS);
    await recording.startAsync();
    recordingRef.current = recording;

    setPhase('listening');
    setLastWordCorrect(null);
    setEncouragement(pickRandom(ENCOURAGEMENTS_LISTENING));
  }, []);

  const stopListening = useCallback(async () => {
    await cleanupRecording(recordingRef.current);
    recordingRef.current = null;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    setPhase('idle');
    setLastWordCorrect(null);
    setEncouragement(pickRandom(ENCOURAGEMENTS_IDLE));
  }, []);

  const advanceWord = useCallback(
    (wasCorrect: boolean) => {
      setWordResults((prev) => {
        const next = new Map(prev);
        next.set(currentWordIndex, wasCorrect ? 'correct' : 'incorrect');
        return next;
      });

      setLastWordCorrect(wasCorrect);
      setEncouragement(pickRandom(ENCOURAGEMENTS_LISTENING));

      const nextIndex = currentWordIndex + 1;
      if (nextIndex >= totalWords) {
        setPhase('completed');
      } else {
        setCurrentWordIndex(nextIndex);
      }
    },
    [currentWordIndex, totalWords],
  );

  const restart = useCallback(async () => {
    await cleanupRecording(recordingRef.current);
    recordingRef.current = null;

    setPhase('idle');
    setCurrentWordIndex(0);
    setWordResults(new Map());
    setLastWordCorrect(null);
    setEncouragement(pickRandom(ENCOURAGEMENTS_RESTART));
  }, []);

  const endSession = useCallback(async () => {
    await cleanupRecording(recordingRef.current);
    recordingRef.current = null;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    setPhase('completed');
  }, []);

  return {
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
  };
}
